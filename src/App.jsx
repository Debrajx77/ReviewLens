import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  Link,
  Loader2,
  Search,
  Share2,
  ShieldAlert,
  Sparkles,
  ThumbsDown,
  ThumbsUp
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const sampleReviews =
  "I love this blender. It crushes ice fast and feels sturdy. Shipping was quick. One review says the lid cracked after two weeks. Another buyer said customer support was slow and the jar leaked. Overall many people say it is powerful and easy to clean, but a few complain it is noisy.";

export default function App() {
  const [inputType, setInputType] = useState("reviews");
  const [input, setInput] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [shareId, setShareId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    const match = window.location.pathname.match(/^\/report\/([a-z0-9]+)/i);

    if (match) {
      loadReport(match[1]);
    }
  }, []);

  const shareUrl = useMemo(() => {
    if (!shareId) return "";
    return `${window.location.origin}/report/${shareId}`;
  }, [shareId]);

  async function loadReport(id) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/reports/${id}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Report not found.");
      }

      setAnalysis(payload.analysis);
      setShareId(payload.id);
      setInputType(payload.inputType);
      setInput(payload.inputPreview);
    } catch (reportError) {
      setError(reportError.message);
    } finally {
      setLoading(false);
    }
  }

  async function analyze(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setCopied("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, inputType })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Analysis failed.");
      }

      setAnalysis(payload.analysis);
      setShareId(payload.shareId);
      window.history.replaceState({}, "", payload.reportUrl);
    } catch (analyzeError) {
      setError(analyzeError.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyReport() {
    if (!analysis) return;
    await navigator.clipboard.writeText(formatReport(analysis, shareUrl));
    flashCopied("report");
  }

  async function copyShareLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    flashCopied("link");
  }

  function flashCopied(kind) {
    setCopied(kind);
    window.setTimeout(() => setCopied(""), 1800);
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white shadow-soft">
              <Search size={20} />
            </div>
            <div>
              <p className="text-xl font-semibold tracking-normal">ReviewLens</p>
              <p className="text-sm text-slate-500">Customer review intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill icon={Sparkles} label={analysis?.generatedBy === "gemini" ? "Gemini" : "Demo"} />
            <StatusPill icon={ShieldAlert} label="Spam checks" />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[410px_1fr]">
          <form onSubmit={analyze} className="panel flex flex-col gap-5 self-start">
            <div className="flex rounded-lg bg-slate-100 p-1">
              <SegmentButton active={inputType === "reviews"} onClick={() => setInputType("reviews")}>
                Reviews
              </SegmentButton>
              <SegmentButton active={inputType === "url"} onClick={() => setInputType("url")}>
                Product URL
              </SegmentButton>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">
                {inputType === "url" ? "Product URL" : "Customer reviews"}
              </span>
              {inputType === "url" ? (
                <input
                  className="field h-12"
                  placeholder="https://store.example.com/product"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                />
              ) : (
                <textarea
                  className="field min-h-64 resize-y leading-6"
                  placeholder="Paste review text here..."
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                />
              )}
            </label>

            <div className="grid grid-cols-[1fr_auto] gap-3">
              <button className="primary-button" disabled={loading || input.trim().length < 20}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : <BarChart3 size={18} />}
                Analyze
              </button>
              <button
                type="button"
                className="icon-button"
                title="Load sample reviews"
                onClick={() => {
                  setInputType("reviews");
                  setInput(sampleReviews);
                }}
              >
                <Clipboard size={18} />
              </button>
            </div>

            {error ? (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                <AlertTriangle className="mt-0.5 shrink-0" size={16} />
                <span>{error}</span>
              </div>
            ) : null}
          </form>

          <section className="min-h-[620px]">
            {loading ? <LoadingDashboard /> : analysis ? (
              <ResultsDashboard
                analysis={analysis}
                shareUrl={shareUrl}
                copied={copied}
                onCopyReport={copyReport}
                onCopyShareLink={copyShareLink}
              />
            ) : (
              <EmptyState />
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function SegmentButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      className={`h-10 flex-1 rounded-md text-sm font-medium transition ${
        active ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function StatusPill({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
      <Icon size={14} />
      {label}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="panel grid min-h-[620px] place-items-center overflow-hidden">
      <div className="relative flex max-w-md flex-col items-center text-center">
        <div className="mb-5 grid w-56 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="h-2 w-24 rounded bg-cyan-500" />
          <div className="h-2 w-40 rounded bg-emerald-500" />
          <div className="h-2 w-32 rounded bg-amber-500" />
          <div className="h-2 w-20 rounded bg-rose-500" />
        </div>
        <div className="relative grid h-16 w-16 place-items-center rounded-lg bg-slate-950 text-white shadow-soft">
          <Sparkles size={26} />
        </div>
        <h1 className="relative mt-5 text-3xl font-semibold tracking-normal text-slate-950">Review analysis, ready when you are</h1>
        <p className="relative mt-3 text-sm leading-6 text-slate-500">
          Paste reviews or submit a product URL to generate sentiment, themes, risks, and a buy verdict.
        </p>
      </div>
    </div>
  );
}

function LoadingDashboard() {
  return (
    <div className="panel min-h-[620px]">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
          <Loader2 className="animate-spin" size={22} />
        </div>
        <div>
          <p className="font-semibold">Scanning review signals</p>
          <p className="text-sm text-slate-500">Structuring sentiment, themes, risk flags, and verdict.</p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {["w-4/5", "w-3/5", "w-5/6"].map((width) => (
          <div className="rounded-lg border border-slate-200 bg-white p-4" key={width}>
            <div className="skeleton h-4 w-20" />
            <div className={`skeleton mt-6 h-8 ${width}`} />
            <div className="skeleton mt-5 h-2 w-full" />
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="skeleton h-72 rounded-lg" />
        <div className="skeleton h-72 rounded-lg" />
      </div>
    </div>
  );
}

function ResultsDashboard({ analysis, shareUrl, copied, onCopyReport, onCopyShareLink }) {
  const score = analysis.buyVerdict.score;
  const scoreColor = score >= 8 ? "text-emerald-600" : score >= 6 ? "text-amber-600" : "text-rose-600";

  return (
    <div className="grid gap-5">
      <div className="panel">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-cyan-700">AI Report</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal">Structured review verdict</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="secondary-button" onClick={onCopyReport}>
              <Clipboard size={16} />
              {copied === "report" ? "Copied" : "Copy report"}
            </button>
            <button className="secondary-button" onClick={onCopyShareLink}>
              <Share2 size={16} />
              {copied === "link" ? "Copied" : "Share link"}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[220px_1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">Buy verdict</p>
            <div className={`mt-3 flex items-end gap-1 ${scoreColor}`}>
              <span className="text-6xl font-semibold leading-none">{score}</span>
              <span className="pb-2 text-xl font-semibold">/10</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">{analysis.buyVerdict.justification}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">TL;DR</p>
            <ol className="mt-3 grid gap-3">
              {analysis.tldr.map((sentence, index) => (
                <li className="flex gap-3 text-sm leading-6 text-slate-700" key={sentence}>
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-semibold text-slate-600">
                    {index + 1}
                  </span>
                  {sentence}
                </li>
              ))}
            </ol>
            {shareUrl ? (
              <a className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-700" href={shareUrl}>
                <Link size={15} />
                Open shareable report
                <ExternalLink size={14} />
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="panel">
          <h3 className="section-title">Sentiment breakdown</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <SentimentCard label="Positive" value={analysis.sentiment.positive} tone="emerald" />
            <SentimentCard label="Neutral" value={analysis.sentiment.neutral} tone="amber" />
            <SentimentCard label="Negative" value={analysis.sentiment.negative} tone="rose" />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <ThemeList title="Positive themes" items={analysis.sentiment.themes.positive} />
            <ThemeList title="Neutral themes" items={analysis.sentiment.themes.neutral} />
            <ThemeList title="Negative themes" items={analysis.sentiment.themes.negative} />
          </div>
        </div>

        <div className="panel">
          <h3 className="section-title">Diagnostics</h3>
          <div className="mt-4 grid gap-3">
            <Diagnostic label="Review estimate" value={analysis.inputDiagnostics.reviewCountEstimate} />
            <Diagnostic label="Language" value={analysis.inputDiagnostics.language} />
            <Diagnostic label="Spam suspicion" value={analysis.inputDiagnostics.spamSuspicion} />
          </div>
          <div className="mt-5 grid gap-2">
            {analysis.riskFlags.length ? (
              analysis.riskFlags.map((flag) => (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" key={`${flag.type}-${flag.description}`}>
                  <div className="flex items-center gap-2 font-medium">
                    <AlertTriangle size={15} />
                    {flag.type.replaceAll("_", " ")} · {flag.severity}
                  </div>
                  <p className="mt-1 leading-5">{flag.description}</p>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                <CheckCircle2 size={16} />
                No major risk flags returned.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SignalList icon={ThumbsUp} title="Top 3 praised" items={analysis.topPraised} tone="emerald" />
        <SignalList icon={ThumbsDown} title="Top 3 complained about" items={analysis.topComplained} tone="rose" />
      </div>
    </div>
  );
}

function SentimentCard({ label, value, tone }) {
  const tones = {
    emerald: "bg-emerald-500 text-emerald-700",
    amber: "bg-amber-500 text-amber-700",
    rose: "bg-rose-500 text-rose-700"
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-4xl font-semibold ${tones[tone].split(" ")[1]}`}>{value}%</p>
      <div className="mt-4 h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${tones[tone].split(" ")[0]}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ThemeList({ title, items }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <ul className="mt-2 grid gap-2">
        {items.map((item) => (
          <li className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SignalList({ icon: Icon, title, items, tone }) {
  const toneClass = tone === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700";

  return (
    <div className="panel">
      <div className="flex items-center gap-2">
        <span className={`grid h-9 w-9 place-items-center rounded-lg ${toneClass}`}>
          <Icon size={18} />
        </span>
        <h3 className="section-title">{title}</h3>
      </div>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div className="rounded-lg border border-slate-200 bg-white p-4" key={`${title}-${item.theme}-${item.evidence}`}>
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-slate-800">{item.theme}</p>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{item.intensity}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.evidence}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Diagnostic({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium capitalize text-slate-800">{String(value)}</span>
    </div>
  );
}

function formatReport(analysis, shareUrl) {
  return [
    "ReviewLens report",
    "",
    "TL;DR",
    ...analysis.tldr.map((sentence, index) => `${index + 1}. ${sentence}`),
    "",
    `Sentiment: ${analysis.sentiment.positive}% positive, ${analysis.sentiment.neutral}% neutral, ${analysis.sentiment.negative}% negative`,
    "",
    "Top praised",
    ...analysis.topPraised.map((item, index) => `${index + 1}. ${item.theme}: ${item.evidence}`),
    "",
    "Top complained about",
    ...analysis.topComplained.map((item, index) => `${index + 1}. ${item.theme}: ${item.evidence}`),
    "",
    `Buy verdict: ${analysis.buyVerdict.score}/10 - ${analysis.buyVerdict.justification}`,
    shareUrl ? `Share: ${shareUrl}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}
