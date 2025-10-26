export function extractJson(text: string): string {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```[a-zA-Z]*\n?/, "");
    if (t.endsWith("```")) t = t.slice(0, -3);
    t = t.trim();
  }
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end >= start) return t.slice(start, end + 1);
  return t;
}