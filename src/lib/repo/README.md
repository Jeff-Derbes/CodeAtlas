# Repository Scanner

A utility for recursively scanning repository directories and returning metadata about files that should be indexed.

## Features

- Recursively scans directories while respecting ignore rules
- Filters by allowed file extensions (`.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.md`)
- Ignores common directories like `.git`, `node_modules`, `dist`, etc.
- Provides detailed file metadata including absolute path, relative path, extension, size, and last modified timestamp

## Usage Example

```typescript
import { scanRepo } from "@/lib/repo";

// Scan a repository directory
const files = scanRepo("./my-repo");

console.log(`Found ${files.length} files to index`);
files.forEach((file) => {
  console.log(`${file.relativePath} (${file.size} bytes)`);
});
```

## File Metadata

Each file in the returned array contains:

- `absolutePath`: Full path to the file
- `relativePath`: Path relative to repository root
- `extension`: File extension including the dot (e.g., `.ts`, `.js`)
- `size`: Size of the file in bytes
- `lastModified`: Date object representing last modification time

## Ignore Rules

The scanner ignores:

- Directories: `.git`, `node_modules`, `dist`, `build`, `.next`, `coverage`
- Hidden files and directories (starting with `.`)
- Specific files like `.DS_Store`, `.npmrc`, `.env*`

## API

### scanRepo(rootPath: string): FileMetadata[]

Scans a repository directory recursively and returns metadata for all eligible files.

### scanRepoPaths(rootPath: string): string[]

Returns only the absolute file paths of all eligible files (convenience function).

## Implementation Details

The scanner uses Node.js built-in `fs` module to traverse directories. It respects Unix-style and Windows-style path separators.
