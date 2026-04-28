import { useState } from 'react';
import { createShareLink } from '../apiClient.js';

/**
 * ShareLinkButton
 * --------------------------------------------------------------------------
 * Implements the "Shared Live Link" idea from the brief:
 *   "Give each tracked flight a shareable page or deep link so family /
 *    friends can open the same flight quickly."
 *
 * Hits POST /api/share with the flight number, gets back a shareId, and
 * copies the resulting URL to the clipboard.
 */
export default function ShareLinkButton({ flightNumber }) {
  const [state, setState] = useState('idle'); // idle | loading | copied | error
  const [error, setError] = useState(null);

  async function onClick() {
    try {
      setState('loading');
      const { shareId } = await createShareLink(flightNumber);
      const url = `${window.location.origin}/share/${shareId}`;
      await navigator.clipboard.writeText(url);
      setState('copied');
      setTimeout(() => setState('idle'), 2000);
    } catch (err) {
      setError(err.message ?? 'Failed to create link');
      setState('error');
    }
  }

  const label = {
    idle: 'Share link',
    loading: 'Creating link…',
    copied: '✓ Copied to clipboard',
    error: 'Try again',
  }[state];

  return (
    <button
      className={`ft-share ft-share--${state}`}
      onClick={onClick}
      disabled={state === 'loading'}
      title={error ?? undefined}
    >
      {label}
    </button>
  );
}
