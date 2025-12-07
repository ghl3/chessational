import { Chapter } from "@/chess/Chapter";
import { Position } from "@/chess/Position";
import React, { useEffect, useState, useRef, useCallback } from "react";
import Tree, { TreeNodeDatum } from "react-d3-tree";
import { processNode, handleToggle, CustomNodeDatum, isNodeCollapsed, hasAnyChildren } from "./OpeningTreeUtils";

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

const OpeningTree: React.FC<OpeningTreeProps> = ({
  chapters,
  onNodeSelect,
}) => {
  const [treeData, setTreeData] = useState<CustomNodeDatum | undefined>(undefined);
  
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

  useEffect(() => {
    if (!chapters || chapters.length === 0) {
      setTreeData(undefined);
      return;
    }

    // For now, take the first chapter. 
    const chapter = chapters[0];
    const root = chapter.positionTree;

    setTreeData(processNode(root, 0, 0));
  }, [chapters]);

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
  }, []);

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
      />
    );
  }, [handleNodeClick]);

  return (
    <div 
      ref={containerRef} 
      style={containerStyles} 
      className="border border-gray-700 rounded-lg overflow-hidden"
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
  );
};

// Tree node component
const TreeNode: React.FC<{
  nodeDatum: CustomNodeDatum;
  onClick: (node: CustomNodeDatum) => void;
}> = ({ nodeDatum, onClick }) => {
  const isRoot = nodeDatum.attributes?.isRoot === true;
  const isWhite = nodeDatum.position?.lastMove?.player === "w";
  const hasChildren = hasAnyChildren(nodeDatum);
  const collapsed = isNodeCollapsed(nodeDatum);

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

  let className =
    "flex items-center justify-center rounded-full border-2 text-sm font-bold cursor-pointer select-none shadow-md transition-transform hover:scale-110";

  if (isRoot) {
    className += " bg-blue-600 text-white border-blue-400";
  } else if (isWhite) {
    className += " bg-white text-black border-gray-300";
  } else {
    // Black move
    className += " bg-black text-white border-gray-600";
  }

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
            style={{ width: nodeSize, height: nodeSize }}
            onClick={handleClick}
          >
            {nodeDatum.name}
            
            {/* Expansion Badge - show when node has hidden children */}
            {hasChildren && collapsed && (
              <div className="absolute -right-1 -bottom-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-gray-900 shadow-sm z-10">
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
