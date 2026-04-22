import { createClient } from '@supabase/supabase-js';

// Env vars come from `.env` and are inlined at build time by Expo.
// `EXPO_PUBLIC_*` prefix is required for vars that need to be available to
// the client bundle. Both are safe to ship — the publishable key is
// public-by-design; the secret is ANTHROPIC_API_KEY on Supabase, never here.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Copy .env.example to .env and fill in real values.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Supabase Auth is not wired up yet. Disabling session persistence avoids
    // unused AsyncStorage traffic and silences the related React Native warning.
    persistSession: false,
  },
});

export interface ClaudeProxyRequest {
  prompt: string;
  maxTokens: number;
  model: string;
  /** Optional Anthropic system prompt. Forwarded verbatim when provided. */
  system?: string;
}

/**
 * Call the `claude-proxy` Edge Function with a standard payload.
 * Returns the Anthropic response body verbatim; throws on transport or
 * function errors so callers can handle failures with try/catch.
 */
export async function invokeClaudeProxy<T = unknown>(req: ClaudeProxyRequest): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>('claude-proxy', {
    body: req,
  });
  if (error) throw error;
  if (data === null) throw new Error('claude-proxy returned null response');
  return data;
}
