import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt.js";

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const MAX_SOURCE_CHARS = 60000;

const positiveWords = [
  "love",
  "great",
  "excellent",
  "amazing",
  "fast",
  "sturdy",
  "easy",
  "premium",
  "powerful",
  "reliable",
  "comfortable",
  "bright",
  "recommend"
];

const negativeWords = [
  "broken",
  "cracked",
  "slow",
  "leaked",
  "noisy",
  "bad",
  "poor",
  "defective",
  "damaged",
  "loose",
  "return",
  "cheap",
  "failed"
];

export async function analyzeWithGemini({ inputType, sourceText }) {
  const clippedText = sourceText.slice(0, MAX_SOURCE_CHARS);

  if (!process.env.GEMINI_API_KEY) {
    return fallbackAnalyze({ inputType, sourceText: clippedText, demoMode: true });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: buildUserPrompt({ inputType, sourceText: clippedText }) }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${detail.slice(0, 240)}`);
  }

  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text).join("") || "";
  const analysis = parseJson(text);

  return normalizeAnalysis(analysis, false);
}

function parseJson(text) {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned);
}

export function fallbackAnalyze({ inputType, sourceText, demoMode = false }) {
  const lower = sourceText.toLowerCase();
  const positiveHits = positiveWords.filter((word) => lower.includes(word)).length;
  const negativeHits = negativeWords.filter((word) => lower.includes(word)).length;
  const totalHits = Math.max(positiveHits + negativeHits, 1);
  const positive = Math.round((positiveHits / totalHits) * 70) + 15;
  const negative = Math.round((negativeHits / totalHits) * 60);
  const boundedPositive = Math.min(85, Math.max(10, positive));
  const boundedNegative = Math.min(75, Math.max(5, negative));
  const neutral = Math.max(0, 100 - boundedPositive - boundedNegative);
  const reviewCountEstimate = estimateReviews(sourceText);
  const tooFewReviews = reviewCountEstimate < 3;
  const spamSuspicion = detectSpam(lower);
  const nonEnglish = looksNonEnglish(sourceText);
  const score = Math.max(1, Math.min(10, Math.round((boundedPositive - boundedNegative + 85) / 15)));

  return normalizeAnalysis(
    {
      tldr: [
        `The available ${inputType === "url" ? "page text" : "review text"} points to a ${boundedPositive >= boundedNegative ? "mostly favorable" : "mixed"} customer response.`,
        `Positive signals cluster around ${pickTheme(lower, "positive")}, while complaints focus on ${pickTheme(lower, "negative")}.`,
        `${tooFewReviews ? "The sample is small, so treat this as directional rather than definitive." : "The verdict balances recurring praise against the visible complaint patterns."}`
      ],
      sentiment: {
        positive: boundedPositive,
        neutral,
        negative: boundedNegative,
        themes: {
          positive: ["Ease of use", "Performance", "Perceived value"],
          neutral: ["Shipping or setup details", "Limited long-term evidence"],
          negative: ["Durability concerns", "Noise or fit issues", "Support or packaging complaints"]
        }
      },
      topPraised: [
        { theme: "Performance", evidence: "Review text includes positive words around speed, power, or usefulness.", intensity: positiveHits > 2 ? "high" : "medium" },
        { theme: "Ease of use", evidence: "Customers appear to value simple setup or daily usability.", intensity: "medium" },
        { theme: "Build impression", evidence: "Some praise suggests the product feels solid or premium.", intensity: "medium" }
      ],
      topComplained: [
        { theme: "Durability", evidence: "Complaint language suggests cracks, failures, looseness, or defects may matter.", intensity: negativeHits > 2 ? "high" : "medium" },
        { theme: "Noise or friction", evidence: "A few signals point to usage annoyances such as noise, leakage, or sensitivity.", intensity: "medium" },
        { theme: "Post-purchase risk", evidence: "Support, delivery, return, or packaging issues appear in the complaint pattern.", intensity: "low" }
      ],
      buyVerdict: {
        score,
        justification: `${score >= 7 ? "Worth considering" : score >= 5 ? "Proceed cautiously" : "Hard to recommend"} because the praise-to-complaint balance lands at ${score}/10.`
      },
      riskFlags: [
        ...(tooFewReviews
          ? [{ type: "too_few_reviews", severity: "high", description: "There are too few distinct reviews for a confident verdict." }]
          : []),
        ...(nonEnglish
          ? [{ type: "non_english", severity: "medium", description: "Some text appears non-English, so translation nuance may affect the analysis." }]
          : []),
        ...(spamSuspicion !== "low"
          ? [{ type: "spam_or_fake", severity: spamSuspicion, description: "The text includes patterns that can indicate copied, incentivized, or low-detail reviews." }]
          : []),
        ...(demoMode
          ? [{ type: "missing_detail", severity: "medium", description: "Gemini is not configured, so this report uses local heuristic analysis." }]
          : [])
      ],
      inputDiagnostics: {
        reviewCountEstimate,
        language: nonEnglish ? "Mixed or non-English" : "English",
        tooFewReviews,
        nonEnglish,
        spamSuspicion,
        notes: [demoMode ? "Set GEMINI_API_KEY for the AI-backed structured analysis." : "Analysis generated successfully."]
      }
    },
    demoMode
  );
}

function normalizeAnalysis(analysis, demoMode) {
  const sentiment = analysis.sentiment || {};
  const positive = clampPercent(sentiment.positive);
  const neutral = clampPercent(sentiment.neutral);
  const negative = Math.max(0, 100 - positive - neutral);

  return {
    ...analysis,
    tldr: padArray(analysis.tldr, 3, "Insufficient review detail to make a stronger claim.").slice(0, 3),
    sentiment: {
      positive,
      neutral,
      negative,
      themes: {
        positive: padArray(sentiment.themes?.positive, 3, "Positive theme unavailable.").slice(0, 3),
        neutral: padArray(sentiment.themes?.neutral, 2, "Neutral theme unavailable.").slice(0, 3),
        negative: padArray(sentiment.themes?.negative, 3, "Negative theme unavailable.").slice(0, 3)
      }
    },
    topPraised: padItems(analysis.topPraised, "Praise evidence is limited."),
    topComplained: padItems(analysis.topComplained, "Complaint evidence is limited."),
    buyVerdict: {
      score: Math.max(1, Math.min(10, Number.parseInt(analysis.buyVerdict?.score || 5, 10))),
      justification: analysis.buyVerdict?.justification || "The available evidence is mixed."
    },
    riskFlags: analysis.riskFlags || [],
    inputDiagnostics: analysis.inputDiagnostics || {
      reviewCountEstimate: 0,
      language: "Unknown",
      tooFewReviews: true,
      nonEnglish: false,
      spamSuspicion: "low",
      notes: [demoMode ? "Gemini is not configured." : "No diagnostics returned."]
    },
    generatedBy: demoMode ? "local-demo" : "gemini"
  };
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Number.parseInt(value || 0, 10)));
}

function padArray(value, length, fallback) {
  const array = Array.isArray(value) ? value : [];
  while (array.length < length) {
    array.push(fallback);
  }

  return array;
}

function padItems(value, fallback) {
  const array = Array.isArray(value) ? value : [];
  while (array.length < 3) {
    array.push({ theme: "Limited evidence", evidence: fallback, intensity: "low" });
  }

  return array.slice(0, 3);
}

function estimateReviews(text) {
  const explicit = text.match(/\b(review|rated|stars?|verified purchase)\b/gi)?.length || 0;
  const paragraphs = text.split(/\n{2,}|(?<=\.)\s+(?=[A-Z])/).filter((part) => part.trim().length > 45).length;
  return Math.max(1, Math.min(99, Math.round((explicit + paragraphs) / 2)));
}

function detectSpam(lower) {
  const duplicatePhrases = (lower.match(/\b(free product|honest review|five stars|highly recommend)\b/g) || []).length;
  const repeatedBang = (lower.match(/!/g) || []).length;

  if (duplicatePhrases >= 3 || repeatedBang > 12) {
    return "high";
  }

  if (duplicatePhrases >= 1) {
    return "medium";
  }

  return "low";
}

function looksNonEnglish(text) {
  const asciiLetters = (text.match(/[a-z]/gi) || []).length;
  const nonAscii = (text.match(/[^\x00-\x7F]/g) || []).length;
  return nonAscii > asciiLetters * 0.12;
}

function pickTheme(lower, type) {
  if (type === "positive") {
    if (lower.includes("easy")) return "ease of use";
    if (lower.includes("fast") || lower.includes("power")) return "performance";
    if (lower.includes("sturdy") || lower.includes("premium")) return "build quality";
    return "overall satisfaction";
  }

  if (lower.includes("crack") || lower.includes("broken") || lower.includes("failed")) return "durability";
  if (lower.includes("noisy") || lower.includes("loud")) return "noise";
  if (lower.includes("support") || lower.includes("return")) return "customer support";
  return "reliability and post-purchase risk";
}
