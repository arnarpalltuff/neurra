import { router } from 'expo-router';

type PushArg = Parameters<typeof router.push>[0];
type ReplaceArg = Parameters<typeof router.replace>[0];

/**
 * Typed wrapper around router.push that centralizes the one cast we need
 * until expo-router typed-routes codegen is enabled. Call sites remain
 * `as any`-free and string-literal routes stay authored plainly.
 */
export function navigate(path: string | { pathname: string; params?: Record<string, unknown> }) {
  router.push(path as unknown as PushArg);
}

/**
 * Same centralized-cast pattern for router.replace. Use for destructive
 * navigations (post-delete, post-logout) where the user shouldn't back-nav.
 */
export function navigateReplace(path: string | { pathname: string; params?: Record<string, unknown> }) {
  router.replace(path as unknown as ReplaceArg);
}
