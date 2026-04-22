// claude-proxy — Supabase Edge Function that proxies requests to Anthropic.
//
// The Neurra app sends { prompt, maxTokens, model }.
// This function wraps that as an Anthropic `messages` request using the
// ANTHROPIC_API_KEY secret stored in Supabase (never in the app bundle).
//
// Rate limiting lives in Phase 5; this file is pure proxy + validation +
// timeout.

import "@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const TIMEOUT_MS = 3_000;

// Cap outbound max_tokens so a buggy client can't rack up cost on a single call.
const MAX_TOKENS_CEILING = 4_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface ProxyRequest {
  prompt: string;
  maxTokens: number;
  model: string;
  // Optional Anthropic system prompt. When present, it's forwarded as the
  // `system` field on the Anthropic request so role separation is preserved.
  system?: string;
}

// Returns the validated payload or a string describing the validation failure.
function validate(body: unknown): ProxyRequest | string {
  if (!body || typeof body !== "object") return "body must be a JSON object";
  const b = body as Record<string, unknown>;
  if (typeof b.prompt !== "string" || b.prompt.length === 0) {
    return "prompt must be a non-empty string";
  }
  if (
    typeof b.maxTokens !== "number" ||
    !Number.isFinite(b.maxTokens) ||
    b.maxTokens <= 0 ||
    b.maxTokens > MAX_TOKENS_CEILING
  ) {
    return `maxTokens must be a number between 1 and ${MAX_TOKENS_CEILING}`;
  }
  if (typeof b.model !== "string" || b.model.length === 0) {
    return "model must be a non-empty string";
  }
  if (b.system !== undefined) {
    if (typeof b.system !== "string" || b.system.length === 0) {
      return "system must be a non-empty string when provided";
    }
  }
  const out: ProxyRequest = { prompt: b.prompt, maxTokens: b.maxTokens, model: b.model };
  if (typeof b.system === "string") out.system = b.system;
  return out;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "method not allowed" });
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return json(500, { error: "ANTHROPIC_API_KEY not configured on server" });
  }

  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return json(400, { error: "invalid JSON body" });
  }

  const validated = validate(parsed);
  if (typeof validated === "string") {
    return json(400, { error: validated });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const upstream = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: validated.model,
        max_tokens: validated.maxTokens,
        ...(validated.system ? { system: validated.system } : {}),
        messages: [{ role: "user", content: validated.prompt }],
      }),
      signal: controller.signal,
    });

    const raw = await upstream.text();
    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      // Upstream returned non-JSON (rare, but possible on 5xx HTML pages).
      return json(upstream.status, { error: "upstream returned non-JSON", raw });
    }

    return new Response(JSON.stringify(payload), {
      status: upstream.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return json(504, { error: `upstream timeout after ${TIMEOUT_MS}ms` });
    }
    const msg = err instanceof Error ? err.message : "unknown error";
    return json(502, { error: "upstream fetch failed", detail: msg });
  } finally {
    clearTimeout(timeout);
  }
});
