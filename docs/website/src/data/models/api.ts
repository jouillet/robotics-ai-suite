// Data-access layer for AI Models. Fetches model content at runtime directly
// from a Hugging Face organization (see .designs/hugging-face-model-api.md).
// The `Model` shape is the stable contract the UI renders; only the fetch/parse
// internals here know about Hugging Face.

import { stripFrontMatter } from "@site/src/utils/markdown";

export type Domain = { label: string; tag: string };
export type Chipset = { label: string; alias: string };

// Runtime configuration sourced from docusaurus `customFields`. `token` is only
// set to reach a private staging org during testing; production is public and
// tokenless.
export type HfConfig = {
  org: string;
  token: string | null;
  catalogTag: string;
  domains: Domain[];
  chipsets: Chipset[];
};

const HF = "https://huggingface.co";
const PAGE_SIZE = 24;
const CHIPSET_PREFIX = "chipset:";

export type RelatedModel = {
  slug: string;
  label?: string;
  reason?: string;
};

export type ModelLinks = {
  huggingface?: string;
  github?: string;
  paper?: string;
};

export type BenchmarkMetric = {
  name: string;
  value: number;
  unit: string;
};

export type BenchmarkEntry = {
  domain: string;
  category: string[];
  task: string;
  model: string;
  slug: string;
  hardware: string;
  metrics: BenchmarkMetric[];
};

export type Model = {
  slug: string;
  name: string;
  subtitle?: string;
  category: string;
  order?: number;
  chipsets: string[];
  primaryType?: string;
  secondaryTypes: string[];
  license?: string;
  size?: string;
  releaseDate?: string;
  datasets?: string;
  keyNovelty: string;
  description: string;
  quickStart: string;
  relatedModels: string[];
  overviewSvg?: string;
  detailedSvg?: string;
  taskImage?: string;
  thumbnail: string;
  hasDiagrams: boolean;
  links: ModelLinks;
  pipelineTag?: string;
  precision?: string;
  tags?: string[];
  hasCustomImage: boolean;
  architecture?: string;
};

// Card metadata carried inline on the models list/detail responses. Keys mirror
// the model-card YAML front matter pushed to each Hugging Face repo.
type CardData = {
  title?: string;
  subtitle?: string;
  category?: string;
  description?: string;
  base_model?: string | string[];
  order?: number;
  primary_type?: string;
  secondary_types?: string[];
  license?: string;
  size?: string;
  release_date?: string;
  datasets?: string;
  key_novelty?: string;
  image_overview?: string;
  image_detailed?: string;
  task_image?: string;
  thumbnail?: string;
  related_models?: RelatedModel[];
  paper?: string;
  code?: string;
};

type HfModel = {
  id: string;
  tags?: string[];
  pipeline_tag?: string;
  cardData?: CardData;
};

const DEFAULT_CATEGORY = "Physical AI";
const DEFAULT_THUMBNAIL = "/img/icon/inference-chip.svg";

function slugOf(id: string): string {
  const parts = id.split("/");
  return parts[parts.length - 1] ?? id;
}

function authHeaders(cfg: HfConfig): HeadersInit | undefined {
  return cfg.token ? { Authorization: `Bearer ${cfg.token}` } : undefined;
}

function resolveUrl(cfg: HfConfig, slug: string, filePath: string): string {
  return `${HF}/${cfg.org}/${slug}/resolve/main/${filePath}`;
}

