import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider, modelFor } from "./ai-gateway.server";

function gateway() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI not configured. Missing LOVABLE_API_KEY.");
  return createLovableAiGatewayProvider(key);
}

async function getProvider(supabase: any, userId: string) {
  const { data } = await supabase.from("ai_settings").select("default_provider").eq("user_id", userId).maybeSingle();
  return data?.default_provider || "gemini";
}

function safeJson(text: string): any {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {
    const m = cleaned.match(/[\[{][\s\S]*[\]}]/);
    if (m) { try { return JSON.parse(m[0]); } catch {} }
    throw new Error("AI returned invalid JSON");
  }
}

export const aiSummariseNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ content: z.string().min(1).max(50000) }).parse(d))
  .handler(async ({ data, context }) => {
    const provider = await getProvider(context.supabase, context.userId);
    const { text } = await generateText({
      model: gateway()(modelFor(provider)),
      prompt: `Summarise the following note in 3-5 concise bullet points. Use plain text bullets ("- "). No preamble.\n\n${data.content}`,
    });
    return { summary: text.trim() };
  });

export const aiGenerateTags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ content: z.string().min(1).max(50000), title: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const provider = await getProvider(context.supabase, context.userId);
    const { text } = await generateText({
      model: gateway()(modelFor(provider)),
      prompt: `Suggest 3-6 short, lowercase tags (single or two-word) for this note. Return ONLY a JSON array of strings.\n\nTitle: ${data.title || ""}\n\nContent:\n${data.content}`,
    });
    const arr = safeJson(text);
    return { tags: Array.isArray(arr) ? arr.slice(0, 6).map(String) : [] };
  });

export const aiGenerateFlashcards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    noteId: z.string().uuid(),
    count: z.number().int().min(3).max(40).default(10),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: note, error } = await context.supabase.from("notes").select("*").eq("id", data.noteId).maybeSingle();
    if (error || !note) throw new Error("Note not found");
    const provider = await getProvider(context.supabase, context.userId);
    const { text } = await generateText({
      model: gateway()(modelFor(provider)),
      prompt: `Create ${data.count} flashcards from this note. Return ONLY a JSON array of objects { "front": string, "back": string }. Keep fronts as questions or key terms, backs as concise answers.\n\nNote: ${note.title}\n\n${note.content}`,
    });
    const cards = safeJson(text);
    if (!Array.isArray(cards)) throw new Error("AI returned invalid flashcards");
    const cleaned = cards.filter((c: any) => c?.front && c?.back).slice(0, data.count);
    // Create deck + insert cards
    const { data: deck, error: deckErr } = await context.supabase.from("flashcard_decks").insert({
      user_id: context.userId,
      name: `${note.title} — Deck`,
      subject: note.subject || "",
      source_note_id: note.id,
    }).select().single();
    if (deckErr || !deck) throw new Error("Failed to create deck");
    const rows = cleaned.map((c: any) => ({
      user_id: context.userId, deck_id: deck.id,
      front: String(c.front).slice(0, 500), back: String(c.back).slice(0, 1500),
    }));
    await context.supabase.from("flashcards").insert(rows);
    return { deckId: deck.id, count: rows.length };
  });

export const aiGenerateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    sourceType: z.enum(["note", "deck"]),
    sourceId: z.string().uuid(),
    count: z.number().int().min(3).max(30).default(10),
    difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    let sourceText = "";
    let sourceLabel = "";
    if (data.sourceType === "note") {
      const { data: n } = await context.supabase.from("notes").select("*").eq("id", data.sourceId).maybeSingle();
      if (!n) throw new Error("Note not found");
      sourceText = `Title: ${n.title}\n\n${n.content}`;
      sourceLabel = `Generated from: ${n.title}`;
    } else {
      const { data: d2 } = await context.supabase.from("flashcard_decks").select("*").eq("id", data.sourceId).maybeSingle();
      if (!d2) throw new Error("Deck not found");
      const { data: cards } = await context.supabase.from("flashcards").select("front,back").eq("deck_id", data.sourceId);
      sourceText = `Deck: ${d2.name}\n\n` + (cards || []).map((c: any) => `Q: ${c.front}\nA: ${c.back}`).join("\n\n");
      sourceLabel = `Generated from: ${d2.name}`;
    }
    const provider = await getProvider(context.supabase, context.userId);
    const { text } = await generateText({
      model: gateway()(modelFor(provider)),
      prompt: `Create ${data.count} ${data.difficulty}-difficulty multiple-choice questions from the source below. Return ONLY a JSON array of objects: { "question": string, "options": [4 strings], "correctIndex": 0-3, "explanation": string }.\n\nSource:\n${sourceText}`,
    });
    const questions = safeJson(text);
    if (!Array.isArray(questions)) throw new Error("AI returned invalid quiz");
    const cleaned = questions
      .filter((q: any) => q?.question && Array.isArray(q.options) && q.options.length === 4 && typeof q.correctIndex === "number")
      .slice(0, data.count);
    const { data: quiz, error } = await context.supabase.from("quizzes").insert({
      user_id: context.userId,
      name: sourceLabel,
      source_type: data.sourceType,
      source_id: data.sourceId,
      source_label: sourceLabel,
      difficulty: data.difficulty,
      questions: cleaned,
    }).select().single();
    if (error || !quiz) throw new Error("Failed to save quiz");
    return { quizId: quiz.id, count: cleaned.length };
  });

export const aiTestConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ provider: z.string() }).parse(d))
  .handler(async ({ data }) => {
    try {
      const { text } = await generateText({
        model: gateway()(modelFor(data.provider)),
        prompt: "Reply with the single word: OK",
      });
      return { ok: true, sample: text.slice(0, 40) };
    } catch (e: any) {
      return { ok: false, error: e?.message || "Connection failed" };
    }
  });