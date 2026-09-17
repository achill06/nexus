import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const NAV_ITEMS = [
  { to: '/matches', label: 'Matches' },
  { to: '/upload', label: 'Upload resume' },
  { to: '/shortlist', label: 'Shortlist' },
  { to: '/agent', label: 'Agent' },
  { to: '/briefing', label: 'Briefing' },
];

export default function Layout() {
  const { username, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <picture className="sidebar-brand-logo">
            <img
              src="/next-js-light.svg"
              alt="NextJs"
              width="40"
              height="40"
              className="sidebar-brand-logo-light"
            />
            <img
              src="/next-js-dark.svg"
              alt="NextJs"
              width="40"
              height="40"
              className="sidebar-brand-logo-dark"
            />
          </picture>
          <span className="auth-brand-name">Nexus</span>
        </div>

        <div className="sidebar-user" aria-label="Signed-in user">
          <span className="sidebar-user-status" aria-hidden="true" />
          <span className="sidebar-user-details">
            <span className="sidebar-user-greeting">
              Hi {username || 'User'}
            </span>
          </span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                'sidebar-link' +
                (isActive ? ' sidebar-link-active' : '')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="btn btn-danger sidebar-logout"
          onClick={logout}
        >
          <span className="sidebar-logout-icon" aria-hidden="true">
            <span className="sidebar-logout-door" />
            <span className="sidebar-logout-arrow" />
          </span>
          <span>Log out</span>
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}