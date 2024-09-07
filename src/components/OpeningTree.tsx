import { Chapter } from "@/chess/Chapter";
import { PositionNode } from "@/chess/PositionTree";
import { forceX, forceY } from "d3-force";
import React, { useCallback, useMemo, useRef } from "react";
import { ForceGraph2D } from "react-force-graph";

interface NodeObject {
  id: string | number;
  x?: number;
  y?: number;
  [key: string]: any;
}

interface GraphNode extends NodeObject {
  name: string;
  positionNode: PositionNode;
  isRoot?: boolean;
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

  const addNode = (
    positionNode: PositionNode,
    isRoot: boolean = false,
  ): GraphNode => {
    const fen = positionNode.position.fen;
    if (!nodeMap.has(fen)) {
      const node: GraphNode = {
        id: fen,
        name: positionNode.position.lastMove?.san || "Start",
        positionNode: positionNode,
        isRoot: isRoot,
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
    const currentNode = addNode(node, parentNode === null);

    if (parentNode) {
      links.push({
        source: parentNode.id as string,
        target: currentNode.id as string,
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
  const fgRef = useRef<any>();

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      console.log("Clicked move:", node.name);
      onNodeClick(node.positionNode);
    },
    [onNodeClick],
  );

  const nodeCanvasObject = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.name;
      const fontSize = 12 / globalScale;
      ctx.font = `${fontSize}px Sans-Serif`;
      const textWidth = ctx.measureText(label).width;
      const bckgDimensions = [textWidth, fontSize].map(
        (n) => n + fontSize * 0.2,
      );

      // Determine if it's White's turn based on the last move's player
      const isWhiteTurn =
        node.positionNode.position.lastMove?.player === "b" || node.isRoot;

      ctx.fillStyle = isWhiteTurn ? "#f0f0f0" : "#303030";
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, bckgDimensions[1] * 0.6, 0, 2 * Math.PI, false);
      ctx.fill();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isWhiteTurn ? "black" : "white";
      ctx.fillText(label, node.x!, node.y!);
    },
    [],
  );

  React.useEffect(() => {
    const fg = fgRef.current;
    // Aim to position nodes in a tree-like structure
    fg.d3Force("charge").strength(-400);
    fg.d3Force("link").distance(50);
    fg.d3Force("center", null);
    fg.d3Force(
      "x",
      forceX<GraphNode>((node) => (node.isRoot ? 0 : 300)).strength((node) =>
        node.isRoot ? 1 : 0.1,
      ),
    );
    fg.d3Force("y", forceY<GraphNode>(0).strength(0.1));
  }, []);

  return (
    <div style={{ width: "100%", height: "600px" }}>
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeLabel="name"
        linkLabel="name"
        //nodeRelSize={(node: GraphNode) => (node.isRoot ? 8 : 5)}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        onNodeClick={(node) => handleNodeClick(node as GraphNode)}
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, 5, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
      />
    </div>
  );
};

export default OpeningGraph;
