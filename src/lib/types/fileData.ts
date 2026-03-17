export interface FileData {
  relativePath: string;
  extension: string;
  size: number;
  lastModified: number;
  content: string | null;
  error?: string;
}
