const REMOTE_LABEL = {
  yes: 'Remote',
  no: 'On-site',
  not_specified: 'Remote status unknown',
};

const LEVEL_LABEL = {
  intern: 'Internship',
  entry: 'Entry level',
  mid: 'Mid level',
  senior: 'Senior',
};

/**
 * Shared card for a listing. `scoreLabel` is the small badge in the top
 * right — pass a similarity percentage on Matches, a "Saved on ..." date on
 * Shortlist, or omit it. `actions` renders whatever buttons the calling page
 * needs (Save / Remove), keeping shortlist-vs-match logic out of this file.
 */
export default function ListingCard({
  listing,
  scoreLabel,
  scoreValue,
  scoreVariant = 'match',
  justification,
  actions,
}) {
  const {
    title,
    company,
    location,
    remote_ok: remoteOk,
    stipend,
    required_skills: requiredSkills = [],
    experience_level: experienceLevel,
    deadline,
    apply_url: applyUrl,
  } = listing;

  return (
    <article className="listing-card">
      <div className="listing-card-main">
        <div className="listing-card-top">
          <div>
            <h3 className="listing-title">{title}</h3>
            <p className="listing-company">
              {company} · {location}
            </p>
          </div>

          {scoreLabel && (
            <span className={`listing-score listing-score-${scoreVariant}`}>
              {scoreVariant === 'match' ? (
                <>
                  <strong className="listing-score-value">{scoreValue}</strong>
                  <span className="listing-score-caption">{scoreLabel}</span>
                </>
              ) : (
                <>
                  <span className="listing-score-icon" aria-hidden="true" />
                  <span>{scoreLabel}</span>
                </>
              )}
            </span>
          )}
        </div>

        <div className="listing-tags">
          {remoteOk && (
            <span className="tag">
              {REMOTE_LABEL[remoteOk] || remoteOk}
            </span>
          )}

          {experienceLevel && (
            <span className="tag">
              {LEVEL_LABEL[experienceLevel] || experienceLevel}
            </span>
          )}

          {stipend && (
            <span className="tag">
              {stipend}
            </span>
          )}

          {deadline && (
            <span className="tag tag-deadline">
              Apply by {deadline}
            </span>
          )}
        </div>

        {requiredSkills.length > 0 && (
          <p className="listing-skills">
            {requiredSkills.join(' · ')}
          </p>
        )}

        {justification && (
          <p className="listing-justification">
            {justification}
          </p>
        )}
      </div>

      {(applyUrl || actions) && (
        <div className="listing-card-actions">
          {applyUrl && (
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-apply"
            >
              Apply
            </a>
          )}

          {actions}
        </div>
      )}
    </article>
  );
}