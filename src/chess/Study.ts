import { PgnTree } from "./PgnTree";

export type Chapter = {
  index: number;
  name: string;
  tree: PgnTree;
};

export interface Study {
  name: string;
  url: string;
  chapters: Chapter[];
}
