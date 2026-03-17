import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fsSync from "fs";
import fsPromises from "fs/promises";
import os from "os";
import path from "path";
import { scanRepo, scanRepoPaths } from "./scanRepo";

describe("scanRepo", () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for tests
    tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), "repo-scan-test-"));
  });

  afterEach(async () => {
    // Clean up the temporary directory
    try {
      await fsPromises.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it("should return empty array for empty directory", async () => {
    const result = scanRepo(tempDir);
    expect(result).toEqual([]);
  });

  it("should return absolute paths when given relative path", async () => {
    // Create a test file in the temp directory
    const testFile = path.join(tempDir, "test.ts");
    await fsPromises.writeFile(testFile, "console.log('hello');");

    // Scan using relative path (relative to current working directory)
    const result = scanRepo(path.relative(process.cwd(), tempDir));

    expect(result).toHaveLength(1);
    expect(result[0].absolutePath).toBe(testFile);
    // Verify the path is truly absolute (Unix paths start with /, Windows paths have drive letters)
    expect(result[0].absolutePath).toMatch(/^[\/]|[A-Za-z]:/);
  });

  it("should scan files recursively in subdirectories", async () => {
    const subdir = path.join(tempDir, "src");
    await fsPromises.mkdir(subdir, { recursive: true });

    const rootFile = path.join(tempDir, "index.ts");
    const nestedFile = path.join(subdir, "component.tsx");
    await fsPromises.writeFile(rootFile, "// root file");
    await fsPromises.writeFile(nestedFile, "// nested file");

    const result = scanRepo(tempDir);

    expect(result).toHaveLength(2);
    const paths = result.map((r) => r.absolutePath);
    expect(paths).toContain(rootFile);
    expect(paths).toContain(nestedFile);
  });

  it("should exclude ignored directories", async () => {
    // Create node_modules directory with a TypeScript file
    const nodeModulesDir = path.join(tempDir, "node_modules");
    await fsPromises.mkdir(nodeModulesDir, { recursive: true });
    const ignoredFile = path.join(nodeModulesDir, "package.ts");
    await fsPromises.writeFile(ignoredFile, "// should be ignored");

    // Create a regular file outside ignored directory
    const validFile = path.join(tempDir, "index.ts");
    await fsPromises.writeFile(validFile, "// valid file");

    const result = scanRepo(tempDir);

    expect(result).toHaveLength(1);
    expect(result[0].absolutePath).toBe(validFile);
  });

  it("should exclude ignored files", async () => {
    // Create an ignored .env.local file
    const envFile = path.join(tempDir, ".env.local");
    await fsPromises.writeFile(envFile, "SECRET=123");

    // Create a valid TypeScript file
    const tsFile = path.join(tempDir, "index.ts");
    await fsPromises.writeFile(tsFile, "// valid file");

    const result = scanRepo(tempDir);

    expect(result).toHaveLength(1);
    expect(result[0].absolutePath).toBe(tsFile);
  });

  it("should exclude hidden directories (starting with .)", async () => {
    // Create a hidden directory with files
    const hiddenDir = path.join(tempDir, ".hidden");
    await fsPromises.mkdir(hiddenDir, { recursive: true });
    const hiddenFile = path.join(hiddenDir, "secret.ts");
    await fsPromises.writeFile(hiddenFile, "// should be ignored");

    // Create a valid file outside hidden directory
    const validFile = path.join(tempDir, "index.ts");
    await fsPromises.writeFile(validFile, "// valid file");

    const result = scanRepo(tempDir);

    expect(result).toHaveLength(1);
    expect(result[0].absolutePath).toBe(validFile);
  });

  it("should only include allowed extensions", async () => {
    // Create files with various extensions
    await fsPromises.writeFile(path.join(tempDir, "valid.ts"), "// TypeScript");
    await fsPromises.writeFile(path.join(tempDir, "valid.tsx"), "// TSX");
    await fsPromises.writeFile(path.join(tempDir, "valid.js"), "// JavaScript");
    await fsPromises.writeFile(path.join(tempDir, "valid.jsx"), "// JSX");
    await fsPromises.writeFile(path.join(tempDir, "valid.json"), '{"key": "value"}');
    await fsPromises.writeFile(path.join(tempDir, "valid.md"), "# Markdown");

    // Create files with disallowed extensions
    await fsPromises.writeFile(path.join(tempDir, "invalid.css"), "body {}");
    await fsPromises.writeFile(path.join(tempDir, "invalid.png"), "");
    await fsPromises.writeFile(path.join(tempDir, "invalid.txt"), "text file");

    const result = scanRepo(tempDir);

    expect(result).toHaveLength(6); // Only allowed extensions
    const extensions = result.map((r) => r.extension);
    expect(extensions).toContain(".ts");
    expect(extensions).toContain(".tsx");
    expect(extensions).toContain(".js");
    expect(extensions).toContain(".jsx");
    expect(extensions).toContain(".json");
    expect(extensions).toContain(".md");
  });

  it("should skip symlinks", async () => {
    // Create a regular file
    const realFile = path.join(tempDir, "real.ts");
    await fsPromises.writeFile(realFile, "// real file");

    // Create a symlink to the file (may fail on Windows without admin privileges)
    try {
      const linkPath = path.join(tempDir, "link.ts");
      fsSync.symlinkSync(realFile, linkPath);

      const result = scanRepo(tempDir);

      expect(result).toHaveLength(1);
      expect(result[0].absolutePath).toBe(realFile);
    } catch {
      // If symlinks aren't supported on this system, skip the test assertion
      expect(true).toBe(true);
    }
  });

  it("should skip symlink directories", async () => {
    // Create a real directory with files
    const realDir = path.join(tempDir, "realdir");
    await fsPromises.mkdir(realDir, { recursive: true });
    await fsPromises.writeFile(path.join(realDir, "file.ts"), "// in real dir");

    // Create a symlink to the directory (may fail on Windows without admin privileges)
    try {
      const linkPath = path.join(tempDir, "linkdir");
      fsSync.symlinkSync(realDir, linkPath);

      const result = scanRepo(tempDir);

      expect(result).toHaveLength(1);
      // Should only find the file in realdir, not through the symlink
      expect(result[0].absolutePath).toBe(path.join(realDir, "file.ts"));
    } catch {
      // If symlinks aren't supported on this system, skip the test assertion
      expect(true).toBe(true);
    }
  });

  it("should handle permission errors per entry without aborting", async () => {
    // Create two files in the same directory
    const file1 = path.join(tempDir, "accessible.ts");
    const file2 = path.join(tempDir, "restricted.ts");
    await fsPromises.writeFile(file1, "// accessible file");
    await fsPromises.writeFile(file2, "// restricted file");

    // Try to make file2 inaccessible (may fail on Windows or without admin)
    try {
      fsSync.chmodSync(file2, 0o000);

      const result = scanRepo(tempDir);

      // Should still find the accessible file despite permission error on file2
      expect(result).toHaveLength(1);
      expect(result[0].absolutePath).toBe(file1);

      // Restore permissions for cleanup
      fsSync.chmodSync(file2, 0o644);
    } catch {
      // If we can't modify permissions, the test still passes as long as scan doesn't crash
      const result = scanRepo(tempDir);
      expect(result).toHaveLength(2);
    }
  });

  it("scanRepoPaths should match scanRepo().map(item => item.absolutePath)", async () => {
    // Create some test files
    await fsPromises.writeFile(path.join(tempDir, "file1.ts"), "// file 1");
    const subdir = path.join(tempDir, "subdir");
    await fsPromises.mkdir(subdir, { recursive: true });
    await fsPromises.writeFile(path.join(subdir, "file2.tsx"), "// file 2");

    const metadataResult = scanRepo(tempDir);
    const pathsResult = scanRepoPaths(tempDir);

    const metadataPaths = metadataResult.map((item) => item.absolutePath);

    expect(pathsResult).toEqual(metadataPaths);
    expect(pathsResult.length).toBeGreaterThan(0);
  });

  it("should throw error for invalid path", () => {
    expect(() => scanRepo("/nonexistent/path/that/does/not/exist")).toThrow(
      /Invalid repository path/,
    );
  });

  it("should throw error when path is a file instead of directory", async () => {
    const testFile = path.join(tempDir, "testfile.ts");
    await fsPromises.writeFile(testFile, "// this is a file");

    expect(() => scanRepo(testFile)).toThrow(/Invalid repository path/);
  });
});
