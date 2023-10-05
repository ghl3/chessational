import { Chapter } from "./Chapter";

export interface Study {
  name: string;
  url: string;
  chapters: Chapter[];
}
