// Iteration 1: simple line-based chunker.
// Iteration 2 will swap this for AST-aware chunking on TS/JS/Python.

const EXT_LANGUAGE: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  py: "python",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  swift: "swift",
  rb: "ruby",
  php: "php",
  cs: "csharp",
  c: "c",
  cc: "cpp",
  cpp: "cpp",
  h: "c",
  hpp: "cpp",
  scala: "scala",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  yml: "yaml",
  yaml: "yaml",
  json: "json",
  toml: "toml",
  md: "markdown",
  mdx: "markdown",
  sql: "sql",
  html: "html",
  css: "css",
  scss: "scss",
};

const SKIP_PATH_PATTERNS = [
  /(^|\/)node_modules(\/|$)/,
  /(^|\/)\.git(\/|$)/,
  /(^|\/)dist(\/|$)/,
  /(^|\/)build(\/|$)/,
  /(^|\/)\.next(\/|$)/,
  /(^|\/)\.turbo(\/|$)/,
  /(^|\/)coverage(\/|$)/,
  /(^|\/)vendor(\/|$)/,
  /(^|\/)__pycache__(\/|$)/,
  /\.lock$/,
  /\.lockb$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /poetry\.lock$/,
  /Cargo\.lock$/,
];

const MAX_FILE_BYTES = 100 * 1024;
const CHUNK_LINES = 60;
const OVERLAP_LINES = 10;

export interface ChunkInput {
  filePath: string;
  content: string;
}

export interface CodeChunk {
  filePath: string;
  language: string | null;
  content: string;
  startLine: number;
  endLine: number;
  chunkIndex: number;
}

export function languageFor(filePath: string): string | null {
  const ext = filePath.split(".").pop()?.toLowerCase();
  return ext ? EXT_LANGUAGE[ext] ?? null : null;
}

export function shouldIndexFile(filePath: string, byteSize: number | undefined): boolean {
  if (byteSize !== undefined && byteSize > MAX_FILE_BYTES) return false;
  if (SKIP_PATH_PATTERNS.some((rx) => rx.test(filePath))) return false;
  return languageFor(filePath) !== null;
}

export function chunkFile({ filePath, content }: ChunkInput): CodeChunk[] {
  if (!content) return [];
  if (looksBinary(content)) return [];

  const language = languageFor(filePath);
  const lines = content.split("\n");
  if (lines.length <= CHUNK_LINES) {
    return [
      {
        filePath,
        language,
        content,
        startLine: 1,
        endLine: lines.length,
        chunkIndex: 0,
      },
    ];
  }

  const chunks: CodeChunk[] = [];
  let chunkIndex = 0;
  const step = Math.max(1, CHUNK_LINES - OVERLAP_LINES);
  for (let start = 0; start < lines.length; start += step) {
    const end = Math.min(start + CHUNK_LINES, lines.length);
    const slice = lines.slice(start, end).join("\n");
    if (slice.trim().length === 0) continue;
    chunks.push({
      filePath,
      language,
      content: slice,
      startLine: start + 1,
      endLine: end,
      chunkIndex: chunkIndex++,
    });
    if (end >= lines.length) break;
  }
  return chunks;
}

function looksBinary(content: string): boolean {
  const sample = content.slice(0, 4000);
  let nullCount = 0;
  for (let i = 0; i < sample.length; i++) {
    if (sample.charCodeAt(i) === 0) {
      nullCount++;
      if (nullCount > 1) return true;
    }
  }
  return false;
}
