import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const nav = useNavigate();

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await signup(form.name, form.email, form.password, form.role);
      nav('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.bg} />
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>⚡</span>
          <span style={styles.logoText}>TaskFlow</span>
        </div>
        <h2 style={styles.title}>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
        <p style={styles.sub}>{mode === 'login' ? 'Sign in to your workspace' : 'Start managing your team'}</p>

        <form onSubmit={submit} style={{ marginTop: '1.5rem' }}>
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input value={form.name} onChange={set('name')} placeholder="Jane Doe" required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required minLength={6} />
          </div>
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Role</label>
              <select value={form.role} onChange={set('role')}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          {error && <p className="error-msg" style={{ marginBottom: '0.75rem' }}>{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.7rem' }} disabled={loading}>
            {loading ? <span className="spinner" /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div style={styles.demo}>
          <p style={{ color: 'var(--text3)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Demo accounts:</p>
          <code style={styles.code}>admin@demo.com / demo123 (Admin)</code><br/>
          <code style={styles.code}>member@demo.com / demo123 (Member)</code>
        </div>

        <p style={styles.switch}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button style={styles.switchBtn} onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem', position: 'relative', overflow: 'hidden'
  },
  bg: {
    position: 'fixed', inset: 0,
    background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(108,99,255,0.15) 0%, transparent 60%)',
    pointerEvents: 'none'
  },
  card: {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '2rem', width: '100%', maxWidth: '420px',
    position: 'relative', zIndex: 1,
    boxShadow: '0 0 80px rgba(108,99,255,0.08)'
  },
  logo: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' },
  logoIcon: { fontSize: '1.4rem' },
  logoText: { fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--text)' },
  title: { fontSize: '1.4rem', marginBottom: '0.25rem' },
  sub: { color: 'var(--text2)', fontSize: '0.875rem' },
  switch: { textAlign: 'center', marginTop: '1.25rem', color: 'var(--text2)', fontSize: '0.875rem' },
  switchBtn: { background: 'none', border: 'none', color: 'var(--accent2)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 },
  demo: { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius2)', padding: '0.75rem', marginTop: '1rem' },
  code: { fontSize: '0.75rem', color: 'var(--text2)', fontFamily: 'monospace' }
};
