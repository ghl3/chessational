import { Chapter } from "./Chapter";
import { Line } from "./Line";
import { PositionTree } from "./PositionTree";
import { Study } from "./Study";

export type ChapterAndTree = {
  chapter: Chapter;
  tree: PositionTree;
};

export type ChapterAndLines = {
  chapter: Chapter;
  lines: Line[];
};

export type StudyChapterAndLines = {
  study: Study;
  chapters: ChapterAndLines[];
};
