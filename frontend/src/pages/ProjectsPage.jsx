import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function ProjectsPage() {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    api.get('/projects', token).then(d => setProjects(d.projects)).finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.post('/projects', form, token);
      setShowModal(false); setForm({ name: '', description: '' }); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}><span className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p className="page-title-sub">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {projects.map(p => (
            <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{p.name}</h3>
                  <span className={`badge ${p.status === 'active' ? 'badge-in_progress' : 'badge-todo'}`}>{p.status}</span>
                </div>
                {p.description && <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>{p.description}</p>}
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text3)', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  <span>📋 {p.task_count} tasks</span>
                  <span>👥 {p.member_count} members</span>
                  <span style={{ marginLeft: 'auto' }}>{p.owner_name}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>New Project</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input value={form.name} onChange={set('name')} placeholder="e.g. Website Redesign" required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea value={form.description} onChange={set('description')} placeholder="What is this project about?" rows={3} />
              </div>
              {error && <p className="error-msg">{error}</p>}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' },
  card: { cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s', display: 'flex', flexDirection: 'column', height: '100%' }
};
