"use client";

import ReactMarkdown from "react-markdown";

export function DigestMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ ...props }) => (
          <h1 className="text-xl font-semibold tracking-tight mt-2 mb-3" {...props} />
        ),
        h2: ({ ...props }) => (
          <h2
            className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mt-6 mb-2"
            {...props}
          />
        ),
        h3: ({ ...props }) => (
          <h3 className="text-base font-semibold mt-4 mb-2" {...props} />
        ),
        p: ({ ...props }) => (
          <p className="text-sm leading-relaxed mb-3" {...props} />
        ),
        ul: ({ ...props }) => (
          <ul className="text-sm leading-relaxed mb-3 ml-5 list-disc space-y-1" {...props} />
        ),
        ol: ({ ...props }) => (
          <ol className="text-sm leading-relaxed mb-3 ml-5 list-decimal space-y-1" {...props} />
        ),
        li: ({ ...props }) => <li {...props} />,
        code: ({ ...props }) => (
          <code
            className="font-mono text-[0.8em] px-1 py-0.5 rounded bg-muted"
            {...props}
          />
        ),
        a: ({ ...props }) => (
          <a
            className="underline underline-offset-2 hover:text-foreground"
            target="_blank"
            rel="noreferrer"
            {...props}
          />
        ),
        strong: ({ ...props }) => (
          <strong className="font-semibold" {...props} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
