/**
 * Example usage of the repository scanner utility
 */

import { scanRepo, scanRepoPaths } from "@/lib/repo";

// Example 1: Basic usage
console.log("=== Repository Scanner Example ===\n");

try {
  // Scan current directory (this will include our own files)
  const files = scanRepo("./");

  console.log(`Found ${files.length} files to index:\n`);

  // Display first few files with their metadata
  files.slice(0, 5).forEach((file) => {
    console.log(`📄 ${file.relativePath}`);
    console.log(`   Extension: ${file.extension}`);
    console.log(`   Size: ${file.size} bytes`);
    console.log(`   Last modified: ${file.lastModified.toLocaleDateString()}\n`);
  });

  if (files.length > 5) {
    console.log(`... and ${files.length - 5} more files\n`);
  }

  // Example of filtering by extension
  const tsFiles = files.filter((file) => file.extension === ".ts");
  console.log(`Found ${tsFiles.length} TypeScript files`);
} catch (error) {
  console.error("Error scanning repository:", error);
}

// Example 2: Using the scanRepoPaths function
console.log("\n=== Using scanRepoPaths ===");

try {
  const filePaths = scanRepoPaths("./");
  console.log(`Found ${filePaths.length} file paths`);

  // Display first few paths
  filePaths.slice(0, 3).forEach((path) => {
    console.log(`- ${path}`);
  });
} catch (error) {
  console.error("Error getting file paths:", error);
}

console.log("\n=== Example Complete ===");
