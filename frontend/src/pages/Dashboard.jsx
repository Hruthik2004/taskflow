import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };

export default function Dashboard() {
  const { token, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      api.get('/tasks', token),
      api.get('/projects', token)
    ]).then(([td, pd]) => {
      setTasks(td.tasks); setStats(td.stats);
      setProjects(pd.projects);
    }).finally(() => setLoading(false));
  }, [token]);

  const filtered = filter === 'all' ? tasks
    : filter === 'overdue' ? tasks.filter(t => t.is_overdue)
    : tasks.filter(t => t.status === filter);

  const statCards = [
    { label: 'Total Tasks', value: stats.total || 0, color: 'var(--accent)' },
    { label: 'In Progress', value: stats.in_progress || 0, color: 'var(--blue)' },
    { label: 'In Review', value: stats.review || 0, color: 'var(--yellow)' },
    { label: 'Overdue', value: stats.overdue || 0, color: 'var(--red)' },
    { label: 'Completed', value: stats.done || 0, color: 'var(--green)' },
  ];

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}><span className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-title-sub">Welcome back, {user?.name}</p>
        </div>
        <Link to="/projects" className="btn btn-primary">+ New Project</Link>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        {statCards.map(s => (
          <div key={s.label} className="card" style={{ ...styles.statCard, borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-head)', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ color: 'var(--text2)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {stats.total > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Overall Progress</span>
            <span style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>
              {Math.round((stats.done / stats.total) * 100)}% complete
            </span>
          </div>
          <div style={{ height: '8px', background: 'var(--bg3)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '99px',
              background: 'linear-gradient(90deg, var(--accent), var(--green))',
              width: `${(stats.done / stats.total) * 100}%`,
              transition: 'width 0.5s ease'
            }} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            {['todo', 'in_progress', 'review', 'done'].map(s => (
              <span key={s} style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>
                <span className={`badge badge-${s}`} style={{ marginRight: '0.3rem' }}>{STATUS_LABELS[s]}</span>
                {stats[s] || 0}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters + Task List */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: 2, minWidth: '300px' }}>
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {[['all', 'All'], ['todo', 'To Do'], ['in_progress', 'In Progress'], ['review', 'Review'], ['done', 'Done'], ['overdue', '🔴 Overdue']].map(([v, l]) => (
              <button
                key={v}
                className={`btn btn-sm ${filter === v ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilter(v)}
              >{l}</button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state"><h3>No tasks</h3><p>No tasks match this filter</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filtered.map(task => (
                <Link key={task.id} to={`/tasks/${task.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={styles.taskRow}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>{task.title}</span>
                        {task.is_overdue ? <span className="tag-overdue">OVERDUE</span> : null}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
                        <span className={`badge badge-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>{task.project_name}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {task.assignee_name && <div style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>👤 {task.assignee_name}</div>}
                      {task.due_date && <div style={{ fontSize: '0.75rem', color: task.is_overdue ? 'var(--red)' : 'var(--text3)' }}>Due {task.due_date}</div>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Projects sidebar */}
        <div style={{ flex: 1, minWidth: '220px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text2)' }}>PROJECTS</h3>
          {projects.slice(0, 8).map(p => (
            <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ ...styles.projectCard, marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: '0.2rem' }}>
                  {p.task_count} tasks · {p.member_count} members
                </div>
              </div>
            </Link>
          ))}
          {projects.length === 0 && <p style={{ color: 'var(--text3)', fontSize: '0.875rem' }}>No projects yet</p>}
        </div>
      </div>
    </div>
  );
}

const styles = {
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '0.75rem', marginBottom: '1.5rem'
  },
  statCard: { padding: '1rem', textAlign: 'center' },
  taskRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.9rem 1rem', cursor: 'pointer', transition: 'border-color 0.15s',
    ':hover': { borderColor: 'var(--accent)' }
  },
  projectCard: { padding: '0.75rem 1rem', cursor: 'pointer', transition: 'border-color 0.15s' }
};
