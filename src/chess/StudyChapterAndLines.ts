import { Chapter } from "./Chapter";
import { Line } from "./Line";
import { Study } from "./Study";

export type LineAndChapter = {
  line: Line;
  chapter: Chapter;
};

export type ChapterAndLines = {
  chapter: Chapter;
  lines: Line[];
};

export type StudyChapterAndLines = {
  study: Study;
  chapters: ChapterAndLines[];
};
