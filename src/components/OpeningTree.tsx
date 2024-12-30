import { Chapter } from "@/chess/Chapter";
import { PositionNode } from "@/chess/PositionTree";
import React, { useCallback, useMemo, useState } from "react";
import { ForceGraph2D } from "react-force-graph";

interface GraphNode {
  id: string;
  name: string;
  positionNode: PositionNode;
  isRoot?: boolean;
}

interface GraphLink {
  source: string;
  target: string;
}

const OpeningGraph: React.FC<{ chapter: Chapter }> = ({ chapter }) => {
  // Just track which nodes are expanded
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set([chapter.positionTree.position.fen]),
  );

  // Build the graph data based on expanded state
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeMap = new Map<string, GraphNode>();

    // Helper to add a node if we haven't seen it
    const addNode = (positionNode: PositionNode, isRoot = false) => {
      const fen = positionNode.position.fen;
      if (!nodeMap.has(fen)) {
        const node: GraphNode = {
          id: fen,
          name: isRoot ? "Start" : positionNode.position.lastMove?.san || "",
          positionNode,
          isRoot,
        };
        nodes.push(node);
        nodeMap.set(fen, node);
      }
      return nodeMap.get(fen)!;
    };

    // Traverse the tree, adding nodes and links
    const traverse = (node: PositionNode, parentId: string | null) => {
      const currentNode = addNode(node, parentId === null);

      if (parentId) {
        links.push({
          source: parentId,
          target: currentNode.id,
        });
      }

      // Only traverse children if this is root or node is expanded
      if (parentId === null || expandedNodes.has(node.position.fen)) {
        node.children.forEach((child) => traverse(child, currentNode.id));
      }
    };

    traverse(chapter.positionTree, null);
    return { nodes, links };
  }, [chapter, expandedNodes]);

  // Toggle node expansion on click
  const handleNodeClick = useCallback((node: GraphNode) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        next.add(node.id);
      }
      return next;
    });
  }, []);

  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      if (!node?.x || !node?.y) return;

      const label = node.name;
      const fontSize = 16 / globalScale;
      const nodeSize = fontSize;

      const isWhiteMove =
        node.isRoot || node.positionNode.position.lastMove?.player === "w";

      // Draw circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
      ctx.fillStyle = isWhiteMove ? "#ffffff" : "#303030";
      ctx.fill();
      ctx.strokeStyle = "#666666";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isWhiteMove ? "black" : "white";
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.fillText(label, node.x, node.y);

      // Draw expansion dot if node has children
      if (
        node.positionNode.children.length > 0 &&
        !expandedNodes.has(node.id)
      ) {
        ctx.beginPath();
        ctx.arc(node.x + nodeSize * 1.2, node.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = isWhiteMove ? "#303030" : "#ffffff";
        ctx.fill();
      }
    },
    [expandedNodes],
  );

  return (
    <div className="w-full h-[600px] border border-gray-200 rounded-lg bg-white">
      <ForceGraph2D
        graphData={graphData}
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={(node, color, ctx) => {
          const nodeSize = 20;
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, nodeSize, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        onNodeClick={(node) => handleNodeClick(node as GraphNode)}
        dagMode="lr"
        dagLevelDistance={100}
        nodeRelSize={8}
        backgroundColor="#ffffff"
        linkColor={() => "#999999"}
        linkWidth={2}
      />
    </div>
  );
};

export default OpeningGraph;
