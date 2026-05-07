import { supabaseAdmin } from "../utils/supabase";
import { generateEmbedding, generateText } from "./gemini";

export interface Citation {
  file_path: string;
  language: string | null;
  start_line: number | null;
  end_line: number | null;
  snippet: string;
  similarity: number;
}

export interface AskResult {
  answer: string;
  citations: Citation[];
}

const SYSTEM_PROMPT = `You are a senior engineer answering questions about a codebase.

Rules:
- Answer only based on the provided code snippets. If the snippets don't contain the answer, say so directly — don't speculate or fabricate.
- Always cite your sources by file path and line range, formatted like \`src/foo.ts:12-34\`.
- Be specific and technical. Quote short identifiers or expressions in backticks.
- Keep the answer focused — start with the direct answer in 1-2 sentences, then add detail underneath if useful.`;

export async function askCodebase(args: {
  userId: string;
  repoId: string;
  question: string;
}): Promise<AskResult> {
  const { userId, repoId, question } = args;
  if (!question.trim()) throw new Error("question is empty");

  const queryEmbedding = await generateEmbedding(question);

  const { data: matches, error } = await supabaseAdmin.rpc(
    "match_code_chunks",
    {
      query_embedding: queryEmbedding as unknown as string,
      filter_repo_id: repoId,
      filter_user_id: userId,
      match_count: 8,
    }
  );
  if (error) throw new Error(`vector search failed: ${error.message}`);

  type Match = {
    file_path: string;
    language: string | null;
    content: string;
    start_line: number | null;
    end_line: number | null;
    similarity: number;
  };
  const hits = (matches ?? []) as Match[];
  if (hits.length === 0) {
    return {
      answer:
        "I couldn't find any code in this repo that's relevant to that question.",
      citations: [],
    };
  }

  const context = hits
    .map((h, i) => {
      const range = h.start_line && h.end_line
        ? `${h.file_path}:${h.start_line}-${h.end_line}`
        : h.file_path;
      return `--- [${i + 1}] ${range} (${h.language ?? "text"})\n${h.content}`;
    })
    .join("\n\n");

  const prompt = `Question: ${question}\n\nRelevant code from the repository:\n\n${context}`;
  const answer = await generateText(prompt, SYSTEM_PROMPT);

  const citations: Citation[] = hits.map((h) => ({
    file_path: h.file_path,
    language: h.language,
    start_line: h.start_line,
    end_line: h.end_line,
    snippet: h.content,
    similarity: h.similarity,
  }));

  return { answer, citations };
}
