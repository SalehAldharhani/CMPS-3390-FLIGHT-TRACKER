import { useState } from 'react';
import { createShareLink } from '../apiClient.js';
import { useAuth } from './AuthContext.jsx';

/**
 * ShareLinkButton
 * --------------------------------------------------------------------------
 * Implements the "Shared Live Link" idea from the brief:
 *   "Give each tracked flight a shareable page or deep link so family /
 *    friends can open the same flight quickly."
 *
 * Hits POST /api/share with the flight number AND the current username
 * (so the shared page can say "Jon will arrive at..."), gets back a
 * shareId, and copies the resulting URL to the clipboard.
 */
export default function ShareLinkButton({ flightNumber }) {
  const { currentUser } = useAuth();
  const [state, setState] = useState('idle'); // idle | loading | copied | error
  const [error, setError] = useState(null);

  async function onClick() {
    try {
      setState('loading');
      const { shareId } = await createShareLink(flightNumber, {
        sharedBy: currentUser ?? null,
      });
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
