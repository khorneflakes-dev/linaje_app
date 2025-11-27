import * as dagre from 'dagre';
import { Position, type Node, type Edge } from '@xyflow/svelte';

const nodeWidth = 200;
const nodeHeight = 60;

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            targetPosition: isHorizontal ? Position.Left : Position.Top,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
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
