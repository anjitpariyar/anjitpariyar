/**
 * Pure text helpers shared by the engine and the data layer.
 * No React, no Supabase, no DOM.
 */

/**
 * Lowercase, unify quotes, and turn punctuation into spaces while keeping the
 * characters that matter inside technology names: "next.js", "c++", "c#",
 * "redux-saga". A trailing "." (end of sentence) is dropped.
 */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[‘’‛']/g, "")
    .replace(/[^a-z0-9.+#\-\s]/g, " ")
    .replace(/\.(?=\s|$)/g, " ")
    .replace(/(^|\s)[-.]+|[-]+(?=\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type Token = { text: string; start: number; end: number };

/** Split normalized text into word tokens with character offsets. */
export function tokenize(normalized: string): Token[] {
  const tokens: Token[] = [];
  const re = /[a-z0-9][a-z0-9.+#-]*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(normalized))) {
    const text = m[0].replace(/[.\-]+$/, "");
    tokens.push({ text, start: m.index, end: m.index + text.length });
  }
  return tokens;
}

/** Letters and digits only: "Hamro Bazar" -> "hamrobazar". */
export function compact(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Very small English stemmer, enough for matching "dashboards" to "dashboard". */
export function stem(word: string): string {
  if (word.length <= 4) return word;
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.endsWith("sses")) return word.slice(0, -2);
  if (word.endsWith("ing") && word.length > 6) return word.slice(0, -3);
  if (word.endsWith("ed") && word.length > 5) return word.slice(0, -2);
  if (word.endsWith("es") && /(?:ch|sh|x|z)es$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && !word.endsWith("us")) {
    return word.slice(0, -1);
  }
  return word;
}

export function levenshtein(a: string, b: string, max = Infinity): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Regex that matches a phrase as whole words inside normalized text.
 * Spaces in the phrase also match "-" or no separator for compound names
 * when `loose` is set ("framer motion" ~ "framer-motion").
 */
export function phraseRegExp(phrase: string, loose = false): RegExp {
  const parts = normalize(phrase).split(" ").filter(Boolean).map(escapeRegExp);
  const joiner = loose ? "[\\s-]*" : "\\s+";
  return new RegExp(`(?<![a-z0-9])${parts.join(joiner)}(?![a-z0-9])`, "g");
}

/**
 * Convert stored HTML (the projects.description column uses <br/>) to plain
 * text. The result is only ever rendered as React text, never as HTML.
 */
export function htmlToText(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function firstParagraph(text: string): string {
  return text.split(/\n\s*\n/)[0]?.trim() ?? "";
}

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Words that never carry topic meaning on their own. */
export const STOPWORDS = new Set(
  `a an the and or but if then so of to in on at by for with from into onto about as is are was were be been being
  am do does did done have has had having can could would should will shall may might must i me my mine we us our
  you your yours he him his she her they them their it its this that these those there here what which who whom whose
  when where why how all any some each every no not only very just also too more most much many lot lots
  please tell show give list see let lets know get got want like need help find
  anjit pariyar anjits hes youre im ive id dont doesnt didnt cant whats thats theres
  one ones thing things something anything stuff kind sort type yes yeah ok okay thanks thank
  bit really actually ever before now currently any other else`
    .split(/\s+/)
    .filter(Boolean)
);
