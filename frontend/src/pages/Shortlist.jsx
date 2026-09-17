import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ListingCard from '../components/ListingCard';

function formatSavedDate(isoString) {
  const date = new Date(isoString);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function Shortlist() {
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [items, setItems] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [removingId, setRemovingId] = useState(null);
  const [removeError, setRemoveError] = useState('');

  async function load() {
    setStatus('loading');
    try {
      const { shortlist } = await api.get('/shortlist');
      setItems(shortlist);
      setStatus('success');
    } catch (err) {
      setErrorMessage(err.message || 'Could not load your shortlist.');
      setStatus('error');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRemove(listingId) {
    setRemovingId(listingId);
    setRemoveError('');
    try {
      await api.del(`/shortlist/${listingId}`);
      setItems((prev) => prev.filter((item) => item.listing_id !== listingId));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setItems((prev) => prev.filter((item) => item.listing_id !== listingId));
      } else {
        setRemoveError(err.message || 'Could not remove this listing.');
      }
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Shortlist</h1>
          <p className="page-subhead">Listings you've saved for later.</p>
        </div>
      </header>

      {removeError && <p className="form-error" role="alert">{removeError}</p>}

      {status === 'loading' && <LoadingSpinner label="Loading your shortlist…" />}

      {status === 'error' && (
        <div className="panel panel-empty">
          <p className="form-error" role="alert">{errorMessage}</p>
          <button type="button" className="btn btn-primary" onClick={load}>
            Retry
          </button>
        </div>
      )}

      {status === 'success' && items.length === 0 && (
        <div className="panel panel-empty">
          <p>Nothing saved yet — save a listing from your matches to see it here.</p>
        </div>
      )}

      {status === 'success' && items.length > 0 && (
        <div className="listing-list">
          {items.map((item) => {
            const savedDate = formatSavedDate(item.saved_at);
            return (
              <ListingCard
                key={item.shortlist_id}
                listing={item}
                scoreLabel={savedDate ? `Saved on ${savedDate}` : 'Saved'}
                scoreVariant="saved"
                justification={item.justification}
                actions={
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={removingId === item.listing_id}
                    onClick={() => handleRemove(item.listing_id)}
                  >
                    {removingId === item.listing_id ? 'Removing…' : 'Remove'}
                  </button>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
