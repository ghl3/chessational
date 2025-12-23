import { Chapter } from "@/chess/Chapter";
import { Position } from "@/chess/Position";
import { WHITE, BLACK, Color } from "chess.js";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Tree, { TreeNodeDatum } from "react-d3-tree";
import { 
  processNode, 
  handleToggle, 
  CustomNodeDatum, 
  isNodeCollapsed, 
  hasAnyChildren,
  groupChaptersByOrientation,
  mergePositionTrees,
} from "./OpeningTreeUtils";

interface OpeningTreeProps {
  chapters: Chapter[];
  onNodeSelect: (position: Position) => void;
}

const containerStyles = {
  width: "100%",
  height: "100%",
  background: "#111827", // gray-900
};

// Double-click detection threshold in ms
const DOUBLE_CLICK_THRESHOLD = 300;

// Initial zoom level - zoomed out significantly to show more of the tree
const INITIAL_ZOOM = 0.4;

// Type for the onUpdate callback
interface TreeUpdateTarget {
  node: TreeNodeDatum | null;
  zoom: number;
  translate: { x: number; y: number };
}

type OrientationTab = "white" | "black";

const OpeningTree: React.FC<OpeningTreeProps> = ({
  chapters,
  onNodeSelect,
}) => {
  // Group chapters by orientation
  const { white: whiteChapters, black: blackChapters } = useMemo(
    () => groupChaptersByOrientation(chapters),
    [chapters]
  );

  // Determine which tabs to show
  const hasWhite = whiteChapters.length > 0;
  const hasBlack = blackChapters.length > 0;
  const hasBoth = hasWhite && hasBlack;

  // Active tab state
  const [activeTab, setActiveTab] = useState<OrientationTab>(hasWhite ? "white" : "black");

  // Update active tab when chapter availability changes
  useEffect(() => {
    if (activeTab === "white" && !hasWhite && hasBlack) {
      setActiveTab("black");
    } else if (activeTab === "black" && !hasBlack && hasWhite) {
      setActiveTab("white");
    }
  }, [hasWhite, hasBlack, activeTab]);

  // Merge trees for each orientation
  const whiteMergedTree = useMemo(() => {
    if (whiteChapters.length === 0) return null;
    const trees = whiteChapters.map((ch) => ch.positionTree);
    return mergePositionTrees(trees);
  }, [whiteChapters]);

  const blackMergedTree = useMemo(() => {
    if (blackChapters.length === 0) return null;
    const trees = blackChapters.map((ch) => ch.positionTree);
    return mergePositionTrees(trees);
  }, [blackChapters]);

  // Process trees into CustomNodeDatum
  const [whiteTreeData, setWhiteTreeData] = useState<CustomNodeDatum | undefined>(undefined);
  const [blackTreeData, setBlackTreeData] = useState<CustomNodeDatum | undefined>(undefined);

  useEffect(() => {
    if (whiteMergedTree) {
      setWhiteTreeData(processNode(whiteMergedTree, 0, 0, WHITE));
    } else {
      setWhiteTreeData(undefined);
    }
  }, [whiteMergedTree]);

  useEffect(() => {
    if (blackMergedTree) {
      setBlackTreeData(processNode(blackMergedTree, 0, 0, BLACK));
    } else {
      setBlackTreeData(undefined);
    }
  }, [blackMergedTree]);

  // Current tree data based on active tab
  const treeData = activeTab === "white" ? whiteTreeData : blackTreeData;
  const setTreeData = activeTab === "white" ? setWhiteTreeData : setBlackTreeData;
  const orientation: Color = activeTab === "white" ? WHITE : BLACK;

  // Controlled zoom and translate state - preserves user's view across data updates
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track if this is the initial render (before user has interacted)
  const hasInitializedRef = useRef(false);

  // Double-click tracking - use refs to persist across renders
  const lastClickTimeRef = useRef<number>(0);
  const lastClickNodeIdRef = useRef<string | null>(null);

  // Set initial translate based on container size
  useEffect(() => {
    if (containerRef.current && !hasInitializedRef.current) {
      const { height } = containerRef.current.getBoundingClientRect();
      // Position tree starting from the left side, centered vertically
      setTranslate({ x: 60, y: height / 2 });
      hasInitializedRef.current = true;
    }
  }, []);

  // Handle tree updates (user panning/zooming) - sync to our controlled state
  const handleTreeUpdate = useCallback((update: TreeUpdateTarget) => {
    // Only update if values actually changed (avoid unnecessary re-renders)
    setTranslate((prev) => {
      if (prev.x !== update.translate.x || prev.y !== update.translate.y) {
        return update.translate;
      }
      return prev;
    });
    setZoom((prev) => {
      if (prev !== update.zoom) {
        return update.zoom;
      }
      return prev;
    });
  }, []);

  // Toggle a node's expansion state
  const toggleNode = useCallback((nodeId: string) => {
    setTreeData((prevData) => {
      if (!prevData) return prevData;
      const newData = handleToggle(prevData, nodeId);
      // Force a new reference to trigger re-render
      return newData ? { ...(newData as CustomNodeDatum) } : undefined;
    });
  }, [setTreeData]);

  // Handle node click - detect single vs double click
  const handleNodeClick = useCallback((node: CustomNodeDatum) => {
    const nodeId = node.nodeId;
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current;
    const isSameNode = lastClickNodeIdRef.current === nodeId;

    if (isSameNode && timeSinceLastClick < DOUBLE_CLICK_THRESHOLD) {
      // Double click detected!
      lastClickTimeRef.current = 0;
      lastClickNodeIdRef.current = null;
      
      // Toggle expansion if node has children (visible or hidden)
      if (hasAnyChildren(node)) {
        toggleNode(nodeId);
      }
    } else {
      // First click or click on different node
      lastClickTimeRef.current = now;
      lastClickNodeIdRef.current = nodeId;
      
      // Select the position on single click
      // Use a small delay to distinguish from double-click
      setTimeout(() => {
        // Only trigger if this is still the last clicked node and no double-click happened
        if (lastClickNodeIdRef.current === nodeId && 
            Date.now() - lastClickTimeRef.current >= DOUBLE_CLICK_THRESHOLD) {
          if (node.position) {
            onNodeSelect(node.position);
          }
        }
      }, DOUBLE_CLICK_THRESHOLD);
    }
  }, [toggleNode, onNodeSelect]);

  // Render custom node element
  const renderCustomNodeElement = useCallback((props: {
    nodeDatum: TreeNodeDatum;
    toggleNode: () => void;
  }) => {
    const customNode = props.nodeDatum as unknown as CustomNodeDatum;
    return (
      <TreeNode 
        nodeDatum={customNode}
        onClick={handleNodeClick}
        orientation={orientation}
      />
    );
  }, [handleNodeClick, orientation]);

  if (!chapters || chapters.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 italic">
        Select chapters to view the opening tree
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Orientation Tabs */}
      {hasBoth && (
        <div className="flex-none flex gap-1 mb-2">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "white"
                ? "bg-gray-100 text-gray-900 border border-gray-300 shadow-sm"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
            onClick={() => setActiveTab("white")}
          >
            As White ({whiteChapters.length})
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "black"
                ? "bg-gray-900 text-gray-100 border border-gray-500"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
            onClick={() => setActiveTab("black")}
          >
            As Black ({blackChapters.length})
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="flex-none flex gap-4 text-xs text-gray-400 mb-2 px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gray-100 border-2 border-blue-400 shadow-[0_0_4px_rgba(59,130,246,0.6)]"></span>
          Your move
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gray-100 border border-gray-400"></span>
          White
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gray-800 border border-gray-600"></span>
          Black
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-yellow-500 flex items-center justify-center text-[8px] text-black font-bold">+</span>
          Expandable
        </span>
      </div>

      {/* Tree Container */}
      <div 
        ref={containerRef} 
        style={containerStyles} 
        className="flex-1 border border-gray-700 rounded-lg overflow-hidden"
      >
        {treeData && (
          <Tree
            data={treeData}
            translate={translate}
            zoom={zoom}
            scaleExtent={{ min: 0.1, max: 2 }}
            onUpdate={handleTreeUpdate}
            renderCustomNodeElement={renderCustomNodeElement}
            orientation="horizontal"
            pathFunc="diagonal"
            collapsible={false}
            shouldCollapseNeighborNodes={false}
            separation={{ siblings: 0.5, nonSiblings: 0.8 }}
            transitionDuration={0}
            pathClassFunc={() => "rd3t-link"}
            zoomable={true}
            draggable={true}
          />
        )}
      </div>
    </div>
  );
};

// Tree node component
const TreeNode: React.FC<{
  nodeDatum: CustomNodeDatum;
  onClick: (node: CustomNodeDatum) => void;
  orientation: Color;
}> = ({ nodeDatum, onClick }) => {
  const isRoot = nodeDatum.attributes?.isRoot === true;
  const isWhiteMove = nodeDatum.position?.lastMove?.player === WHITE;
  const hasChildren = hasAnyChildren(nodeDatum);
  const collapsed = isNodeCollapsed(nodeDatum);
  
  // Determine if this is the player's move based on orientation
  // For the node, isPlayerMove is pre-calculated in processNode
  const isPlayerMove = nodeDatum.isPlayerMove;

  // Node visual size
  const nodeSize = 60;
  // foreignObject size (larger to accommodate hover scale effect)
  const containerSize = 80;
  const offset = -containerSize / 2;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClick(nodeDatum);
  };

  // Base styling - classic chess colors (white/black) with ring for player moves
  let className =
    "flex items-center justify-center rounded-full text-sm font-bold cursor-pointer select-none transition-transform hover:scale-110";

  // Root node styling
  if (isRoot) {
    className += " bg-emerald-600 text-white border-2 border-emerald-400";
  } else if (isWhiteMove) {
    // White's move - cream/white background
    className += " bg-gray-100 text-gray-800 border-2 border-gray-300";
  } else {
    // Black's move - dark background
    className += " bg-gray-800 text-gray-100 border-2 border-gray-600";
  }

  // Player move indicator - blue ring with glow
  const playerMoveStyle: React.CSSProperties = isPlayerMove && !isRoot
    ? {
        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.8), 0 0 12px rgba(59, 130, 246, 0.5)",
        borderColor: "rgb(59, 130, 246)",
      }
    : {
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
      };

  return (
    <g>
      <foreignObject 
        width={containerSize} 
        height={containerSize} 
        x={offset} 
        y={offset}
        style={{ overflow: "visible" }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div
            className={`relative ${className}`}
            style={{ 
              width: nodeSize, 
              height: nodeSize,
              ...playerMoveStyle,
            }}
            onClick={handleClick}
          >
            {nodeDatum.name}
            
            {/* Expansion Badge - show when node has hidden children */}
            {hasChildren && collapsed && (
              <div className="absolute -right-1 -bottom-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-gray-900 shadow-xs z-10">
                <span className="text-black text-[10px] font-bold leading-none">+</span>
              </div>
            )}
          </div>
        </div>
      </foreignObject>
    </g>
  );
};

export default OpeningTree;
