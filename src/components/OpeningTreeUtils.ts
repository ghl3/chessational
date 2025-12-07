import { RawNodeDatum } from "react-d3-tree";
import { PositionNode } from "@/chess/PositionTree";
import { Position } from "@/chess/Position";

export interface CustomNodeDatum extends RawNodeDatum {
  position: Position;
  nodeId: string; // FEN
  children?: CustomNodeDatum[];
  _hiddenChildren?: CustomNodeDatum[]; // Children that are collapsed/hidden
}

/**
 * Process a PositionNode tree into CustomNodeDatum for react-d3-tree.
 * 
 * Initial expansion logic:
 * - Expand through the tree until we've passed 2 branching points
 * - A branching point is a node with more than 1 child (root counts as 1st)
 * - Single-child chains don't count as branches
 */
export const processNode = (
  node: PositionNode,
  depth: number,
  branchCount: number = 0
): CustomNodeDatum => {
  const isRoot = depth === 0;
  const moveSan = node.position.lastMove?.san || "Start";
  const hasMultipleChildren = node.children.length > 1;

  // Root counts as the first branch point if it has children
  const isBranchPoint = hasMultipleChildren || (isRoot && node.children.length > 0);
  const newBranchCount = isBranchPoint ? branchCount + 1 : branchCount;

  // Process all children recursively first
  const processedChildren = node.children.map((child) => 
    processNode(child, depth + 1, newBranchCount)
  );

  // Determine if THIS node's children should be hidden
  // Hide children if we've already passed 2 branch points
  const shouldHideChildren = branchCount >= 2;

  const datum: CustomNodeDatum = {
    name: moveSan,
    nodeId: node.position.fen,
    position: node.position,
    attributes: {
      fen: node.position.fen,
      isRoot: isRoot,
    },
    // If children should be hidden, put them in _hiddenChildren instead
    children: shouldHideChildren ? [] : processedChildren,
    _hiddenChildren: shouldHideChildren ? processedChildren : [],
  };

  return datum;
};

/**
 * Deep clone a node and its children
 */
const cloneNode = (node: CustomNodeDatum): CustomNodeDatum => {
  return {
    ...node,
    children: node.children?.map(cloneNode),
    _hiddenChildren: node._hiddenChildren?.map(cloneNode),
  };
};

/**
 * Expand a node: move hidden children to visible, expanding through single-child chains
 * until we hit a branch point (multiple children) or a leaf.
 */
const expandNode = (node: CustomNodeDatum): CustomNodeDatum => {
  const hiddenChildren = node._hiddenChildren || [];
  
  if (hiddenChildren.length === 0) {
    // Nothing to expand
    return node;
  }

  // Move hidden children to visible
  let expandedChildren = hiddenChildren.map(cloneNode);

  // If there's exactly one child, recursively expand it too
  if (expandedChildren.length === 1) {
    expandedChildren = [expandNode(expandedChildren[0])];
  }
  // If there are multiple children (branch point), just show them but don't expand further

  return {
    ...node,
    children: expandedChildren,
    _hiddenChildren: [],
  };
};

/**
 * Collapse a node: move visible children to hidden
 */
const collapseNode = (node: CustomNodeDatum): CustomNodeDatum => {
  const visibleChildren = node.children || [];
  
  if (visibleChildren.length === 0) {
    // Nothing to collapse
    return node;
  }

  return {
    ...node,
    children: [],
    _hiddenChildren: visibleChildren.map(cloneNode),
  };
};

/**
 * Check if a node is currently collapsed (has hidden children)
 */
export const isNodeCollapsed = (node: CustomNodeDatum): boolean => {
  return (node._hiddenChildren?.length ?? 0) > 0;
};

/**
 * Check if a node has any children (visible or hidden)
 */
export const hasAnyChildren = (node: CustomNodeDatum): boolean => {
  return (node.children?.length ?? 0) > 0 || (node._hiddenChildren?.length ?? 0) > 0;
};

/**
 * Toggle expansion state of a node by its ID
 */
export const handleToggle = (
  root: CustomNodeDatum | CustomNodeDatum[] | undefined,
  targetNodeId: string
): CustomNodeDatum | CustomNodeDatum[] | undefined => {
  if (!root) return undefined;
  
  const toggleRecursive = (node: CustomNodeDatum): CustomNodeDatum => {
    if (node.nodeId === targetNodeId) {
      // Found the target node - toggle it
      if (isNodeCollapsed(node)) {
        return expandNode(node);
      } else {
        return collapseNode(node);
      }
    }

    // Not the target, recurse into visible children
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: node.children.map(toggleRecursive),
      };
    }

    return node;
  };

  if (Array.isArray(root)) {
    return root.map(toggleRecursive);
  }
  
  return toggleRecursive(root);
};
