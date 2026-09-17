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
          hasn't been built. It will be available in a future release. In the meantime, you can still view your top matches in the <a href="/matches">Matches</a> page.
        </p>
      </div>
    </div>
  );
}
