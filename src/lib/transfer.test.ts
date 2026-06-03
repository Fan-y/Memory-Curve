import { describe, expect, it } from "vitest";

import {
  buildEntriesCsv,
  buildEntriesJson,
  mapEntriesForExport,
  parseEntriesJson,
  type PortableEntry,
} from "@/lib/transfer";

describe("transfer utilities", () => {
  const entries: PortableEntry[] = [
    {
      title: "Graph Theory",
      content_md: "nodes, edges",
      source: "book",
      tags: ["math", "cs"],
    },
    {
      title: "Comma, quote",
      content_md: "hello, \"world\"",
      source: null,
      tags: [],
    },
  ];

  it("serializes and parses JSON payload", () => {
    const json = buildEntriesJson(entries);
    const parsed = parseEntriesJson(json);

    expect(parsed).toEqual(entries);
  });

  it("creates CSV with escaped fields", () => {
    const csv = buildEntriesCsv(entries);

    expect(csv).toContain("title,content_md,source,tags");
    expect(csv).toContain('"Comma, quote"');
    expect(csv).toContain('"hello, ""world"""');
  });

  it("maps entry rows for export shape", () => {
    const mapped = mapEntriesForExport([
      {
        id: "entry-1",
        user_id: "u-1",
        title: "A",
        content_md: "B",
        source: null,
        created_at: "2026-06-03T00:00:00.000Z",
        updated_at: "2026-06-03T00:00:00.000Z",
      },
    ]);

    expect(mapped).toEqual([
      {
        title: "A",
        content_md: "B",
        source: null,
      },
    ]);
  });

  it("throws for invalid payload", () => {
    const invalid = JSON.stringify({ entries: [{ title: "x" }] });
    expect(() => parseEntriesJson(invalid)).toThrow(/导入文件格式错误/);
  });
});
