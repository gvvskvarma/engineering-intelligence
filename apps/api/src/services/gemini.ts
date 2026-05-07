import {
  GoogleGenerativeAI,
  type ResponseSchema,
  SchemaType,
} from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(apiKey);

const GENERATION_MODEL = "gemini-2.5-flash";
const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMS = 768;

export async function generateText(prompt: string, system?: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: GENERATION_MODEL,
    ...(system && { systemInstruction: system }),
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateStructuredContent<T>(args: {
  prompt: string;
  system?: string;
  schema: ResponseSchema;
}): Promise<T> {
  const model = genAI.getGenerativeModel({
    model: GENERATION_MODEL,
    ...(args.system && { systemInstruction: args.system }),
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: args.schema,
    },
  });
  const result = await model.generateContent(args.prompt);
  const text = result.response.text();
  return JSON.parse(text) as T;
}

// SDK 0.24 doesn't expose outputDimensionality, so call the REST API directly
// to keep the embedding aligned with our pgvector(768) schema.
export async function generateEmbedding(text: string): Promise<number[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: { parts: [{ text }] },
      outputDimensionality: EMBEDDING_DIMS,
    }),
  });
  if (!res.ok) {
    throw new Error(`Embedding failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { embedding?: { values?: number[] } };
  const values = data.embedding?.values;
  if (!values) {
    throw new Error("Embedding response had no values");
  }
  return values;
}

// Batch endpoint — up to 100 texts per request. Critical for staying under
// the 1000 RPD free-tier cap when indexing repos.
const BATCH_LIMIT = 100;

export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const all: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_LIMIT) {
    const slice = texts.slice(i, i + BATCH_LIMIT);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: slice.map((text) => ({
          model: `models/${EMBEDDING_MODEL}`,
          content: { parts: [{ text }] },
          outputDimensionality: EMBEDDING_DIMS,
        })),
      }),
    });
    if (!res.ok) {
      throw new Error(`Batch embedding failed: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as {
      embeddings?: Array<{ values?: number[] }>;
    };
    const embeddings = data.embeddings;
    if (!embeddings || embeddings.length !== slice.length) {
      throw new Error("Batch embedding returned unexpected shape");
    }
    for (const emb of embeddings) {
      if (!emb.values) throw new Error("Batch embedding had missing values");
      all.push(emb.values);
    }
  }
  return all;
}

export { SchemaType };
