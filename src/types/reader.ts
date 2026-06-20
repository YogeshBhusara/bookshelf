export type FitMode = "height" | "width" | "page";

export type SidebarPanel = "outline" | "thumbnails" | "bookmarks" | null;

export interface OutlineItem {
  title: string;
  page: number | null;
  depth: number;
  items: OutlineItem[];
}

export interface BookBookmark {
  id: string;
  bookId: string;
  page: number;
  label: string;
  createdAt: number;
}

export interface SearchMatch {
  page: number;
  index: number;
  text: string;
  start: number;
  length: number;
}

export interface PageRenderInfo {
  scale: number;
  width: number;
  height: number;
}
