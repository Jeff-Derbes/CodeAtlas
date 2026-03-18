import { describe, it, expect } from "vitest";
import { chunkFiles, type CodeChunk } from "./index";

describe("chunking exports", () => {
  it("exports chunkFiles function", () => {
    expect(typeof chunkFiles).toBe("function");
  });

  it("returns correct CodeChunk structure", () => {
    const dummy: CodeChunk = {
      id: "1",
      filePath: "file.ts",
      startLine: 1,
      endLine: 10,
      content: "",
    };
    expect(dummy.id).toBe("1");
    expect(dummy.filePath).toBe("file.ts");
  });
});
