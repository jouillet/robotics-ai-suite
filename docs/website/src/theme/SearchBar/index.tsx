import useBaseUrl from "@docusaurus/useBaseUrl";
import clsx from "clsx";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import SearchIcon from "@site/static/img/icon/search.svg";
import styles from "./styles.module.css";

type IndexEntry = {
  id: string;
  title: string;
  section: string;
  url: string;
  content: string;
};

type Scored = {
  entry: IndexEntry;
  score: number;
};

const MAX_RESULTS = 8;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function scoreEntry(entry: IndexEntry, terms: string[], phrase: string): number {
  const title = entry.title.toLowerCase();
  const content = entry.content.toLowerCase();
  const section = entry.section.toLowerCase();

  let score = 0;
  for (const term of terms) {
    const inTitle = title.includes(term);
    const inSection = section.includes(term);
    const occurrences = content.split(term).length - 1;
    if (!inTitle && !inSection && occurrences === 0) {
      return 0; // AND semantics: every term must appear somewhere.
    }
    if (inTitle) score += 12;
    if (inSection) score += 3;
    score += Math.min(occurrences, 5) * 2;
  }
  if (phrase && title.includes(phrase)) score += 25;
  if (phrase && content.includes(phrase)) score += 8;
  return score;
}

function buildSnippet(content: string, terms: string[]): string {
  const lower = content.toLowerCase();
  let idx = -1;
  for (const term of terms) {
    const found = lower.indexOf(term);
    if (found !== -1 && (idx === -1 || found < idx)) idx = found;
  }
  if (idx === -1) return content.slice(0, 160);
  const start = Math.max(0, idx - 60);
  const snippet = content.slice(start, start + 180);
  return (start > 0 ? "\u2026" : "") + snippet.trim() + "\u2026";
}

function highlight(text: string, terms: string[]): React.ReactNode {
  if (terms.length === 0) return text;
  const alternation = terms.map(escapeRegExp).join("|");
  const splitPattern = new RegExp(`(${alternation})`, "gi");
  const matchPattern = new RegExp(`^(?:${alternation})$`, "i");
  return text.split(splitPattern).map((part, i) =>
    part && matchPattern.test(part) ? (
      <mark key={i} className={styles.mark}>
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

export default function SearchBar(): React.JSX.Element {
  const indexUrl = useBaseUrl("/search-index.json");
  const [entries, setEntries] = useState<IndexEntry[] | null>(null);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const loadIndex = useCallback(() => {
    if (entries !== null || loadState === "loading") return;
    setLoadState("loading");
    fetch(indexUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: IndexEntry[]) => {
        setEntries(data);
        setLoadState("idle");
      })
      .catch(() => setLoadState("error"));
  }, [entries, indexUrl, loadState]);

  const results = useMemo<Scored[]>(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed || !entries) return [];
    const terms = trimmed.split(/\s+/).filter(Boolean);
    return entries
      .map((entry) => ({ entry, score: scoreEntry(entry, terms, trimmed) }))
      .filter((item) => item.score > 0)
      .sort(
        (a, b) => b.score - a.score || a.entry.title.length - b.entry.title.length,
      )
      .slice(0, MAX_RESULTS);
  }, [entries, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const terms = useMemo(
    () => query.trim().toLowerCase().split(/\s+/).filter(Boolean),
    [query],
  );

  const go = useCallback((url: string) => {
    window.location.href = url;
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      const target = results[activeIndex];
      if (target) {
        event.preventDefault();
        go(target.entry.url);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const showPanel = open && query.trim().length > 0;

  return (
    <div className={styles.searchRoot} ref={rootRef}>
      <div className={styles.inputWrap}>
        <SearchIcon className={styles.icon} aria-hidden="true" focusable="false" />
        <input
          type="search"
          className={styles.input}
          value={query}
          placeholder="Search"
          aria-label="Search the site"
          autoComplete="off"
          spellCheck={false}
          onFocus={() => {
            loadIndex();
            setOpen(true);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            loadIndex();
          }}
          onKeyDown={onKeyDown}
        />
      </div>

      {showPanel && (
        <div className={styles.panel} role="listbox">
          {loadState === "loading" && entries === null && (
            <div className={styles.status}>Loading search index…</div>
          )}
          {loadState === "error" && (
            <div className={styles.status}>Search is unavailable right now.</div>
          )}
          {entries !== null && results.length === 0 && (
            <div className={styles.status}>No results for &ldquo;{query.trim()}&rdquo;.</div>
          )}
          {results.map((item, i) => (
            <a
              key={item.entry.id}
              href={item.entry.url}
              role="option"
              aria-selected={i === activeIndex}
              className={clsx(styles.result, i === activeIndex && styles.resultActive)}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={(event) => {
                event.preventDefault();
                go(item.entry.url);
              }}
            >
              <span className={styles.resultTitle}>
                <span>{highlight(item.entry.title, terms)}</span>
                <span className={styles.resultSection}>{item.entry.section}</span>
              </span>
              <span className={styles.resultSnippet}>
                {highlight(buildSnippet(item.entry.content, terms), terms)}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
