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

const OpeningTree: React.FC<OpeningTreeProps> = ({
  chapters,
  onNodeSelect,
}) => {
  const [treeData, setTreeData] = useState<CustomNodeDatum | undefined>(undefined);
  
  // Center the tree initially
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Double-click tracking - use refs to persist across renders
  const lastClickTimeRef = useRef<number>(0);
  const lastClickNodeIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setTranslate({ x: width / 2, y: 50 });
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
          renderCustomNodeElement={renderCustomNodeElement}
          orientation="horizontal"
          pathFunc="diagonal"
          collapsible={false} // We handle collapsing ourselves
          separation={{ siblings: 0.5, nonSiblings: 0.8 }}
          transitionDuration={300}
          pathClassFunc={() => "rd3t-link"}
          zoomable={true}
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

  const size = 60;
  const x = -size / 2;
  const y = -size / 2;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClick(nodeDatum);
  };

  let className =
    "relative flex items-center justify-center w-full h-full rounded-full border-2 text-sm font-bold cursor-pointer select-none shadow-md transition-transform hover:scale-105";

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
      <foreignObject width={size} height={size} x={x} y={y}>
        <div
          className={className}
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
      </foreignObject>
    </g>
  );
};

export default OpeningTree;
