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
          built. This page is a placeholder so the nav is complete; nothing here is functional.
        </p>
      </div>
    </div>
  );
}
