import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  api,
  ApiError,
  getMatchesCacheKey,
  getMatchesCacheVersion,
  invalidateMatchesCache,
} from '../api/client';
import { useAuth } from '../auth/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ListingCard from '../components/ListingCard';

export default function Matches() {
  const { userId } = useAuth();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [matches, setMatches] = useState([]);
  const [errorInfo, setErrorInfo] = useState(null); // { kind: 'no-resume' | 'not-ready' | 'other', message }
  const [savedIds, setSavedIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);
  const [saveErrorId, setSaveErrorId] = useState(null);
  const matchRequestRef = useRef(0);

  async function loadShortlistIds() {
    try {
      const { shortlist } = await api.get('/shortlist');
      setSavedIds(new Set(shortlist.map((item) => item.listing_id)));
    } catch {
      // non-critical — the Save button just won't reflect prior saves
    }
  }

  async function loadMatches({ force = false } = {}) {
    if (!userId) return;

    const requestId = ++matchRequestRef.current;
    const cacheKey = getMatchesCacheKey(userId);

    if (force) {
      invalidateMatchesCache(userId);
    }

    const cacheVersion = getMatchesCacheVersion();

    if (!force) {
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          const cachedMatches = JSON.parse(cached);
          if (
            Array.isArray(cachedMatches) &&
            cachedMatches.every((listing) => listing.justification?.trim()) &&
            requestId === matchRequestRef.current
          ) {
            setMatches(cachedMatches);
            setStatus('success');
            setErrorInfo(null);
            return;
          }
        } catch {
          // corrupt cache — calculate fresh matches below
        }

        localStorage.removeItem(cacheKey);
      }
    }

    setStatus('loading');
    setErrorInfo(null);

    try {
      const { matches: results } = await api.get('/matching/matches?limit=10');
      if (
        requestId !== matchRequestRef.current ||
        cacheVersion !== getMatchesCacheVersion()
      ) return;

      setMatches(results);
      localStorage.setItem(cacheKey, JSON.stringify(results));
      setStatus('success');
    } catch (err) {
      if (requestId !== matchRequestRef.current) return;

      if (err instanceof ApiError && err.status === 404) {
        setErrorInfo({ kind: 'no-resume', message: err.message });
      } else if (err instanceof ApiError && err.status === 409) {
        setErrorInfo({ kind: 'not-ready', message: err.message });
      } else {
        setErrorInfo({ kind: 'other', message: err.message || 'Could not load matches.' });
      }
      setStatus('error');
    }
  }

  useEffect(() => {
    if (!userId) return;

    loadShortlistIds();
    loadMatches();
  }, [userId]);

  useEffect(() => {
    function handleMatchesReady() {
      loadMatches();
    }

    window.addEventListener('nexus:matches-ready', handleMatchesReady);
    return () => window.removeEventListener('nexus:matches-ready', handleMatchesReady);
  }, [userId]);

  async function handleSave(listing) {
    setSavingId(listing.id);
    setSaveErrorId(null);
    try {
      await api.post('/shortlist', {
        listingId: listing.id,
        matchScore: listing.similarity,
        justification: listing.justification,
      });
      setSavedIds((prev) => new Set(prev).add(listing.id));
    } catch {
      setSaveErrorId(listing.id);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Your matches</h1>
          <p className="page-subhead">Ranked against your most recent resume.</p>
        </div>
        {status === 'success' && (
          <button type="button" className="btn btn-ghost btn-refresh" onClick={() => loadMatches({ force: true })}>
            <span className="btn-refresh-icon" aria-hidden="true">↻</span>
            <span>Recalculate</span>
          </button>
        )}
      </header>

      {status === 'loading' && (
        <LoadingSpinner label="Finding your best matches. We score every listing individually, this can take up to a minute." />
      )}

      {status === 'error' && errorInfo?.kind === 'no-resume' && (
        <div className="panel panel-empty">
          <p>You haven't uploaded a resume yet.</p>
          <Link to="/upload" className="btn btn-primary">
            Upload your resume
          </Link>
        </div>
      )}

      {status === 'error' && errorInfo?.kind === 'not-ready' && (
        <div className="panel panel-empty">
          <p>{errorInfo.message}</p>
          <button type="button" className="btn btn-primary" onClick={() => loadMatches({ force: true })}>
            Try again
          </button>
        </div>
      )}

      {status === 'error' && errorInfo?.kind === 'other' && (
        <div className="panel panel-empty">
          <p className="form-error">{errorInfo.message}</p>
          <button type="button" className="btn btn-primary" onClick={() => loadMatches({ force: true })}>
            Retry
          </button>
        </div>
      )}

      {status === 'success' && matches.length === 0 && (
        <div className="panel panel-empty">
          <p>No matches found yet. Check back once more listings have been scraped.</p>
        </div>
      )}

      {status === 'success' && matches.length > 0 && (
        <div className="listing-list">
          {matches.map((listing) => {
            const isSaved = savedIds.has(listing.id);
            const isSaving = savingId === listing.id;
            return (
              <ListingCard
                key={listing.id}
                listing={listing}
                scoreValue={`${Math.round(listing.similarity * 100)}%`}
                scoreLabel="match"
                scoreVariant="match"
                justification={listing.justification}
                actions={
                  <>
                    <button
                      type="button"
                      className={'btn btn-save ' + (isSaved ? 'btn-done' : 'btn-primary')}
                      disabled={isSaved || isSaving}
                      onClick={() => handleSave(listing)}
                    >
                      {isSaved ? (
                        <><span className="saved-check" aria-hidden="true" /> Saved</>
                      ) : isSaving ? (
                        <><span className="save-spinner" aria-hidden="true" /> Saving…</>
                      ) : (
                        <><span aria-hidden="true">+</span> Save to shortlist</>
                      )}
                    </button>
                    {saveErrorId === listing.id && (
                      <span className="form-error form-error-inline" role="alert">
                        Couldn't save. Try again.
                      </span>
                    )}
                  </>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}