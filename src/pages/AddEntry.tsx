import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createEntry, getUserEntries, type EntryRow } from "@/lib/api/entries";
import {
  createTag,
  getUserTags,
  setEntryTags,
  type TagRow,
} from "@/lib/api/tags";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useI18n } from "@/hooks/useI18n";
import { useAuthStore } from "@/stores/authStore";
import { useReviewStore } from "@/stores/reviewStore";

export default function AddEntry() {
  const { t } = useI18n();
  const user = useAuthStore((state) => state.user);
  const createInitialReviewForEntry = useReviewStore(
    (state) => state.createInitialReviewForEntry
  );

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [tags, setTags] = useState<TagRow[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);

  useDocumentTitle(`${t("addEntryTitle")} - Memory Curve`);

  const loadEntries = async () => {
    if (!user) {
      return;
    }

    const result = await getUserEntries(user.id);
    if (result.error) {
      setError(result.error);
      return;
    }

    setEntries(result.data ?? []);
  };

  const loadTags = async () => {
    if (!user) {
      return;
    }

    const result = await getUserTags(user.id);
    if (result.error) {
      setError(result.error);
      return;
    }

    setTags(result.data ?? []);
  };

  useEffect(() => {
    void loadEntries();
    void loadTags();
  }, [user]);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((current) => {
      if (current.includes(tagId)) {
        return current.filter((id) => id !== tagId);
      }

      return [...current, tagId];
    });
  };

  const onCreateTag = async () => {
    if (!user) {
      return;
    }

    const name = newTagName.trim();
    if (!name) {
      return;
    }

    setCreatingTag(true);
    setError(null);

    const result = await createTag({
      user_id: user.id,
      name,
    });

    setCreatingTag(false);

    if (result.error || !result.data) {
      setError(result.error ?? t("addEntryErrorTagCreate"));
      return;
    }

    const createdTag = result.data;

    setTags((current) => {
      const next = [...current, createdTag];
      next.sort((a, b) => a.name.localeCompare(b.name));
      return next;
    });
    setSelectedTagIds((current) => [...current, createdTag.id]);
    setNewTagName("");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      setError(t("addEntryErrorNotLoggedIn"));
      return;
    }

    if (!title.trim()) {
      setError(t("addEntryErrorTitleRequired"));
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const createEntryResult = await createEntry({
      user_id: user.id,
      title: title.trim(),
      content_md: content.trim(),
      source: source.trim() || null,
    });

    if (createEntryResult.error || !createEntryResult.data) {
      setLoading(false);
      setError(createEntryResult.error ?? t("addEntryErrorCreateFailed"));
      return;
    }

    if (selectedTagIds.length > 0) {
      const tagResult = await setEntryTags(
        createEntryResult.data.id,
        user.id,
        selectedTagIds
      );

      if (tagResult.error) {
        setLoading(false);
        setError(tagResult.error);
        return;
      }
    }

    const reviewResult = await createInitialReviewForEntry(
      createEntryResult.data.id,
      user.id
    );

    setLoading(false);

    if (reviewResult.error) {
      setError(reviewResult.error);
      return;
    }

    setTitle("");
    setContent("");
    setSource("");
    setSelectedTagIds([]);
    setMessage(t("addEntrySuccessCreated"));

    await loadEntries();
  };

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">{t("addEntryTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("addEntrySubtitle")}
        </p>
      </header>

      <form className="space-y-4 rounded-xl border bg-card p-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("addEntryLabelTitle")}</label>
          <Input
            placeholder={t("addEntryPlaceholderTitle")}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("addEntryLabelContent")}</label>
          <textarea
            className="min-h-36 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
            placeholder={t("addEntryPlaceholderContent")}
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("addEntryLabelSourceOptional")}</label>
          <Input
            placeholder={t("addEntryPlaceholderSource")}
            value={source}
            onChange={(event) => setSource(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("addEntryLabelTagsOptional")}</label>
          <div className="flex flex-wrap gap-2">
            {tags.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("addEntryNoTags")}</p>
            ) : (
              tags.map((tag) => {
                const selected = selectedTagIds.includes(tag.id);

                return (
                  <button
                    key={tag.id}
                    type="button"
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input text-muted-foreground hover:bg-muted"
                    }`}
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </button>
                );
              })
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              className="max-w-xs"
              placeholder={t("addEntryPlaceholderNewTag")}
              value={newTagName}
              onChange={(event) => setNewTagName(event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={creatingTag || !newTagName.trim()}
              onClick={() => {
                void onCreateTag();
              }}
            >
              {creatingTag ? t("addEntryCreatingTag") : t("addEntryCreateTag")}
            </Button>
          </div>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

        <Button type="submit" disabled={loading}>
          {loading ? t("addEntrySaving") : t("addEntrySave")}
        </Button>
      </form>

      <div className="space-y-3">
        <h3 className="text-lg font-medium">{t("addEntryRecent")}</h3>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("addEntryEmpty")}</p>
        ) : (
          <div className="space-y-2">
            {entries.slice(0, 8).map((entry) => (
              <article key={entry.id} className="rounded-lg border bg-card p-3">
                <h4 className="font-medium">{entry.title}</h4>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {entry.content_md || t("addEntryNoContent")}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
