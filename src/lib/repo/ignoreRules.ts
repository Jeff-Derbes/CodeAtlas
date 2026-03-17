/**
 * Repository scanning ignore rules
 * Defines which directories and files should be excluded from indexing
 */

export const IGNORED_DIRECTORIES = [".git", "node_modules", "dist", "build", ".next", "coverage"];

export const IGNORED_FILES = [".DS_Store", ".gitignore", ".npmrc", ".env", ".env.local"];

export const ALLOWED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".json", ".md"];

/**
 * Check if a path should be ignored based on directory or file name
 */
export function shouldIgnorePath(path: string): boolean {
  // Split the path into components to check each directory level
  const parts = path.split(/[\/\\]/);

  // Check for ignored directories
  for (const dir of IGNORED_DIRECTORIES) {
    if (parts.includes(dir)) {
      return true;
    }
  }

  // Check for ignored files
  const basename = parts[parts.length - 1];
  for (const file of IGNORED_FILES) {
    if (basename === file) {
      return true;
    }
  }

  // Check for hidden directories/files
  for (const part of parts) {
    if (part.startsWith(".")) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a file extension is allowed for indexing
 */
export function isAllowedExtension(extension: string): boolean {
  return ALLOWED_EXTENSIONS.includes(extension);
}
