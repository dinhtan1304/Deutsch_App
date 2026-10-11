'use client';

/**
 * Signals that the user has just finished a study session successfully.
 *
 * Exists to decouple "a lesson ended well" from "ask for notification
 * permission". Only 2 of 342 users had web push enabled, because the toggle
 * lives inside Settings and nobody goes looking for it. The browser grants one
 * permission prompt per user and a denial is effectively permanent, so the ask
 * has to land at the single moment the reader is most receptive — right after
 * something went well — not when the app first loads.
 *
 * A DOM event rather than a store: the emitters are leaf components deep in the
 * game and review trees, and the listener is mounted once in the root layout.
 * Nothing needs shared state, only a notification that a moment happened.
 */

export const SESSION_COMPLETE_EVENT = 'dm:session-complete';

/** Call when a study session ends on a success screen. Safe to call on the server. */
export function signalSessionComplete(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SESSION_COMPLETE_EVENT));
}
