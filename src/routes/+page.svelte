<script lang="ts">
  import { writable } from 'svelte/store';
  import { onMount } from 'svelte';
  import {
    SvelteFlow,
    Controls,
    Background,
    BackgroundVariant,
    useSvelteFlow,
    type Node,
    type Edge
  } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import DiamondNode from '$lib/components/DiamondNode.svelte';
  import FileUpload from '$lib/components/FileUpload.svelte';
  import { getLayoutedElements, getHiddenDescendants } from '$lib/utils/graphUtils';

  let nodes = writable<Node[]>([]);
  let edges = writable<Edge[]>([]);

  const nodeTypes = {
    diamond: DiamondNode
  };

  function onNodeToggle(nodeId: string) {
    nodes.update(ns => {
      const nodeIndex = ns.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) return ns;

      const node = ns[nodeIndex];
      const isExpanded = node.data.expanded;
      
      // Toggle current node state
      ns[nodeIndex] = {
        ...node,
        data: { ...node.data, expanded: !isExpanded }
      };

      // Find all descendants to limit scope of updates
      let $edges: Edge[] = [];
      edges.subscribe(e => $edges = e)();
      
      const descendants = getHiddenDescendants(nodeId, $edges);
      const descendantSet = new Set(descendants);

      // Create a map for quick node lookup
      const nodeMap = new Map(ns.map(n => [n.id, n]));

      // Determine which descendants should be visible
      const visibleDescendants = new Set<string>();
      
      if (!isExpanded) { // We are expanding (toggle happened before this block? No, wait.)
         // In the previous code:
         // const isExpanded = node.data.expanded;
         // ns[nodeIndex] = { ... data: { expanded: !isExpanded } };
         // So `isExpanded` is the OLD state.
         // If OLD was false (collapsed), NEW is true (expanding).
         
         // If we are expanding:
         const queue = [nodeId];
         while (queue.length > 0) {
             const parentId = queue.shift()!;
             const parent = nodeMap.get(parentId);
             
             // If parent is expanded (check the NEW state for the root, and current state for others)
             // For the root node (nodeId), we just toggled it, so we use !isExpanded.
             // For other nodes, we use their existing data.expanded.
             
             const parentExpanded = parentId === nodeId ? !isExpanded : parent?.data.expanded;
             
             if (parentExpanded) {
                 const children = $edges.filter(e => e.source === parentId).map(e => e.target);
                 children.forEach(childId => {
                     if (descendantSet.has(childId)) {
                         visibleDescendants.add(childId);
                         queue.push(childId);
                     }
                 });
             }
         }
      }

      const updatedNodes = ns.map(n => {
        if (descendantSet.has(n.id)) {
            return { ...n, hidden: !visibleDescendants.has(n.id) };
        }
        return n;
      });

      // Save to localStorage
      saveGraphData(updatedNodes, $edges);
      
      return updatedNodes;
    });
  }

  let originalData: any = null;

  function transformDataToGraph(data: any) {
    originalData = data;
    let newNodes: Node[] = [];
    let newEdges: Edge[] = [];
    
    // Recursive function to parse tree
    function traverse(item: any, parentId: string | null = null) {
      const id = item.id || crypto.randomUUID();
      
      const node: Node = {
        id,
        type: 'diamond',
        data: { 
            label: item.name || 'Unknown', 
            expanded: true,
            hasChildren: item.children && item.children.length > 0,
            childrenCount: item.children ? item.children.length : 0,
            onToggle: () => onNodeToggle(id)
        },
        position: { x: 0, y: 0 } // Layout will fix this
      };
      
      newNodes.push(node);

      if (parentId) {
        newEdges.push({
          id: `e${parentId}-${id}`,
          source: parentId,
          target: id,
          type: 'smoothstep',
          animated: true
        });
      }

      if (item.children && Array.isArray(item.children)) {
        item.children.forEach((child: any) => traverse(child, id));
      }
    }

    if (Array.isArray(data)) {
      data.forEach(item => traverse(item));
    } else {
      traverse(data);
    }

    const layout = getLayoutedElements(newNodes, newEdges);
    nodes.set(layout.nodes);
    edges.set(layout.edges);
    
    // Save to localStorage
    saveGraphData(layout.nodes, layout.edges);
  }

  function saveGraphData(nodeData: Node[], edgeData: Edge[]) {
    if (typeof window !== 'undefined' && originalData) {
      localStorage.setItem('graphData', JSON.stringify(originalData));
      localStorage.setItem('nodeStates', JSON.stringify(nodeData.map(n => ({
        id: n.id,
        hidden: n.hidden,
        expanded: n.data.expanded
      }))));
    }
  }

  function handleJsonLoad(event: CustomEvent) {
    transformDataToGraph(event.detail);
  }

  let isDarkMode = false;

  function toggleTheme() {
    isDarkMode = !isDarkMode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }
  }

  // Load saved data on mount
  onMount(() => {
    if (typeof window !== 'undefined') {
      // Load theme
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        isDarkMode = savedTheme === 'dark';
      }

      // Load graph data
      const savedGraphData = localStorage.getItem('graphData');
      if (savedGraphData) {
        try {
          const data = JSON.parse(savedGraphData);
          transformDataToGraph(data);
          
          // Restore node states
          const savedNodeStates = localStorage.getItem('nodeStates');
          if (savedNodeStates) {
            const states = JSON.parse(savedNodeStates);
            nodes.update(ns => {
              return ns.map(n => {
                const state = states.find((s: any) => s.id === n.id);
                if (state) {
                  return {
                    ...n,
                    hidden: state.hidden,
                    data: { ...n.data, expanded: state.expanded }
                  };
                }
                return n;
              });
            });
          }
        } catch (e) {
          console.error('Failed to load saved graph data', e);
        }
      }
    }
  });
</script>

<div class="h-screen w-screen relative {isDarkMode ? 'dark' : ''}">
  <!-- Floating Menu -->
  <div class="absolute top-4 left-4 z-10 flex items-center gap-4 p-3 rounded-xl shadow-lg border transition-colors
              bg-white/90 backdrop-blur-sm border-gray-200 dark:bg-gray-900/90 dark:border-slate-300">
    <h1 class="text-lg font-bold text-gray-900 dark:text-white">Altitude Data Lineage</h1>
    
    <div class="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-2"></div>

    <button
        on:click={toggleTheme}
        class="p-2 rounded-full transition-colors
               bg-gray-100 text-gray-600 hover:bg-gray-200
               dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        aria-label="Toggle Theme"
    >
        {#if isDarkMode}
            <!-- Sun Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
        {:else}
            <!-- Moon Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
        {/if}
    </button>

    <div class="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-2"></div>

    <FileUpload on:load={handleJsonLoad} />
  </div>
  
  <div class="w-full h-full bg-gray-50 dark:bg-gray-950 transition-colors">
    <SvelteFlow
      nodes={$nodes}
      edges={$edges}
      {nodeTypes}
      fitView
      class="bg-gray-50 dark:bg-gray-950"
      colorMode={isDarkMode ? 'dark' : 'light'}
    >
      <Controls />
      <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
    </SvelteFlow>
  </div>
</div>
