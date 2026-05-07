import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const navItems = [
  { to: '/dashboard', icon: '◈', label: 'Dashboard' },
  { to: '/projects', icon: '⬡', label: 'Projects' },
  { to: '/tasks', icon: '✦', label: 'My Tasks' },
  { to: '/users', icon: '◉', label: 'Team', adminOnly: true },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => { logout(); nav('/'); };

  return (
    <div style={styles.root}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarInner}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>⚡</span>
            <span style={styles.logoText}>TaskFlow</span>
          </div>

          <nav style={styles.nav}>
            {navItems.map(item => {
              if (item.adminOnly && user?.role !== 'admin') return null;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={({ isActive }) => ({
                    ...styles.navItem,
                    ...(isActive ? styles.navItemActive : {})
                  })}
                >
                  <span style={styles.navIcon}>{item.icon}</span>
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div style={styles.userArea}>
            <div style={styles.userInfo}>
              <div style={styles.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
              <div>
                <div style={styles.userName}>{user?.name}</div>
                <span className="badge badge-admin" style={{ fontSize: '0.65rem' }}>{user?.role}</span>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <main style={styles.main}>
        <div style={styles.mainInner}>
          {children}
        </div>
      </main>
    </div>
  );
}

const styles = {
  root: { display: 'flex', minHeight: '100vh' },
  sidebar: {
    width: '220px', flexShrink: 0,
    background: 'var(--bg2)', borderRight: '1px solid var(--border)',
    position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
    overflowY: 'auto'
  },
  sidebarInner: { display: 'flex', flexDirection: 'column', height: '100%', padding: '1.25rem 1rem' },
  logo: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', padding: '0 0.25rem' },
  logoIcon: { fontSize: '1.2rem' },
  logoText: { fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '1.1rem' },
  nav: { display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    padding: '0.55rem 0.75rem', borderRadius: 'var(--radius2)',
    color: 'var(--text2)', fontSize: '0.875rem', fontWeight: 500,
    transition: 'all 0.15s', textDecoration: 'none'
  },
  navItemActive: {
    background: 'rgba(108,99,255,0.15)', color: 'var(--accent2)'
  },
  navIcon: { fontSize: '0.9rem', width: '16px', textAlign: 'center' },
  userArea: { borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' },
  avatar: {
    width: '32px', height: '32px', borderRadius: '50%',
    background: 'var(--accent3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0
  },
  userName: { fontSize: '0.83rem', fontWeight: 600, color: 'var(--text)' },
  main: { flex: 1, marginLeft: '220px', minHeight: '100vh' },
  mainInner: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' }
};
