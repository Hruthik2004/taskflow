import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const PRIORITY_COLORS = { low: 'var(--text3)', medium: 'var(--blue)', high: 'var(--orange)', critical: 'var(--red)' };

export default function TasksPage() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', priority: '', search: '' });

  const load = () => {
    api.get('/tasks', token).then(d => { setTasks(d.tasks); setStats(d.stats); }).finally(() => setLoading(false));
  };
  useEffect(load, [token]);

  const updateStatus = async (id, status) => {
    await api.put(`/tasks/${id}`, { status }, token);
    load();
  };

  const deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${id}`, token);
    load();
  };

  const filtered = tasks.filter(t => {
    if (filter.status && t.status !== filter.status) return false;
    if (filter.priority && t.priority !== filter.priority) return false;
    if (filter.search && !t.title.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const today = new Date().toISOString().split('T')[0];

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}><span className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>All Tasks</h1>
          <p className="page-title-sub">{tasks.length} total tasks</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', padding: '0.85rem 1rem' }}>
        <input
          placeholder="🔍 Search tasks..."
          value={filter.search}
          onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
          style={{ flex: 1, minWidth: '180px', maxWidth: '280px' }}
        />
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} style={{ width: 'auto' }}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filter.priority} onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))} style={{ width: 'auto' }}>
          <option value="">All Priorities</option>
          {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        {(filter.status || filter.priority || filter.search) &&
          <button className="btn btn-ghost btn-sm" onClick={() => setFilter({ status: '', priority: '', search: '' })}>Clear</button>}
        <span style={{ marginLeft: 'auto', color: 'var(--text2)', fontSize: '0.82rem' }}>{filtered.length} results</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><h3>No tasks found</h3><p>Try adjusting your filters</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(task => (
            <div key={task.id} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.9rem 1rem' }}>
              {/* Priority indicator */}
              <div style={{ width: '4px', height: '40px', borderRadius: '2px', background: PRIORITY_COLORS[task.priority], flexShrink: 0 }} />

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                  <Link to={`/tasks/${task.id}`} style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', textDecoration: 'none' }}>
                    {task.title}
                  </Link>
                  {task.is_overdue ? <span className="tag-overdue">OVERDUE</span> : null}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text3)' }}>
                  <span>📁 {task.project_name}</span>
                  {task.assignee_name && <span>👤 {task.assignee_name}</span>}
                  {task.due_date && <span style={{ color: task.is_overdue ? 'var(--red)' : 'var(--text3)' }}>📅 {task.due_date}</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                <select
                  value={task.status}
                  onChange={e => updateStatus(task.id, e.target.value)}
                  style={{ width: 'auto', fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}
                >
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <button className="btn btn-danger btn-sm" onClick={() => deleteTask(task.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
