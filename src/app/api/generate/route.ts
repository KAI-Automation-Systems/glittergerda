import { NextRequest } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { createDemoBase, createGlitterGif } from "@/lib/gif";
import { buildImagePrompt, themes, type ThemeKey } from "@/lib/prompt";
import {
  acquireGenerationSlot,
  checkGenerationLimit,
  getClientIp,
  verifyTurnstile,
} from "@/lib/security";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z
  .object({
    phrase: z.string().trim().min(3).max(72),
    theme: z.enum(Object.keys(themes) as [ThemeKey, ...ThemeKey[]]),
    chaos: z.number().int().min(1).max(3),
    turnstileToken: z.string().max(2_048).optional(),
  })
  .strict();

async function generateAiBase(theme: ThemeKey, chaos: number) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.images.generate({
    model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-flare",
    prompt: buildImagePrompt(theme, chaos),
    size: "1024x1024",
    quality: "low",
  } as never);

  const item = response.data?.[0] as
    | { b64_json?: string; url?: string }
    | undefined;

  if (item?.b64_json) {
    return Buffer.from(item.b64_json, "base64");
  }

  if (item?.url) {
    const result = await fetch(item.url);
    if (!result.ok) throw new Error("Generated image could not be downloaded.");
    return Buffer.from(await result.arrayBuffer());
  }

  throw new Error("The image service returned no image.");
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (!contentType.includes("application/json")) {
    return Response.json({ error: "Ongeldig verzoek." }, { status: 415 });
  }
  if (contentLength > 4_096) {
    return Response.json({ error: "Dat verzoek is wel erg enthousiast." }, { status: 413 });
  }

  let parsed: z.infer<typeof requestSchema>;
  try {
    parsed = requestSchema.parse(await request.json());
  } catch {
    return Response.json(
      { error: "Controleer de tekst en probeer het opnieuw." },
      { status: 400 }
    );
  }

  const ip = getClientIp(request);
  try {
    if (!(await verifyTurnstile(parsed.turnstileToken, ip))) {
      return Response.json(
        { error: "De botcontrole is verlopen. Probeer het opnieuw." },
        { status: 403 }
      );
    }
  } catch {
    return Response.json(
      { error: "De botcontrole is even onbereikbaar." },
      { status: 503 }
    );
  }

  const rateLimit = checkGenerationLimit(ip);
  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Rustig aan, Gerda. Probeer het over een paar minuten opnieuw." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter) },
      }
    );
  }

  const releaseSlot = acquireGenerationSlot();
  if (!releaseSlot) {
    return Response.json(
      { error: "De glittermachine is bezet. Probeer het zo nog eens." },
      { status: 503 }
    );
  }

  const aiEnabled = Boolean(process.env.OPENAI_API_KEY);
  let base: Buffer;

  try {
    base = aiEnabled
      ? await generateAiBase(parsed.theme, parsed.chaos)
      : await createDemoBase(parsed.theme);

    const gif = await createGlitterGif(
      base,
      parsed.phrase,
      parsed.chaos
    );

    return new Response(new Uint8Array(gif), {
      headers: {
        "Content-Type": "image/gif",
        "Content-Disposition": 'inline; filename="glittergerda.gif"',
        "Cache-Control": "no-store",
        "X-Generation-Mode": aiEnabled ? "ai" : "demo",
      },
    });
  } catch (error) {
    console.error("Glitter generation failed", error);
    return Response.json(
      { error: "De glittermachine liep vast. Probeer het nog één keer." },
      { status: 502 }
    );
  } finally {
    releaseSlot();
  }
}
