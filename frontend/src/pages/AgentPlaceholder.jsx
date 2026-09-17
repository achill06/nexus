export default function AgentPlaceholder() {
  return (
    <div className="page">
      <header className="page-header">
        <h1>Agent</h1>
        <p className="page-subhead">Ask questions about your saved matches.</p>
      </header>
      <div className="panel panel-coming-soon">
        <span className="coming-soon-badge">Coming soon</span>
        <p>
          The chat agent isn't wired up yet. The backend's tool-calling endpoints haven't been
          built.In the meantime, you can still view your top matches in the <a href="/matches">Matches</a> page.
        </p>
      </div>
    </div>
  );
}
