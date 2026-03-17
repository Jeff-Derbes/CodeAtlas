# scanRepo Tests

This file documents the test coverage for the `scanRepo` function.

## Test Implementation

The tests in [`scanRepo.test.ts`](src/lib/repo/scanRepo.test.ts) use real filesystem-backed testing with temporary directories created via `fs.promises.mkdtemp()`. This ensures actual behavior verification rather than mock-based assertions.

## Test Coverage

| #   | Behavior Verified                                                       | Test Case                                                              |
| --- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | Empty directory returns empty array                                     | "should return empty array for empty directory"                        |
| 2   | Relative paths resolve to absolute paths in results                     | "should return absolute paths when given relative path"                |
| 3   | Recursive scanning of subdirectories                                    | "should scan files recursively in subdirectories"                      |
| 4   | Ignored directories (node_modules, etc.) are excluded                   | "should exclude ignored directories"                                   |
| 5   | Ignored files (.env.local, .DS_Store, etc.) are excluded                | "should exclude ignored files"                                         |
| 6   | Hidden directories (starting with `.`) are excluded                     | "should exclude hidden directories (starting with .)"                  |
| 7   | Only allowed extensions (.ts, .tsx, .js, .jsx, .json, .md) are included | "should only include allowed extensions"                               |
| 8   | Symlinks to files are skipped                                           | "should skip symlinks"                                                 |
| 9   | Symlinks to directories are skipped                                     | "should skip symlink directories"                                      |
| 10  | Permission errors per entry don't abort the scan                        | "should handle permission errors per entry without aborting"           |
| 11  | `scanRepoPaths()` matches `scanRepo().map(item => item.absolutePath)`   | "scanRepoPaths should match scanRepo().map(item => item.absolutePath)" |
| 12  | Invalid paths throw appropriate errors                                  | "should throw error for invalid path"                                  |
| 13  | File paths (instead of directories) throw errors                        | "should throw error when path is a file instead of directory"          |

## Running Tests

To run the tests:

```bash
npm test
# or
vitest src/lib/repo/scanRepo.test.ts
```

## Notes

- Symlink and permission tests gracefully handle platforms where these features may not be fully supported (e.g., Windows without admin privileges)
- All tests use temporary directories that are cleaned up after the test suite completes
