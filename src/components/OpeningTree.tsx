import { Chapter } from "@/chess/Chapter";
import { PositionNode } from "@/chess/PositionTree";
import * as d3 from "d3-force";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ForceGraph2D, ForceGraphMethods } from "react-force-graph";

interface GraphNode {
  id: string;
  name: string;
  positionNode: PositionNode;
  isRoot?: boolean;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string;
  target: string;
}

const OpeningGraph: React.FC<{ chapter: Chapter }> = ({ chapter }) => {
  const fgRef = useRef<ForceGraphMethods>();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set([chapter.positionTree.position.fen]),
  );

  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeMap = new Map<string, GraphNode>();

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

    const traverse = (node: PositionNode, parentId: string | null) => {
      const currentNode = addNode(node, parentId === null);

      if (parentId) {
        links.push({ source: parentId, target: currentNode.id });
      }

      if (parentId === null || expandedNodes.has(node.position.fen)) {
        node.children.forEach((child) => traverse(child, currentNode.id));
      }
    };

    traverse(chapter.positionTree, null);
    return { nodes, links };
  }, [chapter, expandedNodes]);

  useEffect(() => {
    if (!fgRef.current) return;

    const fg = fgRef.current;

    const forceLink = fg.d3Force("link");
    if (forceLink) {
      forceLink.distance(150);
    }

    const forceCharge = fg.d3Force("charge");
    if (forceCharge) {
      forceCharge.strength(-400);
    }

    const forceCollide = fg.d3Force("collision");
    if (!forceCollide) {
      fg.d3Force("collision", d3.forceCollide(40));
    }

    const forceCenter = fg.d3Force("center");
    if (forceCenter) {
      forceCenter.strength(0.05);
    }
  }, [graphData]);

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

  const renderNode = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      if (!node?.x || !node?.y) return;

      const fontSize = 16 / globalScale;
      const nodeSize = fontSize * 1.2;
      const glowSize = 3;
      const isWhiteMove =
        node.isRoot || node.positionNode.position.lastMove?.player === "w";

      const gradient = ctx.createRadialGradient(
        node.x,
        node.y,
        nodeSize - glowSize,
        node.x,
        node.y,
        nodeSize + glowSize,
      );
      gradient.addColorStop(0, isWhiteMove ? "#ffffff40" : "#30303040");
      gradient.addColorStop(1, "#00000000");

      // Glow effect
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize + glowSize, 0, 2 * Math.PI);
      ctx.fill();

      // Main circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
      ctx.fillStyle = isWhiteMove ? "#ffffff" : "#303030";
      ctx.fill();
      ctx.strokeStyle = isWhiteMove ? "#ffffff44" : "#30303044";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isWhiteMove ? "#000000" : "#ffffff";
      ctx.font = `${fontSize}px Inter, Sans-Serif`;
      ctx.fillText(node.name, node.x, node.y);

      // Expansion indicator
      if (
        node.positionNode.children.length > 0 &&
        !expandedNodes.has(node.id)
      ) {
        ctx.beginPath();
        ctx.arc(node.x + nodeSize * 1.2, node.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = "#666666";
        ctx.fill();
        ctx.strokeStyle = "#ffffff22";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    },
    [expandedNodes],
  );

  return (
    <div className="w-full h-[600px] border border-gray-700 rounded-lg bg-gray-900">
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeCanvasObject={renderNode}
        nodePointerAreaPaint={(node, color, ctx, globalScale) => {
          const fontSize = 16 / globalScale;
          const nodeSize = fontSize * 1.2;
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, nodeSize, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        onNodeClick={(node) => handleNodeClick(node as GraphNode)}
        dagMode="lr"
        dagLevelDistance={150}
        nodeRelSize={10}
        backgroundColor="#111827"
        linkColor={() => "#ffffff22"}
        linkWidth={1.5}
        d3VelocityDecay={0.3}
        warmupTicks={50}
        cooldownTicks={100}
      />
    </div>
  );
};

export default OpeningGraph;
