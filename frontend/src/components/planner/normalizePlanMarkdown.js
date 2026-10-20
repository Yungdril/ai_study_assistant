// Planner-only markdown normalizer. STUDY_PLAN_SYSTEM_PROMPT never constrains
// the output format, so the model's markdown is often slightly malformed in
// ways that CommonMark/GFM (via react-markdown + remark-gfm) renders as raw
// text. Reproduced against the real parser:
//   - "**Day 1:**Review"      closing ** after punctuation + letter after it
//                             fails the flanking rule -> literal asterisks.
//   - "** Day 1 **"           inner spaces -> literal asterisks.
//   - "| a | b |" rows with no "|---|---|" delimiter row -> raw pipes.
//   - table rows indented 4+ spaces -> treated as a code block.
//   - "<br>" inside table cells -> shown as literal text (never executed;
//                             react-markdown escapes raw HTML, which is the
//                             behavior we want to keep).
// This only rewrites text; it never produces HTML. Fenced code blocks and
// inline code spans are left untouched. The shared MarkdownRenderer is not
// involved or modified.

// Marks a <br> so the renderer can turn it into a real line break element.
export const BR_MARK = "\u2028";

const DELIMITER_ROW = /^\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?$/;

function fixBold(segment) {
  return segment.replace(
    /\*\*[ \t]*([^*\n]+?)[ \t]*\*\*/g,
    (match, inner, offset, str) => {
      const prev = str[offset - 1];
      const next = str[offset + match.length];
      let out = `**${inner}**`;
      // Closing ** preceded by punctuation and followed by a letter/digit
      // is not right-flanking: add the space the model left out.
      if (/[^\p{L}\p{N}\s]$/u.test(inner) && next && /[\p{L}\p{N}]/u.test(next)) {
        out += " ";
      }
      // Opening ** followed by punctuation and preceded by a letter/digit.
      if (/^[^\p{L}\p{N}\s]/u.test(inner) && prev && /[\p{L}\p{N}]/u.test(prev)) {
        out = ` ${out}`;
      }
      return out;
    }
  );
}

// Apply fixBold only outside inline `code` spans.
function fixBoldOutsideCode(line) {
  return line
    .split(/(`[^`]*`)/g)
    .map((part) => (part.startsWith("`") ? part : fixBold(part)))
    .join("");
}

const isPipeRow = (line) => /^\s*\|.*\|?\s*$/.test(line) && line.includes("|");

function countColumns(line) {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").length;
}

export function normalizePlanMarkdown(raw) {
  if (!raw) return "";

  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }

    if (isPipeRow(line)) {
      // Start of a table block: collect consecutive pipe rows.
      const block = [];
      while (i < lines.length && isPipeRow(lines[i])) {
        block.push(lines[i].trim()); // also un-indents 4-space tables
        i++;
      }
      i--; // for-loop increment

      // Ensure a blank line before the table.
      if (out.length && out[out.length - 1].trim() !== "") out.push("");

      const hasDelimiter = block.length > 1 && DELIMITER_ROW.test(block[1]);
      if (!hasDelimiter && block.length > 1) {
        const cols = countColumns(block[0]);
        block.splice(1, 0, `|${Array(cols).fill("---").join("|")}|`);
      }

      for (const row of block) {
        out.push(fixBoldOutsideCode(row).replace(/<br\s*\/?>/gi, BR_MARK));
      }
      out.push("");
      continue;
    }

    line = fixBoldOutsideCode(line).replace(/<br\s*\/?>/gi, BR_MARK);
    // "##Day 1" -> "## Day 1" (heading marker needs a following space).
    line = line.replace(/^(\s{0,3}#{1,6})(?=[^\s#])/, "$1 ");
    out.push(line);
  }

  return out.join("\n");
}