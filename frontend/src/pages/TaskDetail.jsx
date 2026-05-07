import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };

export default function TaskDetail() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const nav = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [users, setUsers] = useState([]);

  const load = () => {
    Promise.all([api.get(`/tasks/${id}`, token), api.get('/users', token)])
      .then(([td, ud]) => { setTask(td.task); setUsers(ud.users); })
      .catch(() => nav('/tasks'))
      .finally(() => setLoading(false));
  };
  useEffect(load, [id, token]);

  const postComment = async e => {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await api.post(`/tasks/${id}/comments`, { content: comment }, token);
      setComment(''); load();
    } finally { setPosting(false); }
  };

  const updateTask = async e => {
    e.preventDefault();
    await api.put(`/tasks/${id}`, editForm, token);
    setEditing(false); load();
  };

  const deleteTask = async () => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${id}`, token);
    nav('/tasks');
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}><span className="spinner" /></div>;
  if (!task) return null;

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.due_date && task.due_date < today && task.status !== 'done';

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => nav(-1)}>← Back</button>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        {editing ? (
          <form onSubmit={updateTask}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input defaultValue={task.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea defaultValue={task.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select defaultValue={task.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select defaultValue={task.priority} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}>
                  {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select defaultValue={task.assignee_id || ''} onChange={e => setEditForm(f => ({ ...f, assignee_id: e.target.value || null }))}>
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" defaultValue={task.due_date || ''} onChange={e => setEditForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">Save Changes</button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '0.4rem' }}>{task.title}</h2>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  {isOverdue && <span className="tag-overdue">OVERDUE</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(true); setEditForm({}); }}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={deleteTask}>Delete</button>
              </div>
            </div>

            {task.description && <p style={{ color: 'var(--text2)', lineHeight: 1.6, marginBottom: '1rem' }}>{task.description}</p>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
              {[
                ['Project', task.project_name],
                ['Assigned to', task.assignee_name || 'Unassigned'],
                ['Created by', task.creator_name],
                ['Due Date', task.due_date || 'No due date'],
              ].map(([l, v]) => (
                <div key={l} style={{ background: 'var(--bg3)', borderRadius: 'var(--radius2)', padding: '0.6rem 0.75rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>{l}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text)' }}>{v}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Comments */}
      <div className="card">
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>Comments ({task.comments?.length || 0})</h3>

        {task.comments?.length === 0 ? (
          <p style={{ color: 'var(--text3)', fontSize: '0.875rem', marginBottom: '1rem' }}>No comments yet. Start the conversation.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
            {task.comments?.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--accent3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                  {c.user_name[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, background: 'var(--bg3)', borderRadius: 'var(--radius2)', padding: '0.6rem 0.85rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.user_name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text2)', lineHeight: 1.5 }}>{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={postComment} style={{ display: 'flex', gap: '0.5rem' }}>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Add a comment..."
            rows={2}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={posting || !comment.trim()} style={{ alignSelf: 'flex-end' }}>
            {posting ? <span className="spinner" /> : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
}
