import { Chapter } from "@/chess/Chapter";
import { PositionNode } from "@/chess/PositionTree";
import { BLACK, WHITE } from "chess.js";
import React, { useCallback } from "react";
import Tree, {
  CustomNodeElementProps,
  RawNodeDatum,
  TreeNodeDatum,
} from "react-d3-tree";

interface ChessNodeDatum extends RawNodeDatum {
  name: string;
  attributes: {
    isWhiteMove: boolean;
    //positionNode: PositionNode;
  };
  children: ChessNodeDatum[];
}

interface OpeningTreeProps {
  chapter: Chapter;
  onNodeClick: (node: ChessNodeDatum) => void;
}

const buildTree = (chapter: Chapter): ChessNodeDatum => {
  const buildChildren = (
    node: PositionNode,
    //node: PositionNode,
    //isWhiteMove: boolean,
  ): ChessNodeDatum[] => {
    return node.children.map((child) => ({
      name: child.position.lastMove?.san || "Start",
      attributes: {
        isWhiteMove: child.position.lastMove?.player === BLACK,
      },
      children: buildChildren(child),
    }));
  };

  return {
    name: "Start",
    //positionNode: chapter.positionTree,
    attributes: {
      //positionNode: chapter.positionTree,
      isWhiteMove: true,
    },
    children: buildChildren(chapter.positionTree),
  };
};

const OpeningTree: React.FC<OpeningTreeProps> = ({ chapter, onNodeClick }) => {
  const data = buildTree(chapter);

  const handleNodeClick = useCallback(
    (nodeData: TreeNodeDatum, event: React.MouseEvent<SVGElement>) => {
      const chessNode = nodeData as RawNodeDatum as ChessNodeDatum;
      console.log("Clicked move:", chessNode.name);
      onNodeClick(chessNode);
    },
    [onNodeClick],
  );

  const renderCustomNode = useCallback(
    ({ nodeDatum }: CustomNodeElementProps) => {
      const chessNode = nodeDatum as RawNodeDatum as ChessNodeDatum;
      return (
        <g onClick={(event) => handleNodeClick(nodeDatum, event)}>
          <circle
            r={10}
            fill={chessNode.attributes.isWhiteMove ? "#f0f0f0" : "#303030"}
          />
          <text
            dy=".31em"
            x={chessNode.children ? -15 : 15}
            textAnchor={chessNode.children ? "end" : "start"}
            style={{
              fill: chessNode.attributes.isWhiteMove ? "black" : "white",
              fontSize: "12px",
            }}
          >
            {chessNode.name}
          </text>
        </g>
      );
    },
    [handleNodeClick],
  );

  return (
    <div style={{ width: "100%", height: "400px" }}>
      <Tree
        data={data}
        orientation="horizontal"
        pathFunc="diagonal"
        translate={{ x: 50, y: 200 }}
        nodeSize={{ x: 100, y: 30 }}
        separation={{ siblings: 1, nonSiblings: 1 }}
        renderCustomNodeElement={renderCustomNode}
      />
    </div>
  );
};

export default OpeningTree;
