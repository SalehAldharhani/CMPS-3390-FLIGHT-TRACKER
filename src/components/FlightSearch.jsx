import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateFlightNumber } from '../validators.js';

/**
 * FlightSearch
 * --------------------------------------------------------------------------
 * Lets the user enter a flight number, validates it client-side, and
 * navigates to /flight/:flightNumber on submit.
 *
 * The same validator is re-used on the server to enforce the rule.
 */
export default function FlightSearch() {
  const [value, setValue] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  function onSubmit(e) {
    e.preventDefault();
    const result = validateFlightNumber(value);
    if (!result.ok) { setError(result.error); return; }
    setError(null);
    navigate(`/flight/${result.value}`);
  }

  return (
    <form className="ft-search" onSubmit={onSubmit} noValidate>
      <label htmlFor="flight-input" className="sr-only">Flight number</label>
      <div className="ft-search__row">
        <input
          id="flight-input"
          className="ft-search__input mono"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="e.g. AA100"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? 'flight-input-error' : undefined}
        />
        <button type="submit" className="ft-search__btn">Track flight</button>
      </div>
      {error && (
        <p id="flight-input-error" className="ft-search__error" role="alert">{error}</p>
      )}
    </form>
  );
}
