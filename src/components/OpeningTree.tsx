import { Chapter } from "@/chess/Chapter";
import { PositionNode } from "@/chess/PositionTree";
import React, { useCallback, useMemo } from "react";
import { ForceGraph2D } from "react-force-graph";

interface GraphNode {
  id: string;
  name: string;
  positionNode: PositionNode;
}

interface GraphLink {
  source: string;
  target: string;
  name: string;
}

interface OpeningGraphProps {
  chapter: Chapter;
  onNodeClick: (node: PositionNode) => void;
}

const buildGraph = (
  chapter: Chapter,
): { nodes: GraphNode[]; links: GraphLink[] } => {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeMap: Map<string, GraphNode> = new Map();

  const addNode = (positionNode: PositionNode): GraphNode => {
    const fen = positionNode.position.fen;
    if (!nodeMap.has(fen)) {
      const node: GraphNode = {
        id: fen,
        name: positionNode.position.lastMove?.san || "Start",
        positionNode: positionNode,
      };
      nodes.push(node);
      nodeMap.set(fen, node);
    }
    return nodeMap.get(fen)!;
  };

  const traversePositions = (
    node: PositionNode,
    parentNode: GraphNode | null,
  ) => {
    const currentNode = addNode(node);

    if (parentNode) {
      links.push({
        source: parentNode.id,
        target: currentNode.id,
        name: node.position.lastMove?.san || "",
      });
    }

    for (const child of node.children) {
      traversePositions(child, currentNode);
    }
  };

  traversePositions(chapter.positionTree, null);
  return { nodes, links };
};

const OpeningGraph: React.FC<OpeningGraphProps> = ({
  chapter,
  onNodeClick,
}) => {
  const graphData = useMemo(() => buildGraph(chapter), [chapter]);

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      console.log("Clicked move:", node.name);
      onNodeClick(node.positionNode);
    },
    [onNodeClick],
  );

  return (
    <div style={{ width: "100%", height: "400px" }}>
      <ForceGraph2D
        graphData={graphData}
        nodeLabel="name"
        linkLabel="name"
        nodeColor={(node) =>
          (node as GraphNode).positionNode.position.lastMove?.player === "w"
            ? "#f0f0f0"
            : "#303030"
        }
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        onNodeClick={(node) => handleNodeClick(node as GraphNode)}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = (node as GraphNode).name;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle =
            (node as GraphNode).positionNode.position.lastMove?.player === "w"
              ? "black"
              : "white";
          ctx.fillText(label, node.x!, node.y!);
        }}
      />
    </div>
  );
};

export default OpeningGraph;
