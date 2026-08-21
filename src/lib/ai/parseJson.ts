/** Best-effort extraction of a JSON object from an LLM text response —
 * strips markdown fences and trailing commas before parsing. Returns null on
 * failure rather than throwing; callers must treat null as "fall back". */
export function safeParseJson(text: string): unknown | null {
  let s = text.trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    s = fenced[1];
  } else {
    const first = s.indexOf("{");
    const last = s.lastIndexOf("}");
    if (first !== -1 && last > first) s = s.slice(first, last + 1);
  }
  s = s.replace(/,\s*([}\]])/g, "$1");
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
