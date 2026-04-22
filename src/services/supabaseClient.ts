import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    // React Native: persist sessions in AsyncStorage so the user has a
    // durable anonymous identity across app launches.
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // RN has no URL-based auth callback; disable to silence the warning.
    detectSessionInUrl: false,
  },
});

/**
 * Ensures an anonymous auth session exists. Idempotent — if the user already
 * has a session (persisted from a prior launch, or currently valid), this is
 * a no-op. If no session exists, calls `signInAnonymously()` to create a
 * durable anonymous user.
 *
 * Call once at app launch to minimize first-feature latency; also called
 * implicitly by `invokeClaudeProxy` as a safety net.
 */
export async function ensureSession(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return;
  const { error } = await supabase.auth.signInAnonymously();
  if (error) {
    throw new Error(`Anonymous sign-in failed: ${error.message}`);
  }
}

// Fire-and-forget eager sign-in on module import so the session is ready by
// the time the user hits an AI feature. Failures are logged; invokeClaudeProxy
// retries via its own ensureSession() call.
ensureSession().catch((err) => {
  console.warn('[supabase] Initial anonymous sign-in failed:', err);
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
  await ensureSession();
  const { data, error } = await supabase.functions.invoke<T>('claude-proxy', {
    body: req,
  });
  if (error) throw error;
  if (data === null) throw new Error('claude-proxy returned null response');
  return data;
}
