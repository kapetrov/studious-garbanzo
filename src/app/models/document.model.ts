export interface Page {
  number: number;
  imageUrl: string;
}

export interface Document {
  name: string;
  pages: Page[];
}
