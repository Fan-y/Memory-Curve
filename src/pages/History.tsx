import { FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createEntry,
  deleteEntry,
  searchEntries,
  updateEntry,
  type EntryRow,
} from "@/lib/api/entries";
import {
  buildEntriesCsv,
  buildEntriesJson,
  mapEntriesForExport,
  parseEntriesJson,
  triggerTextDownload,
} from "@/lib/transfer";
import {
  createTag,
  getUserTags,
  setEntryTags,
} from "@/lib/api/tags";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useI18n } from "@/hooks/useI18n";
import { useAuthStore } from "@/stores/authStore";
import { useReviewStore } from "@/stores/reviewStore";
import { endOfDay, startOfDay } from "@/lib/dates";

type SourceFilter = "all" | "with-source" | "without-source";
type SortOrder = "created_desc" | "created_asc" | "title_asc" | "title_desc";

const FILTER_LABELS: Record<SourceFilter, string> = {
  all: "全部",
  "with-source": "有来源",
  "without-source": "无来源",
};

export default function History() {
  const { t } = useI18n();
  const user = useAuthStore((state) => state.user);
  const createInitialReviewForEntry = useReviewStore(
    (state) => state.createInitialReviewForEntry
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [keyword, setKeyword] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("created_desc");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [entries, setEntries] = useState<EntryRow[]>([]);

  const [editingEntry, setEditingEntry] = useState<EntryRow | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editSource, setEditSource] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  useDocumentTitle(`${t("historyTitle")} - Memory Curve`);

  const loadEntries = async (query: string) => {
    if (!user) {
      return;
    }

    setLoading(true);
    setError(null);

    const result = await searchEntries(user.id, query);
    if (result.error) {
      setLoading(false);
      setError(result.error);
      return;
    }

    setLoading(false);
    setEntries(result.data ?? []);
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadEntries(keyword);
    }, 280);

    return () => {
      window.clearTimeout(timer);
    };
  }, [keyword, user]);

  const filteredEntries = useMemo(() => {
    const result = entries.filter((entry) => {
      const hasSource = Boolean(entry.source && entry.source.trim());
      const sourceMatch =
        sourceFilter === "all"
          ? true
          : sourceFilter === "with-source"
            ? hasSource
            : !hasSource;

      if (!sourceMatch) {
        return false;
      }

      const createdAt = new Date(entry.created_at);
      if (dateStart) {
        const startDate = startOfDay(new Date(dateStart));
        if (createdAt < startDate) {
          return false;
        }
      }

      if (dateEnd) {
        const endDate = endOfDay(new Date(dateEnd));
        if (createdAt > endDate) {
          return false;
        }
      }

      return true;
    });

    result.sort((left, right) => {
      switch (sortOrder) {
        case "created_asc":
          return left.created_at.localeCompare(right.created_at);
        case "title_asc":
          return left.title.localeCompare(right.title);
        case "title_desc":
          return right.title.localeCompare(left.title);
        case "created_desc":
        default:
          return right.created_at.localeCompare(left.created_at);
      }
    });

    return result;
  }, [dateEnd, dateStart, entries, sortOrder, sourceFilter]);

  const onExportJson = () => {
    const payload = mapEntriesForExport(filteredEntries);
    const content = buildEntriesJson(payload);
    triggerTextDownload(
      `entries-${Date.now()}.json`,
      content,
      "application/json;charset=utf-8"
    );
  };

  const onExportCsv = () => {
    const payload = mapEntriesForExport(filteredEntries);
    const content = buildEntriesCsv(payload);
    triggerTextDownload(`entries-${Date.now()}.csv`, content, "text/csv;charset=utf-8");
  };

  const ensureTagIds = async (
    userId: string,
    names: string[],
    cache: Map<string, string>
  ): Promise<string[]> => {
    const ids: string[] = [];

    for (const rawName of names) {
      const normalizedName = rawName.trim();
      if (!normalizedName) {
        continue;
      }

      const lowerName = normalizedName.toLowerCase();
      let tagId = cache.get(lowerName);

      if (!tagId) {
        const createResult = await createTag({ user_id: userId, name: normalizedName });
        if (createResult.error || !createResult.data) {
          throw new Error(createResult.error ?? `创建标签失败：${normalizedName}`);
        }

        tagId = createResult.data.id;
        cache.set(lowerName, tagId);
      }

      ids.push(tagId);
    }

    return ids;
  };

  const onImportJsonFile = async (file: File | null) => {
    if (!user || !file) {
      return;
    }

    setImporting(true);
    setError(null);
    setMessage(null);

    try {
      const content = await file.text();
      const payload = parseEntriesJson(content);

      if (payload.length === 0) {
        setMessage("导入文件没有可导入条目。");
        return;
      }

      const tagsResult = await getUserTags(user.id);
      if (tagsResult.error) {
        throw new Error(tagsResult.error);
      }

      const tagCache = new Map<string, string>();
      for (const tag of tagsResult.data ?? []) {
        tagCache.set(tag.name.toLowerCase(), tag.id);
      }

      let successCount = 0;
      const failedTitles: string[] = [];

      for (const item of payload) {
        const createResult = await createEntry({
          user_id: user.id,
          title: item.title,
          content_md: item.content_md,
          source: item.source ?? null,
        });

        if (createResult.error || !createResult.data) {
          failedTitles.push(item.title);
          continue;
        }

        if ((item.tags ?? []).length > 0) {
          const tagIds = await ensureTagIds(user.id, item.tags ?? [], tagCache);
          const bindResult = await setEntryTags(createResult.data.id, user.id, tagIds);
          if (bindResult.error) {
            failedTitles.push(item.title);
            continue;
          }
        }

        const reviewResult = await createInitialReviewForEntry(createResult.data.id, user.id);
        if (reviewResult.error) {
          failedTitles.push(item.title);
          continue;
        }

        successCount += 1;
      }

      await loadEntries(keyword);

      if (failedTitles.length > 0) {
        setMessage(
          `导入完成：成功 ${successCount} 条，失败 ${failedTitles.length} 条（${failedTitles
            .slice(0, 3)
            .join(" / ")}）。`
        );
        return;
      }

      setMessage(`导入完成，共成功导入 ${successCount} 条。`);
    } catch (importError) {
      const messageText =
        importError instanceof Error ? importError.message : "导入失败，请检查文件格式。";
      setError(messageText);
    } finally {
      setImporting(false);
    }
  };

  const startEdit = (entry: EntryRow) => {
    setEditingEntry(entry);
    setEditTitle(entry.title);
    setEditContent(entry.content_md ?? "");
    setEditSource(entry.source ?? "");
    setMessage(null);
    setError(null);
  };

  const resetEdit = () => {
    setEditingEntry(null);
    setEditTitle("");
    setEditContent("");
    setEditSource("");
    setSaving(false);
  };

  const onSubmitEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user || !editingEntry) {
      return;
    }

    const nextTitle = editTitle.trim();
    if (!nextTitle) {
      setError("标题不能为空。");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    const result = await updateEntry(editingEntry.id, user.id, {
      title: nextTitle,
      content_md: editContent.trim(),
      source: editSource.trim() || null,
    });

    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setMessage("条目已更新。");
    resetEdit();
    await loadEntries(keyword);
  };

  const onDelete = async (entry: EntryRow) => {
    if (!user) {
      return;
    }

    const confirmed = window.confirm(`确认删除条目“${entry.title}”吗？`);
    if (!confirmed) {
      return;
    }

    setDeletingEntryId(entry.id);
    setError(null);
    setMessage(null);

    const result = await deleteEntry(entry.id, user.id);

    setDeletingEntryId(null);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (editingEntry?.id === entry.id) {
      resetEdit();
    }

    setMessage("条目已删除。");
    await loadEntries(keyword);
  };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold">{t("historyTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          支持关键词防抖搜索、高级筛选、编辑删除与 JSON/CSV 导入导出。
        </p>
      </header>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <Input
          placeholder="搜索标题或内容..."
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FILTER_LABELS) as SourceFilter[]).map((filter) => (
            <Button
              key={filter}
              variant={sourceFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setSourceFilter(filter)}
            >
              {FILTER_LABELS[filter]}
            </Button>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>开始日期</span>
            <Input
              type="date"
              value={dateStart}
              onChange={(event) => setDateStart(event.target.value)}
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>结束日期</span>
            <Input
              type="date"
              value={dateEnd}
              onChange={(event) => setDateEnd(event.target.value)}
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>排序</span>
            <select
              className="h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as SortOrder)}
            >
              <option value="created_desc">创建时间（新到旧）</option>
              <option value="created_asc">创建时间（旧到新）</option>
              <option value="title_asc">标题（A-Z）</option>
              <option value="title_desc">标题（Z-A）</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={onExportJson}>
            导出 JSON
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onExportCsv}>
            导出 CSV
          </Button>

          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-xs text-muted-foreground hover:bg-muted">
            <span>{importing ? "导入中..." : "导入 JSON"}</span>
            <input
              type="file"
              accept="application/json"
              className="hidden"
              disabled={importing}
              onChange={(event) => {
                const [file] = Array.from(event.target.files ?? []);
                void onImportJsonFile(file ?? null);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      {editingEntry ? (
        <form className="space-y-3 rounded-xl border bg-card p-4" onSubmit={onSubmitEdit}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-medium">编辑条目</h3>
            <Button type="button" variant="ghost" size="sm" onClick={resetEdit}>
              取消
            </Button>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">标题</label>
            <Input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">内容（Markdown）</label>
            <textarea
              className="min-h-36 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
              value={editContent}
              onChange={(event) => setEditContent(event.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">来源（可选）</label>
            <Input value={editSource} onChange={(event) => setEditSource(event.target.value)} />
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? "保存中..." : "保存修改"}
          </Button>
        </form>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-lg font-medium">条目列表（{filteredEntries.length}）</h3>
        {loading ? <p className="text-sm text-muted-foreground">加载中...</p> : null}
        {!loading && filteredEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">没有匹配的条目。</p>
        ) : null}

        <div className="space-y-3">
          {filteredEntries.map((entry) => {
            const preview = (entry.content_md ?? "").trim();

            return (
              <article key={entry.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h4 className="font-medium">{entry.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      创建于 {new Date(entry.created_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      来源：{entry.source ? entry.source : "(未填写)"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(entry)}>
                      编辑
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                      disabled={deletingEntryId === entry.id}
                      onClick={() => {
                        void onDelete(entry);
                      }}
                    >
                      {deletingEntryId === entry.id ? "删除中..." : "删除"}
                    </Button>
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {preview ? `${preview.slice(0, 220)}${preview.length > 220 ? "..." : ""}` : "(无内容)"}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
