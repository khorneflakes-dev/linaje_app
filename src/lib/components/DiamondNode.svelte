<script lang="ts">
  import { Handle, Position, type NodeProps, type Node, useSvelteFlow } from '@xyflow/svelte';

  type NodeData = { label: string; expanded?: boolean; hasChildren?: boolean; childrenCount?: number; onToggle?: () => void };
  type $$Props = NodeProps<Node<NodeData>>;

  export let data: NodeData;
  export let isConnectable: boolean;

  const { fitView } = useSvelteFlow();

  function handleToggle() {
    if (data.onToggle) {
      data.onToggle();
      // Esperar un momento para que el grafo se actualice antes de ajustar la vista
      setTimeout(() => {
        fitView({ duration: 500 });
      }, 100);
    }
  }
</script>

<div class="relative inline-flex items-center rounded-lg border border-gray-300 bg-white pl-4 pr-3 py-2 text-gray-900 shadow-md max-w-xs dark:border-gray-600 dark:bg-gray-900 dark:text-white">
  <!-- Input Handle -->
  <Handle type="target" position={Position.Left} {isConnectable} class="!bg-gray-400" />

  <div class="font-medium {data.hasChildren ? 'mr-8' : ''} overflow-hidden text-ellipsis whitespace-nowrap">
    {data.label}
  </div>

  <!-- Output Handle (Diamond Shape) -->
  <div class="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 translate-x-1/2">
    <Handle
      type="source"
      position={Position.Right}
      {isConnectable}
      class="!w-full !h-full !border-0 !bg-transparent flex items-center justify-center"
    >
        <!-- Diamond Button -->
        {#if data.hasChildren}
        <button
            class="flex h-6 w-6 items-center justify-center rounded-full transition-colors cursor-pointer text-xs font-bold border
                   bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300
                   dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white dark:border-gray-500"
            on:click|stopPropagation={handleToggle}
            aria-label="Toggle children"
        >
            {#if data.expanded}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            {:else}
                {data.childrenCount}
            {/if}
        </button>
        {/if}
    </Handle>
  </div>
</div>
