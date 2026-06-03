import type { EntryRow } from "@/lib/api/entries";

export type PortableEntry = {
  title: string;
  content_md: string;
  source: string | null;
  tags?: string[];
};

export type ExportPayload = {
  version: 1;
  exported_at: string;
  entries: PortableEntry[];
};

function escapeCsvCell(cell: string): string {
  if (/[",\n]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }

  return cell;
}

export function buildEntriesJson(entries: PortableEntry[]): string {
  const payload: ExportPayload = {
    version: 1,
    exported_at: new Date().toISOString(),
    entries,
  };

  return JSON.stringify(payload, null, 2);
}

export function buildEntriesCsv(entries: PortableEntry[]): string {
  const header = ["title", "content_md", "source", "tags"];
  const rows = entries.map((entry) => {
    const values = [
      entry.title,
      entry.content_md,
      entry.source ?? "",
      (entry.tags ?? []).join("|"),
    ];

    return values.map((value) => escapeCsvCell(value)).join(",");
  });

  return [header.join(","), ...rows].join("\n");
}

export function mapEntriesForExport(entries: EntryRow[]): PortableEntry[] {
  return entries.map((entry) => ({
    title: entry.title,
    content_md: entry.content_md,
    source: entry.source,
  }));
}

function isPortableEntry(value: unknown): value is PortableEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PortableEntry>;
  if (typeof candidate.title !== "string" || candidate.title.trim().length === 0) {
    return false;
  }

  if (typeof candidate.content_md !== "string") {
    return false;
  }

  if (candidate.source !== null && candidate.source !== undefined && typeof candidate.source !== "string") {
    return false;
  }

  if (candidate.tags !== undefined) {
    if (!Array.isArray(candidate.tags)) {
      return false;
    }

    if (!candidate.tags.every((tag) => typeof tag === "string" && tag.trim().length > 0)) {
      return false;
    }
  }

  return true;
}

export function parseEntriesJson(raw: string): PortableEntry[] {
  const parsed = JSON.parse(raw) as Partial<ExportPayload>;

  if (!parsed || !Array.isArray(parsed.entries)) {
    throw new Error("导入文件格式错误：缺少 entries 数组。");
  }

  const normalized = parsed.entries.map((item) => {
    if (!isPortableEntry(item)) {
      throw new Error("导入文件格式错误：存在非法条目。\n请检查 title/content_md/source/tags 字段。\n");
    }

    return {
      title: item.title.trim(),
      content_md: item.content_md,
      source: item.source?.trim() || null,
      tags: (item.tags ?? []).map((tag) => tag.trim()),
    } as PortableEntry;
  });

  return normalized;
}

export function triggerTextDownload(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}
