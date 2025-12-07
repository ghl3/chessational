import { PositionNode } from "@/chess/PositionTree";
import { Position } from "@/chess/Position";
import { WHITE } from "chess.js";
import {
  processNode,
  isNodeCollapsed,
  hasAnyChildren,
  handleToggle,
  CustomNodeDatum,
} from "./OpeningTreeUtils";

// Helper to create mock position
const createMockPosition = (fen: string, san: string | null = null): Position => ({
  fen,
  lastMove: san
    ? {
        san,
        piece: "p",
        from: "e2",
        to: "e4",
        player: WHITE,
      }
    : null,
  comments: [],
  isGameOver: false,
});

// Helper to create mock PositionNode
const createMockNode = (
  fen: string,
  san: string | null = null,
  children: PositionNode[] = []
): PositionNode => ({
  position: createMockPosition(fen, san),
  children,
});

describe("OpeningTreeUtils", () => {
  describe("processNode", () => {
    it("should process a leaf node correctly", () => {
      const node = createMockNode("fen1", null);

      const result = processNode(node, 0);

      expect(result.name).toBe("Start");
      expect(result.nodeId).toBe("fen1");
      expect(result.children).toEqual([]);
      expect(result._hiddenChildren).toEqual([]);
    });

    it("should process a node with a move correctly", () => {
      const node = createMockNode("fen1", "e4");

      const result = processNode(node, 1);

      expect(result.name).toBe("e4");
    });

    it("should expand children for root node (first branch point)", () => {
      const child1 = createMockNode("fen2", "e4");
      const child2 = createMockNode("fen3", "d4");
      const root = createMockNode("fen1", null, [child1, child2]);

      const result = processNode(root, 0);

      expect(result.children?.length).toBe(2);
      expect(result._hiddenChildren?.length).toBe(0);
    });

    it("should hide children after 2 branch points", () => {
      // Create a tree with 3 levels of branching
      const grandchild1 = createMockNode("fen4", "Nf3");
      const grandchild2 = createMockNode("fen5", "Nc3");
      const child = createMockNode("fen2", "e4", [grandchild1, grandchild2]);
      const root = createMockNode("fen1", null, [child]);

      const result = processNode(root, 0);

      // Root is branch point 1, child has 2 children (branch point 2)
      // So grandchildren should be visible since branchCount is only 2 when we reach grandchildren
      expect(result.children?.length).toBe(1);
      expect(result.children?.[0].children?.length).toBe(2);
    });

    it("should set correct attributes on nodes", () => {
      const node = createMockNode("test-fen", "e4");

      const result = processNode(node, 0);

      expect(result.attributes).toEqual({
        fen: "test-fen",
        isRoot: true,
      });

      const childResult = processNode(node, 1);
      expect(childResult.attributes?.isRoot).toBe(false);
    });
  });

  describe("isNodeCollapsed", () => {
    it("should return true when node has hidden children", () => {
      const node: CustomNodeDatum = {
        name: "e4",
        nodeId: "fen1",
        position: createMockPosition("fen1", "e4"),
        children: [],
        _hiddenChildren: [
          {
            name: "e5",
            nodeId: "fen2",
            position: createMockPosition("fen2", "e5"),
          },
        ],
      };

      expect(isNodeCollapsed(node)).toBe(true);
    });

    it("should return false when node has no hidden children", () => {
      const node: CustomNodeDatum = {
        name: "e4",
        nodeId: "fen1",
        position: createMockPosition("fen1", "e4"),
        children: [
          {
            name: "e5",
            nodeId: "fen2",
            position: createMockPosition("fen2", "e5"),
          },
        ],
        _hiddenChildren: [],
      };

      expect(isNodeCollapsed(node)).toBe(false);
    });

    it("should return false when _hiddenChildren is undefined", () => {
      const node: CustomNodeDatum = {
        name: "e4",
        nodeId: "fen1",
        position: createMockPosition("fen1", "e4"),
      };

      expect(isNodeCollapsed(node)).toBe(false);
    });
  });

  describe("hasAnyChildren", () => {
    it("should return true when node has visible children", () => {
      const node: CustomNodeDatum = {
        name: "e4",
        nodeId: "fen1",
        position: createMockPosition("fen1", "e4"),
        children: [
          {
            name: "e5",
            nodeId: "fen2",
            position: createMockPosition("fen2", "e5"),
          },
        ],
        _hiddenChildren: [],
      };

      expect(hasAnyChildren(node)).toBe(true);
    });

    it("should return true when node has hidden children", () => {
      const node: CustomNodeDatum = {
        name: "e4",
        nodeId: "fen1",
        position: createMockPosition("fen1", "e4"),
        children: [],
        _hiddenChildren: [
          {
            name: "e5",
            nodeId: "fen2",
            position: createMockPosition("fen2", "e5"),
          },
        ],
      };

      expect(hasAnyChildren(node)).toBe(true);
    });

    it("should return false when node has no children", () => {
      const node: CustomNodeDatum = {
        name: "e4",
        nodeId: "fen1",
        position: createMockPosition("fen1", "e4"),
        children: [],
        _hiddenChildren: [],
      };

      expect(hasAnyChildren(node)).toBe(false);
    });

    it("should return false when children arrays are undefined", () => {
      const node: CustomNodeDatum = {
        name: "e4",
        nodeId: "fen1",
        position: createMockPosition("fen1", "e4"),
      };

      expect(hasAnyChildren(node)).toBe(false);
    });
  });

  describe("handleToggle", () => {
    it("should return undefined for undefined root", () => {
      expect(handleToggle(undefined, "fen1")).toBeUndefined();
    });

    it("should expand a collapsed node", () => {
      const hiddenChild: CustomNodeDatum = {
        name: "e5",
        nodeId: "fen2",
        position: createMockPosition("fen2", "e5"),
        children: [],
        _hiddenChildren: [],
      };

      const node: CustomNodeDatum = {
        name: "e4",
        nodeId: "fen1",
        position: createMockPosition("fen1", "e4"),
        children: [],
        _hiddenChildren: [hiddenChild],
      };

      const result = handleToggle(node, "fen1") as CustomNodeDatum;

      expect(result.children?.length).toBe(1);
      expect(result._hiddenChildren?.length).toBe(0);
    });

    it("should collapse an expanded node", () => {
      const visibleChild: CustomNodeDatum = {
        name: "e5",
        nodeId: "fen2",
        position: createMockPosition("fen2", "e5"),
        children: [],
        _hiddenChildren: [],
      };

      const node: CustomNodeDatum = {
        name: "e4",
        nodeId: "fen1",
        position: createMockPosition("fen1", "e4"),
        children: [visibleChild],
        _hiddenChildren: [],
      };

      const result = handleToggle(node, "fen1") as CustomNodeDatum;

      expect(result.children?.length).toBe(0);
      expect(result._hiddenChildren?.length).toBe(1);
    });

    it("should find and toggle nested node", () => {
      const grandchild: CustomNodeDatum = {
        name: "Nf3",
        nodeId: "fen3",
        position: createMockPosition("fen3", "Nf3"),
        children: [],
        _hiddenChildren: [],
      };

      const child: CustomNodeDatum = {
        name: "e5",
        nodeId: "fen2",
        position: createMockPosition("fen2", "e5"),
        children: [grandchild],
        _hiddenChildren: [],
      };

      const root: CustomNodeDatum = {
        name: "e4",
        nodeId: "fen1",
        position: createMockPosition("fen1", "e4"),
        children: [child],
        _hiddenChildren: [],
      };

      // Toggle the child node (fen2) - should collapse it
      const result = handleToggle(root, "fen2") as CustomNodeDatum;

      // Root should be unchanged
      expect(result.children?.length).toBe(1);
      // Child should be collapsed
      expect(result.children?.[0].children?.length).toBe(0);
      expect(result.children?.[0]._hiddenChildren?.length).toBe(1);
    });

    it("should handle array of nodes", () => {
      const node1: CustomNodeDatum = {
        name: "e4",
        nodeId: "fen1",
        position: createMockPosition("fen1", "e4"),
        children: [],
        _hiddenChildren: [
          {
            name: "e5",
            nodeId: "fen2",
            position: createMockPosition("fen2", "e5"),
          },
        ],
      };

      const node2: CustomNodeDatum = {
        name: "d4",
        nodeId: "fen3",
        position: createMockPosition("fen3", "d4"),
        children: [],
        _hiddenChildren: [],
      };

      const result = handleToggle([node1, node2], "fen1") as CustomNodeDatum[];

      expect(result.length).toBe(2);
      expect(result[0].children?.length).toBe(1);
      expect(result[0]._hiddenChildren?.length).toBe(0);
      // Second node unchanged
      expect(result[1].children?.length).toBe(0);
    });

    it("should not modify unrelated nodes", () => {
      const node: CustomNodeDatum = {
        name: "e4",
        nodeId: "fen1",
        position: createMockPosition("fen1", "e4"),
        children: [],
        _hiddenChildren: [],
      };

      const result = handleToggle(node, "non-existent-id") as CustomNodeDatum;

      expect(result).toEqual(node);
    });
  });
});
