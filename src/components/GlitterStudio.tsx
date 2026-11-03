"use client";

import { FormEvent, useEffect, useState } from "react";
import { themes, type ThemeKey } from "@/lib/prompt";
import { Turnstile } from "@/components/Turnstile";

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

const suggestions = [
  "FIJN WEEKEND, LEKKER DING!",
  "JIJ BENT MIJN TOPVRIEND. DE REST IS ADMINISTRATIE.",
  "GOEDEMORGEN! WEER EEN DAG DICHTER BIJ DE WIJN.",
  "VAN HARTE! JE ZIET ER NOG BEST GOED UIT.",
  "DOE RUSTIG. HET IS MAAR INTERNET.",
  "EEN DIKKE KNUFFEL. OF EEN BORREL. ZELF WETEN.",
  "BEDANKT VOOR ALLES. BEHALVE DAT ENE.",
  "VANDAAG EVEN NIET. MORGEN WAARSCHIJNLIJK OOK NIET.",
];

const themeIcons: Record<ThemeKey, string> = {
  foutgoud: "✨",
  gerda: "🥂",
  liefde: "💘",
  feest: "🎂",
  passief: "🙂",
  beesten: "🐾",
  bloemen: "🌹",
  ontspoord: "🦄",
};

export function GlitterStudio() {
  const [phrase, setPhrase] = useState(suggestions[0]);
  const [theme, setTheme] = useState<ThemeKey>("foutgoud");
  const [chaos, setChaos] = useState(2);
  const [previewUrl, setPreviewUrl] = useState("");
  const [generationMode, setGenerationMode] = useState<"ai" | "demo" | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function surpriseMe() {
    const current = suggestions.indexOf(phrase);
    setPhrase(suggestions[(current + 1) % suggestions.length]);
  }

  async function generate(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 70_000);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phrase, theme, chaos, turnstileToken }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error || "De glittermachine sputtert.");
      }

      const blob = await response.blob();
      const nextUrl = URL.createObjectURL(blob);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(nextUrl);
      setGenerationMode(
        response.headers.get("X-Generation-Mode") === "ai" ? "ai" : "demo"
      );
    } catch (reason) {
      setError(
        reason instanceof DOMException && reason.name === "AbortError"
          ? "Dit duurt te lang. Probeer het nog één keer."
          : reason instanceof Error
            ? reason.message
            : "Er ging iets mis. Zelfs Gerda weet niet wat."
      );
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
      if (turnstileSiteKey) setTurnstileResetKey((value) => value + 1);
    }
  }

  return (
    <main className="app-shell">
      <header className="brand-bar">
        <a className="brand" href="#" aria-label="GlitterGerda startpagina">
          <span className="brand-star" aria-hidden="true">✦</span>
          GlitterGerda
        </a>
        <span className="beta-pill">BETA, NATUURLIJK</span>
      </header>

      <section className="studio">
        <form className="control-panel" onSubmit={generate}>
          <div className="eyebrow">GEEN PROMPTS. GEEN GEDOE.</div>
          <h1>Maak je eigen<br /><span>glitterplaatje.</span></h1>
          <p className="intro">
            Jij kiest de tekst en sfeer. Gerda regelt de kitsch.
          </p>

          <label className="field-label" htmlFor="phrase">
            Wat moet erop? <span>Kort, duidelijk en liefst een tikje ordinair.</span>
          </label>
          <div className="text-wrap">
            <textarea
              id="phrase"
              value={phrase}
              maxLength={72}
              rows={3}
              onChange={(event) => setPhrase(event.target.value)}
              aria-describedby="phrase-count"
            />
            <span id="phrase-count" className="char-count">
              {phrase.length}/72
            </span>
          </div>
          <button className="surprise-button" type="button" onClick={surpriseMe}>
            ✦ Verras me met iets fouts
          </button>

          <fieldset className="theme-fieldset">
            <legend>Kies je soort chaos</legend>
            <div className="theme-grid">
              {(Object.keys(themes) as ThemeKey[]).map((key) => (
                <label
                  className={theme === key ? "theme-card selected" : "theme-card"}
                  key={key}
                >
                  <input
                    type="radio"
                    name="theme"
                    value={key}
                    checked={theme === key}
                    onChange={() => setTheme(key)}
                  />
                  <span className="theme-icon" aria-hidden="true">
                    {themeIcons[key]}
                  </span>
                  <span>{themes[key].label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="chaos-fieldset">
            <legend>Hoeveel glitter?</legend>
            <div className="chaos-options">
              {[
                [1, "Netjes"],
                [2, "Gerda"],
                [3, "Geen rem"],
              ].map(([value, label]) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="chaos"
                    checked={chaos === value}
                    onChange={() => setChaos(Number(value))}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {turnstileSiteKey && (
            <Turnstile
              siteKey={turnstileSiteKey}
              resetKey={turnstileResetKey}
              onToken={setTurnstileToken}
            />
          )}

          <button
            className="generate-button"
            type="submit"
            disabled={
              loading ||
              phrase.trim().length < 3 ||
              Boolean(turnstileSiteKey && !turnstileToken)
            }
          >
            {loading ? "GERDA IS AAN HET GLITTEREN…" : "MAAK MIJN GLITTERPLAATJE ✦"}
          </button>
          <div aria-live="polite">
            {loading && <p className="loading-message">Even geduld. Kitsch kost rekenkracht.</p>}
            {error && <p className="error-message" role="alert">{error}</p>}
          </div>
        </form>

        <section className="preview-panel" aria-label="Voorbeeld" aria-busy={loading}>
          <div className="preview-header">
            <span>JOUW MEESTERWERK</span>
            {generationMode && (
              <span className="mode-badge">
                {generationMode === "ai" ? "AI AAN" : "DEMOMODUS"}
              </span>
            )}
          </div>

          <div className={previewUrl ? "preview-frame ready" : "preview-frame"}>
            {previewUrl ? (
              <img src={previewUrl} alt="Je bewegende glitterplaatje" />
            ) : (
              <div className="empty-preview">
                <span className="empty-star">✦</span>
                <strong>Hier verschijnt je GIF</strong>
                <small>Echt bewegend. Geen nepglitter.</small>
              </div>
            )}
          </div>

          {previewUrl ? (
            <a
              className="download-button"
              href={previewUrl}
              download="glittergerda.gif"
            >
              GIF DOWNLOADEN ↓
            </a>
          ) : (
            <p className="preview-note">
              480 × 480 pixels · echte GIF · eindeloze glitterloop
            </p>
          )}
        </section>
      </section>

      <footer>
        <span>Gemaakt voor mensen die hun kostbare tijd liever ergens anders verspillen.</span>
        <nav aria-label="Juridische informatie">
        </nav>
      </footer>
    </main>
  );
}
