import * as dagre from 'dagre';
import { Position, type Node, type Edge } from '@xyflow/svelte';

const nodeWidth = 200;
const nodeHeight = 60;

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({
        rankdir: direction,
        ranksep: 250, // Significantly more spacing between ranks to accommodate long labels
        nodesep: 20   // Increase spacing between nodes in same rank
    });

    nodes.forEach((node) => {
        // Use uniform width for all nodes to ensure proper alignment
        const uniformWidth = 280;
        const nodeHeight = 60;

        dagreGraph.setNode(node.id, { width: uniformWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const nodeData = dagreGraph.node(node.id);
        return {
            ...node,
            targetPosition: isHorizontal ? Position.Left : Position.Top,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            position: {
                x: nodeWithPosition.x - nodeData.width / 2,
                y: nodeWithPosition.y - nodeData.height / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

export const getHiddenDescendants = (nodeId: string, edges: Edge[]): string[] => {
    const children = edges.filter(e => e.source === nodeId).map(e => e.target);
    let descendants = [...children];

    children.forEach(childId => {
        descendants = [...descendants, ...getHiddenDescendants(childId, edges)];
    });

    return descendants;
};

export const getAncestors = (nodeId: string, edges: Edge[]): string[] => {
    const parents = edges.filter(e => e.target === nodeId).map(e => e.source);
    let ancestors = [...parents];

    parents.forEach(parentId => {
        ancestors = [...ancestors, ...getAncestors(parentId, edges)];
    });

    return ancestors;
};
