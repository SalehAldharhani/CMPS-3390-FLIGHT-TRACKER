import { useState } from 'react';
import { createShareLink } from '../apiClient.js';
import { useAuth } from './AuthContext.jsx';

export default function ShareLinkButton({ flightNumber }) {
  const { currentUser } = useAuth();
  const [state, setState] = useState('idle');
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
