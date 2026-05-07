import type { ResponseSchema } from "@google/generative-ai";
import { generateStructuredContent, SchemaType } from "./gemini";
import { supabaseAdmin } from "../utils/supabase";

interface ExtractedItem {
  title: string;
  description: string | null;
  assignee: string | null;
  priority: "high" | "medium" | "low";
  due_date: string | null;
}

interface ExtractionResult {
  summary: string;
  action_items: ExtractedItem[];
}

const SYSTEM_PROMPT = `You are an expert meeting analyst. Extract action items from the meeting transcript provided.

For each action item return:
- title: clear, actionable task title (start with a verb, e.g. "Draft Q3 OKRs")
- description: 1-2 sentence context from the meeting explaining what needs to happen and why
- assignee: the person's name if explicitly mentioned ("Sarah will handle X"), otherwise null. Do not guess.
- priority: "high" if the meeting language conveys urgency or blocking nature; "medium" by default; "low" only if explicitly low-priority
- due_date: a specific date or relative phrase ("by Friday", "next week", "end of Q3") if mentioned in the meeting; otherwise null

Also return a 2-4 sentence summary of the overall meeting — what was discussed and what was decided.

Be conservative: only extract items that are real commitments, not hypotheticals or suggestions.`;

const RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    action_items: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING, nullable: true },
          assignee: { type: SchemaType.STRING, nullable: true },
          priority: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["high", "medium", "low"],
          },
          due_date: { type: SchemaType.STRING, nullable: true },
        },
        required: ["title", "priority"],
      },
    },
  },
  required: ["summary", "action_items"],
};

export async function processDebrief(args: {
  userId: string;
  title: string | null;
  transcript: string;
}): Promise<{ debriefId: string }> {
  // Insert with status "processing" so the UI can show a placeholder.
  const { data: debrief, error: insertErr } = await supabaseAdmin
    .from("debriefs")
    .insert({
      user_id: args.userId,
      title: args.title,
      raw_transcript: args.transcript,
      status: "processing",
    })
    .select("id")
    .single();
  if (insertErr || !debrief) {
    throw new Error(`Failed to create debrief: ${insertErr?.message}`);
  }

  try {
    const extracted = await generateStructuredContent<ExtractionResult>({
      system: SYSTEM_PROMPT,
      prompt: `Meeting transcript:\n\n${args.transcript}`,
      schema: RESPONSE_SCHEMA,
    });

    if (extracted.action_items.length > 0) {
      const rows = extracted.action_items.map((item) => ({
        debrief_id: debrief.id,
        user_id: args.userId,
        title: item.title,
        description: item.description,
        assignee: item.assignee,
        priority: item.priority,
        due_date: item.due_date,
      }));
      const { error: itemsErr } = await supabaseAdmin
        .from("action_items")
        .insert(rows);
      if (itemsErr) throw itemsErr;
    }

    const { error: updateErr } = await supabaseAdmin
      .from("debriefs")
      .update({ summary: extracted.summary, status: "completed" })
      .eq("id", debrief.id);
    if (updateErr) throw updateErr;

    return { debriefId: debrief.id };
  } catch (err) {
    await supabaseAdmin
      .from("debriefs")
      .update({ status: "failed" })
      .eq("id", debrief.id);
    throw err;
  }
}
