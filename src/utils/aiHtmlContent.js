export function looksLikeHtml(text) {
  const value = String(text || "").trim();
  if (!value) return false;
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hasInlineMarkdown(text) {
  const value = String(text || "");
  return (
    /\*\*\*[^*]+\*\*\*/.test(value) ||
    /\*\*[^*]+\*\*/.test(value) ||
    /__[^_]+__/.test(value) ||
    /(?<![\w*])\*[^*\n]+\*(?!\*)/.test(value) ||
    /(?<![\w_])_[^_\n]+_(?!_)/.test(value) ||
    /`[^`]+`/.test(value)
  );
}

function formatInlineMarkdown(text) {
  let value = escapeHtml(text);
  value = value.replace(/`([^`]+)`/g, "<code>$1</code>");
  value = value.replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>");
  value = value.replace(/___([^_]+)___/g, "<strong><em>$1</em></strong>");
  value = value.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  value = value.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  value = value.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>");
  value = value.replace(/(?<!_)_([^_\n]+)_(?!_)/g, "<em>$1</em>");
  return value;
}

function applyInlineMarkdown(html) {
  return String(html || "")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/___([^_]+)___/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*\n<]+)\*(?!\*)/g, "<em>$1</em>")
    .replace(/(?<!_)_([^_\n<]+)_(?!_)/g, "<em>$1</em>");
}

export function markdownToHtml(text) {
  const lines = String(text || "").split(/\r?\n/);
  const parts = [];
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      parts.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      parts.push("</ol>");
      inOl = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      closeLists();
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      closeLists();
      const level = headingMatch[1].length;
      parts.push(`<h${level}>${formatInlineMarkdown(headingMatch[2])}</h${level}>`);
      continue;
    }

    const ulMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      if (inOl) {
        parts.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        parts.push("<ul>");
        inUl = true;
      }
      parts.push(`<li>${formatInlineMarkdown(ulMatch[1])}</li>`);
      continue;
    }

    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (inUl) {
        parts.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        parts.push("<ol>");
        inOl = true;
      }
      parts.push(`<li>${formatInlineMarkdown(olMatch[1])}</li>`);
      continue;
    }

    closeLists();
    parts.push(`<p>${formatInlineMarkdown(trimmed)}</p>`);
  }

  closeLists();
  return parts.join("");
}

export function normalizeAiContent(text) {
  const value = String(text || "").trim();
  if (!value) return "";

  if (looksLikeHtml(value)) {
    let html = sanitizeAiHtml(value);
    if (hasInlineMarkdown(html)) {
      html = applyInlineMarkdown(html);
    }
    return html;
  }

  return sanitizeAiHtml(markdownToHtml(value));
}

export function sanitizeAiHtml(html) {
  return String(html || "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\sstyle\s*=\s*(?:"[^"]*"|'[^']*')/gi, "")
    .replace(/\s(color|bgcolor|background)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

export function plainTextFromHtml(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}
