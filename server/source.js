const MAX_FETCH_CHARS = 90000;

export function inferInputType(value) {
  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol) ? "url" : "reviews";
  } catch {
    return "reviews";
  }
}

export async function resolveSourceText(input, requestedType) {
  const inputType = requestedType === "auto" ? inferInputType(input) : requestedType;

  if (inputType === "url") {
    const url = new URL(input.trim());
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "ReviewLens/1.0 (+https://reviewlens.local)",
          Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8"
        }
      });

      if (!response.ok) {
        throw new Error(`Could not fetch URL (${response.status}).`);
      }

      const html = (await response.text()).slice(0, MAX_FETCH_CHARS);
      return {
        inputType,
        sourceText: htmlToText(html),
        inputPreview: url.toString()
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    inputType: "reviews",
    sourceText: input.trim(),
    inputPreview: input.trim().slice(0, 220)
  };
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
