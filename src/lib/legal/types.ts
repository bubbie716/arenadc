export interface LegalSubsection {
  title: string;
  paragraphs?: string[];
  listItems?: string[];
  codeBlocks?: string[][];
}

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  listItems?: string[];
  codeBlocks?: string[][];
  subsections?: LegalSubsection[];
}
