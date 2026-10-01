import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDoc } from "@docusaurus/plugin-content-docs/client";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

import ChatGPTIcon from "../../../static/img/icon/ai-actions/chatgpt.svg";
import CheckIcon from "../../../static/img/icon/ai-actions/check.svg";
import ChevronIcon from "../../../static/img/icon/ai-actions/chevron.svg";
import ClaudeIcon from "../../../static/img/icon/ai-actions/claude.svg";
import CopyIcon from "../../../static/img/icon/ai-actions/copy.svg";
import ExternalLinkIcon from "../../../static/img/icon/ai-actions/external-link.svg";
import LinkIcon from "../../../static/img/icon/ai-actions/link.svg";
import { useCopyToClipboard } from "../../hooks/useCopyToClipboard.hook";
import styles from "./styles.module.css";

const CHATGPT_URL = "https://chatgpt.com/?q=";
const CLAUDE_URL = "https://claude.ai/new?q=";

function buildPrompt(url: string): string {
  return `Read ${url}. I want to ask questions about it.`;
}

function useMarkdownUrl(): string {
  const { metadata } = useDoc();
  const { siteConfig } = useDocusaurusContext();
  const relativePath = metadata.source.replace(/^@site\//, "");
  // baseUrl always ends with "/"; strip any trailing slash from url to avoid "//".
  return siteConfig.url.replace(/\/$/, "") + siteConfig.baseUrl + relativePath;
}

function Toolbar({ mdUrl }: { mdUrl: string }): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const { copied, copy } = useCopyToClipboard(1500);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onPointerDown = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const copyMarkdown = useCallback(async () => {
    try {
      const res = await fetch(mdUrl);
      if (!res.ok) {
        throw new Error(`status ${res.status}`);
      }
      await copy(await res.text());
    } catch {
      // In dev the raw .md is not built yet; fall back to copying the link.
      await copy(mdUrl);
    }
  }, [mdUrl, copy]);

  const copyLink = useCallback(async () => {
    await copy(mdUrl);
    setOpen(false);
  }, [mdUrl, copy]);

  const openIn = useCallback(
    (baseUrl: string) => {
      window.open(baseUrl + encodeURIComponent(buildPrompt(mdUrl)), "_blank", "noopener,noreferrer");
      setOpen(false);
    },
    [mdUrl],
  );

  return (
    <div className={styles.toolbar} ref={toolbarRef}>
      <div className={styles.split}>
        <button type="button" className={styles.primary} onClick={copyMarkdown}>
          {copied ? (
            <CheckIcon className={styles.icon} />
          ) : (
            <CopyIcon className={styles.icon} />
          )}
          {copied ? "Copied" : "Copy markdown"}
        </button>
        <button
          type="button"
          className={styles.caret}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="More AI actions"
          onClick={() => setOpen((v) => !v)}
        >
          <ChevronIcon className={styles.icon} />
        </button>
      </div>

      {open && (
        <ul className={styles.menu} role="menu">
          <li role="none">
            <button type="button" role="menuitem" className={styles.item} onClick={copyLink}>
              <LinkIcon className={styles.icon} />
              Copy markdown link
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className={styles.item}
              onClick={() => openIn(CHATGPT_URL)}
            >
              <ChatGPTIcon className={styles.icon} />
              Open in ChatGPT
              <ExternalLinkIcon className={styles.external} />
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className={styles.item}
              onClick={() => openIn(CLAUDE_URL)}
            >
              <ClaudeIcon className={styles.icon} />
              Open in Claude
              <ExternalLinkIcon className={styles.external} />
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

export default function AiActions(): React.JSX.Element {
  const mdUrl = useMarkdownUrl();
  return <Toolbar mdUrl={mdUrl} />;
}
