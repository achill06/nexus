export default function BriefingPlaceholder() {
  return (
    <div className="page">
      <header className="page-header">
        <h1>Briefing</h1>
        <p className="page-subhead">A short video summary of your top matches for the week.</p>
      </header>
      <div className="panel panel-coming-soon">
        <span className="coming-soon-badge">Coming soon</span>
        <p>
          Video briefing generation isn't wired up yet. The backend's async video job pipeline
          hasn't been built. This page is a placeholder so the nav is complete; nothing here is
          functional.
        </p>
      </div>
    </div>
  );
}