const MIME_BY_EXT: Record<string, string> = {
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

function mimeForPath(filePath: string): string | undefined {
  const ext = filePath.split(".").pop()?.toLowerCase();
  return ext ? MIME_BY_EXT[ext] : undefined;
}

// Turns a repo-relative asset path into a URL usable in an <img src>. Private
// repos require an auth header, which <img> cannot send, so under a token we
// fetch the bytes and hand back an object URL. Public/prod repos use the direct
// URL. Returns undefined when the asset cannot be loaded.
async function resolveAsset(
  cfg: HfConfig,
  slug: string,
  filePath?: string,
): Promise<string | undefined> {
  if (!filePath) {
    return undefined;
  }
  const url = resolveUrl(cfg, slug, filePath);
  if (!cfg.token) {
    return url;
  }
  try {
    const res = await fetch(url, { headers: authHeaders(cfg) });
    if (!res.ok) {
      return undefined;
    }
    // HF's resolve endpoint may serve assets (notably SVG) with a non-image
    // content-type, which makes the resulting object URL unrenderable in an
    // <img>. Re-type the blob from the file extension so the browser treats it
    // as an image.
    const blob = await res.blob();
    const mime = mimeForPath(filePath);
    const typed =
      mime && blob.type !== mime ? blob.slice(0, blob.size, mime) : blob;
    return URL.createObjectURL(typed);
  } catch {
    return undefined;
  }
}

function chipsetsFromTags(tags: string[]): string[] {
  return tags
    .filter((t) => t.startsWith(CHIPSET_PREFIX))
    .map((t) => t.slice(CHIPSET_PREFIX.length));
}

function linksFor(cfg: HfConfig, slug: string, card: CardData): ModelLinks {
  return {
    huggingface: `${HF}/${cfg.org}/${slug}`,
    github: card.code || undefined,
    paper: card.paper || undefined,
  };
}

export const toTitleCase = (value: string): string =>
  value
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const PIPELINE_LABELS: Record<string, string> = {
  "image-text-to-text": "Vision-Language",
  "text-generation": "Text Generation",
  "image-classification": "Image Classification",
  "automatic-speech-recognition": "Speech Recognition",
  "object-detection": "Object Detection",
  "image-segmentation": "Image Segmentation",
  "text-to-image": "Image Generation",
  "text-to-speech": "Text-to-Speech",
  robotics: "Robotics & VLA",
  "vision-language-action": "Robotics & VLA",
  "feature-extraction": "Feature Extraction",
  "text-ranking": "Text Ranking",
};

export function formatPipelineTag(tag?: string): string {
  if (!tag) return "";
  return PIPELINE_LABELS[tag.toLowerCase()] ?? toTitleCase(tag);
}

export function extractPrecision(
  slug: string,
  tags: string[] = [],
): string | undefined {
  const lower = slug.toLowerCase();
  const allText = `${lower} ${tags.join(" ").toLowerCase()}`;
  if (allText.includes("w8a16")) return "W8A16";
  if (allText.includes("w4a16")) return "W4A16";
  if (allText.includes("int4")) return "INT4";
  if (allText.includes("int8")) return "INT8";
  if (allText.includes("bf16")) return "BF16";
  if (allText.includes("fp16")) return "FP16";
  if (allText.includes("fp32")) return "FP32";
  return undefined;
}

export function getModelCategory(
  pipelineTag?: string,
  tags: string[] = [],
): string {
  const lowerTags = tags.map((t) => t.toLowerCase());

  // Check explicit domain contract tags first
  if (
    lowerTags.includes("physical-ai") ||
    lowerTags.includes("physicalai") ||
    lowerTags.includes("physicalai-train")
  ) {
    return "Physical AI";
  }
  if (lowerTags.includes("vision-ai") || lowerTags.includes("vision")) {
    return "Vision AI";
  }
  if (lowerTags.includes("gen-ai")) {
    return "Gen AI";
  }

  // Fallback to pipeline tag or specific task heuristics
  const lowerTag = pipelineTag?.toLowerCase();
  if (
    lowerTag === "robotics" ||
    lowerTags.includes("robotics") ||
    lowerTags.includes("vision-language-action")
  ) {
    return "Physical AI";
  }
  if (
    lowerTag === "object-detection" ||
    lowerTag === "image-segmentation" ||
    lowerTag === "image-classification" ||
    lowerTags.includes("object-detection") ||
    lowerTags.includes("image-segmentation") ||
    lowerTags.includes("image-classification") ||
    lowerTags.includes("ssd")
  ) {
    return "Vision AI";
  }
  return "Gen AI";
}

export function detectArchitecture(
  slug: string,
  tags: string[] = [],
): string {
  const s = slug.toLowerCase();
  const t = tags.map((x) => x.toLowerCase());

  if (s.includes("yolo") || t.includes("yolo11") || t.includes("yolov8")) return "YOLO";
  if (s.includes("qwen") || t.some((x) => x.startsWith("qwen"))) return "QWEN";
  if (s.includes("phi") || t.some((x) => x.startsWith("phi"))) return "PHI";
  if (s.includes("mistral") || t.includes("mistral")) return "MISTRAL";
  if (s.includes("mixtral") || t.includes("mixtral")) return "MIXTRAL";
  if (s.includes("gemma") || t.some((x) => x.startsWith("gemma"))) return "GEMMA";
  if (s.includes("whisper") || t.includes("whisper")) return "WHISPER";
  if (s.includes("llama") || t.some((x) => x.startsWith("llama"))) return "LLAMA";
  if (s.includes("bert") || t.includes("bert")) return "BERT";
  if (s.includes("resnet") || t.includes("resnet")) return "RESNET";
  if (s.includes("mobilenet") || t.includes("mobilenet")) return "MOBILENET";
  if (s.includes("maskrcnn") || t.includes("maskrcnn")) return "MASK R-CNN";
  if (s.includes("ssd") || t.includes("ssd")) return "SSD";
  if (s.includes("act") || t.includes("act")) return "ACT";
  if (s.includes("smolvla")) return "SMOLVLA";
  if (s.includes("pi05") || s.includes("pi0")) return "PI0";
  if (s.includes("flux") || t.includes("flux")) return "FLUX";
  if (s.includes("lcm") || s.includes("dreamshaper")) return "LCM";
  if (s.includes("starcoder") || t.includes("starcoder2")) return "STARCODER";
  if (s.includes("codegen") || t.includes("codegen")) return "CODEGEN";
  if (s.includes("dolly")) return "DOLLY";
  if (s.includes("internvl") || t.includes("internvl")) return "INTERNVL";
  if (s.includes("neural-chat")) return "NEURAL-CHAT";
  if (s.includes("tinyllama")) return "TINYLLAMA";
  if (s.includes("rtmdet")) return "RTMDet";
  if (s.includes("vit") || t.includes("vit")) return "ViT";
  if (s.includes("dino")) return "DINO";
  if (s.includes("kokoro")) return "KOKORO";

  const firstPart = slug.split(/[-_.]/)[0].toUpperCase();
  return firstPart.length <= 10 ? firstPart : "OPENVINO";
}

function cleanMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // extract link text
    .replace(/[*_`]/g, "")                   // remove emphasis and code marks
    .replace(/<[^>]+>/g, "")                 // remove html tags
    .replace(/\s+/g, " ")
    .trim();
}

function extractSummary(markdown: string, card?: CardData): string {
  if (card?.description) return cleanMarkdown(card.description);
  if (card?.key_novelty) return cleanMarkdown(card.key_novelty);

  const baseModel = Array.isArray(card?.base_model)
    ? card.base_model[0]
    : card?.base_model;
  const defaultFallback = baseModel
    ? `OpenVINO optimized model based on ${baseModel}.`
    : "";

  if (!markdown) return defaultFallback;
  const body = stripFrontMatter(markdown).trim();

  // 1. Look for ## Description or ### Description section
  const descHeaderMatch = body.match(/^#{1,3}\s+Description\b/im);
  if (descHeaderMatch && descHeaderMatch.index !== undefined) {
    const afterHeader = body.slice(
      descHeaderMatch.index + descHeaderMatch[0].length,
    );
    const nextHeaderMatch = afterHeader.match(/\n#{1,3}\s+/);
    const descSection = nextHeaderMatch && nextHeaderMatch.index !== undefined
      ? afterHeader.slice(0, nextHeaderMatch.index)
      : afterHeader;
    const paragraphs = descSection
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    for (const p of paragraphs) {
      if (p.startsWith("#") || p.startsWith("!") || p.startsWith("|")) continue;
      const cleaned = cleanMarkdown(p);
      if (cleaned && !cleaned.startsWith("#") && cleaned.length > 10) {
        return cleaned;
      }
    }
  }

  // 2. Look for first non-header, non-list, non-quote paragraph after H1
  const lines = body.split("\n");
  let afterH1 = false;
  const paragraph: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!afterH1) {
      if (trimmed.startsWith("# ")) afterH1 = true;
      continue;
    }
    if (trimmed.startsWith("#")) break;
    if (
      trimmed.startsWith(">") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("-") ||
      trimmed.startsWith("!") ||
      trimmed.startsWith("|")
    ) {
      continue;
    }
    if (trimmed) {
      paragraph.push(trimmed);
    } else if (paragraph.length > 0) {
      break;
    }
  }
  if (paragraph.length > 0) {
    const cleaned = cleanMarkdown(paragraph.join(" "));
    if (cleaned && cleaned.length > 10) return cleaned;
  }

  return defaultFallback;
}

// Maps a raw Hugging Face model to the UI `Model`. The grid only needs the
// thumbnail; `withDiagrams` additionally resolves the architecture SVGs.
async function mapModel(
  cfg: HfConfig,
  raw: HfModel,
  opts: {
    withDiagrams: boolean;
    description?: string;
    quickStart?: string;
    readme?: string;
  },
): Promise<Model> {
  const slug = slugOf(raw.id);
  const card = raw.cardData ?? {};
  const tags = raw.tags ?? [];

  const [thumbnailAsset, taskImage, overviewSvg, detailedSvg] =
    await Promise.all([
      resolveAsset(cfg, slug, card.thumbnail),
      resolveAsset(cfg, slug, card.task_image),
      opts.withDiagrams
        ? resolveAsset(cfg, slug, card.image_overview)
        : Promise.resolve(undefined),
      opts.withDiagrams
        ? resolveAsset(cfg, slug, card.image_detailed)
        : Promise.resolve(undefined),
    ]);

  const hasCustomImage = Boolean(thumbnailAsset || taskImage || overviewSvg);
  const thumbnail =
    thumbnailAsset ?? taskImage ?? overviewSvg ?? DEFAULT_THUMBNAIL;

  const summary = extractSummary(opts.readme ?? opts.description ?? "", card);
  const precision = extractPrecision(slug, tags);
  const architecture = detectArchitecture(slug, tags);
  const primaryType =
    card.primary_type ??
    (raw.pipeline_tag ? formatPipelineTag(raw.pipeline_tag) : undefined);
  const secondaryTypes =
    card.secondary_types ?? (precision ? [precision] : []);
  const category = card.category ?? getModelCategory(raw.pipeline_tag, tags);

  return {
    slug,
    name: card.title ?? slug,
    subtitle: card.subtitle,
    category,
    order: typeof card.order === "number" ? card.order : undefined,
    chipsets: chipsetsFromTags(tags),
    primaryType,
    secondaryTypes,
    license: card.license,
    size: card.size,
    releaseDate: card.release_date,
    datasets: card.datasets,
    keyNovelty: card.key_novelty ?? summary,
    description: opts.description || summary,
    quickStart: opts.quickStart ?? "",
    relatedModels: card.related_models ?? [],
    overviewSvg,
    detailedSvg,
    taskImage,
    thumbnail,
    hasDiagrams: Boolean(overviewSvg && detailedSvg),
    links: linksFor(cfg, slug, card),
    pipelineTag: raw.pipeline_tag,
    precision,
    tags,
    hasCustomImage,
    architecture,
  };
}

type Section = {
  heading: string;
  key: string;
  body: string;
};

// Parses the README body into an intro and top-level sections.
function parseSections(body: string): { intro: string; sections: Section[] } {
  const withoutTitle = body.replace(/^#\s+.*\r?\n+/, "").trim();
  // Match either ## Level 2 headings or # Level 1 headings as section boundaries
  const re = /^#{1,2}\s+(.+?)\s*$/gm;
  const matches = [...withoutTitle.matchAll(re)];

  if (matches.length === 0) {
    return { intro: withoutTitle, sections: [] };
  }

  const intro = withoutTitle.slice(0, matches[0].index).trim();
  const sections: Section[] = matches.map((m, i) => {
    const start = m.index ?? 0;
    const end = matches[i + 1]?.index ?? withoutTitle.length;
    return {
      heading: m[1].trim(),
      key: m[1].trim().toLowerCase(),
      body: withoutTitle.slice(start, end).trim(),
    };
  });

  return { intro, sections };
}

// Assembles the main-page description and the Quick Start guide from known
// sections.
function splitReadme(body: string): {
  description: string;
  quickStart: string;
} {
  const { intro, sections } = parseSections(body);

  const quickStartSections = sections.filter((s) => {
    const k = s.key;
    return (
      k.includes("how to use") ||
      k.includes("running model") ||
      k.includes("running inference") ||
      k.includes("model inference") ||
      k.includes("inference") ||
      k.includes("usage") ||
      k.includes("getting started") ||
      k.includes("quick start")
    );
  });

  const descSection = sections.find(
    (s) => s.key === "description" || s.key === "overview",
  );

  const description = descSection ? descSection.body : intro;
  const quickStart = quickStartSections.map((s) => s.body).join("\n\n");

  return { description, quickStart };
}

// Extracts the `cursor=...` value from the RFC 5988 Link header's rel="next".
function nextCursorFromLink(link: string | null): string | null {
  if (!link) {
    return null;
  }
  const next = link.split(",").find((part) => /rel="next"/.test(part));
  if (!next) {
    return null;
  }
  const url = next.match(/<([^>]+)>/)?.[1];
  if (!url) {
    return null;
  }
  return new URL(url).searchParams.get("cursor");
}

export type ModelPage = {
  models: Model[];
  nextCursor: string | null;
};

// Fetches one page of grid models. `domainTag` scopes the query to a single
// Hugging Face collection tag (repeated `filter` values AND on the server, so
// only one domain can be pushed down); undefined lists the whole org.
export async function listModelsPage(
  cfg: HfConfig,
  opts: { domainTag?: string; cursor?: string | null } = {},
): Promise<ModelPage> {
  const params = new URLSearchParams({
    author: cfg.org,
    limit: String(PAGE_SIZE),
    full: "true",
    cardData: "true",
  });
  // The catalog marker is always ANDed in so only catalog repos are listed,
  // excluding experimental repos in the same org.
  if (cfg.catalogTag) {
    params.append("filter", cfg.catalogTag);
  }
  if (opts.domainTag) {
    params.append("filter", opts.domainTag);
  }
  if (opts.cursor) {
    params.append("cursor", opts.cursor);
  }

  const res = await fetch(`${HF}/api/models?${params.toString()}`, {
    headers: authHeaders(cfg),
  });
  if (!res.ok) {
    throw new Error(`Failed to list models: ${res.status}`);
  }

  const raw = (await res.json()) as HfModel[];
  const models = await Promise.all(
    raw.map((m) => mapModel(cfg, m, { withDiagrams: false })),
  );

  return {
    models,
    nextCursor: nextCursorFromLink(res.headers.get("link")),
  };
}

// Fetches a single model with full detail (diagrams + README body) for the
// model page.
export async function getModel(cfg: HfConfig, slug: string): Promise<Model> {
  const params = new URLSearchParams({ full: "true", cardData: "true" });
  const [metaRes, readmeRes] = await Promise.all([
    fetch(`${HF}/api/models/${cfg.org}/${slug}?${params.toString()}`, {
      headers: authHeaders(cfg),
    }),
    fetch(resolveUrl(cfg, slug, "README.md"), { headers: authHeaders(cfg) }),
  ]);

  if (!metaRes.ok) {
    throw new Error(`Failed to fetch model ${slug}: ${metaRes.status}`);
  }

  const raw = (await metaRes.json()) as HfModel;
  const readmeText = readmeRes.ok ? await readmeRes.text() : "";
  const body = stripFrontMatter(readmeText).trim();
  const { description, quickStart } = splitReadme(body);

  return mapModel(cfg, raw, {
    withDiagrams: true,
    description: description || extractSummary(readmeText, raw.cardData),
    quickStart,
    readme: readmeText,
  });
}

export async function getBenchmarks(): Promise<BenchmarkEntry[]> {
  const res = await fetch("/benchmarks/benchmarks.json");
  if (!res.ok) {
    throw new Error(
      `Failed to fetch benchmarks: ${res.status} ${res.statusText}`,
    );
  }
  return res.json() as Promise<BenchmarkEntry[]>;
}
