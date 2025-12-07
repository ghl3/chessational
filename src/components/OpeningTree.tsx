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
import ForceGraph2D from "react-force-graph-2d";

interface BaseGraphNode {
  id: string;
  name: string;
  positionNode: PositionNode;
  isRoot?: boolean;
  depth?: number;
  // Force graph properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
}

type GraphNode = BaseGraphNode;

interface GraphLink {
  source: string;
  target: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const OpeningGraph: React.FC<{ chapter: Chapter }> = ({ chapter }) => {
  const fgRef = useRef<any>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set([chapter.positionTree.position.fen]),
  );

  // Reset expanded nodes when chapter changes
  useEffect(() => {
    setExpandedNodes(new Set([chapter.positionTree.position.fen]));
  }, [chapter.positionTree.position.fen]);

  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeMap = new Map<string, GraphNode>();

    const addNode = (positionNode: PositionNode, isRoot = false, depth = 0) => {
      const fen = positionNode.position.fen;
      if (!nodeMap.has(fen)) {
        const node: GraphNode = {
          id: fen,
          name: isRoot ? "Start" : positionNode.position.lastMove?.san || "",
          positionNode,
          isRoot,
          depth,
        };
        nodes.push(node);
        nodeMap.set(fen, node);
      }
      return nodeMap.get(fen)!;
    };

    const traverse = (
      node: PositionNode,
      parentId: string | null,
      depth = 0,
    ) => {
      const currentNode = addNode(node, parentId === null, depth);

      if (parentId) {
        links.push({
          source: parentId,
          target: currentNode.id,
        });
      }

      if (parentId === null || expandedNodes.has(node.position.fen)) {
        node.children.forEach((child) =>
          traverse(child, currentNode.id, depth + 1),
        );
      }
    };

    traverse(chapter.positionTree, null);
    return { nodes, links };
  }, [chapter, expandedNodes]);

  useEffect(() => {
    if (!fgRef.current) return;
    const fg = fgRef.current;

    // Configure link force - smoother distances
    const forceLink = fg.d3Force("link");
    if (forceLink) {
      forceLink
        .distance((link: any) => {
          const source = link.source as GraphNode;
          const target = link.target as GraphNode;
          const depth = Math.max(
            source.depth || 0,
            target.depth || 0,
          );
          // More consistent spacing
          return 150 + depth * 30;
        })
        .strength(1); // Stronger link force for more rigidity
    }

    // Gentler charge force
    fg.d3Force(
      "charge",
      d3
        .forceManyBody()
        .strength(-300) // Reduced strength for less zigzag
        .distanceMin(100) // Prevent nodes from getting too close
        .distanceMax(500), // Limit long-range repulsion
    );

    // Stronger collision force for better spacing
    fg.d3Force(
      "collision",
      d3
        .forceCollide()
        .radius((d: any) => {
          const node = d as GraphNode;
          return 50 + (node.depth || 0) * 5; // More consistent node spacing
        })
        .strength(0.8), // Strong enough to prevent overlap but not cause zigzag
    );

    // Stronger center force to keep layout balanced
    fg.d3Force("center", d3.forceCenter().strength(0.15));

    fg.d3ReheatSimulation();
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
      if (node.x === undefined || node.y === undefined) return;

      const fontSize = 16 / globalScale;
      const nodeSize = fontSize * 1.2;
      const glowSize = 3;
      const isWhiteMove =
        !node.isRoot && node.positionNode.position.lastMove?.player === "w";

      // Different styling for root node
      const fillColor = node.isRoot
        ? "#3b82f6"
        : isWhiteMove
        ? "#ffffff"
        : "#303030";
      const glowColor = node.isRoot
        ? "#3b82f640"
        : isWhiteMove
        ? "#ffffff40"
        : "#30303040";
      const strokeColor = node.isRoot
        ? "#3b82f644"
        : isWhiteMove
        ? "#ffffff44"
        : "#30303044";
      const textColor = node.isRoot
        ? "#ffffff"
        : isWhiteMove
        ? "#000000"
        : "#ffffff";

      // Glow effect
      const gradient = ctx.createRadialGradient(
        node.x,
        node.y,
        nodeSize - glowSize,
        node.x,
        node.y,
        nodeSize + glowSize,
      );
      gradient.addColorStop(0, glowColor);
      gradient.addColorStop(1, "#00000000");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize + glowSize, 0, 2 * Math.PI);
      ctx.fill();

      // Main circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = textColor;
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
        nodePointerAreaPaint={(node: GraphNode, color, ctx, globalScale) => {
          const fontSize = 16 / globalScale;
          const nodeSize = fontSize * 1.2;
          if (node.x !== undefined && node.y !== undefined) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
          }
        }}
        onNodeClick={(node) => handleNodeClick(node as GraphNode)}
        backgroundColor="#111827"
        linkColor={() => "#ffffff22"}
        linkWidth={1.5}
        d3VelocityDecay={0.3}
        warmupTicks={100}
        cooldownTicks={200}
        d3AlphaMin={0.1}
      />
    </div>
  );
};

export default OpeningGraph;
