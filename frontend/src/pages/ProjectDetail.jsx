import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

const STATUS = ['todo', 'in_progress', 'review', 'done'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const PRIORITY = ['low', 'medium', 'high', 'critical'];

export default function ProjectDetail() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const nav = useNavigate();
  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignee_id: '', status: 'todo', priority: 'medium', due_date: '' });
  const [memberForm, setMemberForm] = useState({ user_id: '', role: 'member' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('tasks');

  const load = () => {
    Promise.all([api.get(`/projects/${id}`, token), api.get('/users', token)])
      .then(([pd, ud]) => { setProject(pd.project); setUsers(ud.users); })
      .catch(() => nav('/projects'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id, token]);

  const setT = k => e => setTaskForm(f => ({ ...f, [k]: e.target.value }));
  const setM = k => e => setMemberForm(f => ({ ...f, [k]: e.target.value }));

  const isAdmin = user?.role === 'admin' || project?.owner_id === user?.id ||
    project?.members?.find(m => m.id === user?.id)?.project_role === 'admin';

  const submitTask = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await api.post('/tasks', { ...taskForm, project_id: parseInt(id), assignee_id: taskForm.assignee_id ? parseInt(taskForm.assignee_id) : null }, token);
      setShowTaskModal(false); setTaskForm({ title: '', description: '', assignee_id: '', status: 'todo', priority: 'medium', due_date: '' });
      load();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  const submitMember = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await api.post(`/projects/${id}/members`, memberForm, token);
      setShowMemberModal(false); setMemberForm({ user_id: '', role: 'member' }); load();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  const removeMember = async userId => {
    if (!confirm('Remove this member?')) return;
    await api.delete(`/projects/${id}/members/${userId}`, token);
    load();
  };

  const updateTaskStatus = async (taskId, status) => {
    await api.put(`/tasks/${taskId}`, { status }, token);
    load();
  };

  const deleteProject = async () => {
    if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    await api.delete(`/projects/${id}`, token);
    nav('/projects');
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}><span className="spinner" /></div>;
  if (!project) return null;

  const today = new Date().toISOString().split('T')[0];
  const tasksByStatus = STATUS.reduce((acc, s) => {
    acc[s] = project.tasks?.filter(t => t.status === s) || [];
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => nav('/projects')}>← Back</button>
            <h1>{project.name}</h1>
            <span className={`badge ${project.status === 'active' ? 'badge-in_progress' : 'badge-todo'}`}>{project.status}</span>
          </div>
          {project.description && <p className="page-title-sub">{project.description}</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isAdmin && <button className="btn btn-ghost btn-sm" onClick={() => setShowMemberModal(true)}>+ Member</button>}
          <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>+ Task</button>
          {isAdmin && <button className="btn btn-danger btn-sm" onClick={deleteProject}>Delete</button>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        {[['tasks', `Tasks (${project.tasks?.length || 0})`], ['board', 'Kanban Board'], ['members', `Members (${project.members?.length || 0})`]].map(([v, l]) => (
          <button key={v} onClick={() => setActiveTab(v)} style={{
            background: 'none', border: 'none', padding: '0.6rem 1rem', fontSize: '0.875rem', fontWeight: 500,
            color: activeTab === v ? 'var(--accent2)' : 'var(--text2)',
            borderBottom: activeTab === v ? '2px solid var(--accent)' : '2px solid transparent',
            cursor: 'pointer', marginBottom: '-1px'
          }}>{l}</button>
        ))}
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        project.tasks?.length === 0 ? (
          <div className="empty-state"><h3>No tasks yet</h3><p>Create a task to get started</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {project.tasks?.map(task => (
              <div key={task.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{task.title}</span>
                    {task.due_date && task.due_date < today && task.status !== 'done' && <span className="tag-overdue">OVERDUE</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    {task.assignee_name && <span style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>→ {task.assignee_name}</span>}
                    {task.due_date && <span style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>Due {task.due_date}</span>}
                  </div>
                </div>
                <select
                  value={task.status}
                  onChange={e => updateTaskStatus(task.id, e.target.value)}
                  style={{ width: 'auto', minWidth: '120px', fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}
                >
                  {STATUS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
            ))}
          </div>
        )
      )}

      {/* Kanban Board */}
      {activeTab === 'board' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', overflowX: 'auto' }}>
          {STATUS.map(status => (
            <div key={status} style={{ minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span className={`badge badge-${status}`}>{STATUS_LABELS[status]}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>{tasksByStatus[status].length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: '100px' }}>
                {tasksByStatus[status].map(task => (
                  <div key={task.id} className="card" style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>{task.title}</div>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                      <span className={`badge badge-${task.priority}`} style={{ fontSize: '0.65rem' }}>{task.priority}</span>
                    </div>
                    {task.assignee_name && <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: '0.4rem' }}>👤 {task.assignee_name}</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {project.members?.map(m => (
            <div key={m.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontWeight: 700, flexShrink: 0 }}>
                {m.name[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>{m.email}</div>
              </div>
              <span className={`badge badge-${m.project_role}`}>{m.project_role}</span>
              {isAdmin && m.id !== user.id && (
                <button className="btn btn-danger btn-sm" onClick={() => removeMember(m.id)}>Remove</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowTaskModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>New Task</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowTaskModal(false)}>✕</button>
            </div>
            <form onSubmit={submitTask}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input value={taskForm.title} onChange={setT('title')} placeholder="Task title" required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea value={taskForm.description} onChange={setT('description')} rows={2} placeholder="Optional details..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <select value={taskForm.assignee_id} onChange={setT('assignee_id')}>
                    <option value="">Unassigned</option>
                    {project.members?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select value={taskForm.priority} onChange={setT('priority')}>
                    {PRIORITY.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select value={taskForm.status} onChange={setT('status')}>
                    {STATUS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input type="date" value={taskForm.due_date} onChange={setT('due_date')} />
                </div>
              </div>
              {error && <p className="error-msg">{error}</p>}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowMemberModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Add Member</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowMemberModal(false)}>✕</button>
            </div>
            <form onSubmit={submitMember}>
              <div className="form-group">
                <label className="form-label">Select User *</label>
                <select value={memberForm.user_id} onChange={setM('user_id')} required>
                  <option value="">Choose a user...</option>
                  {users.filter(u => !project.members?.find(m => m.id === u.id)).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Project Role</label>
                <select value={memberForm.role} onChange={setM('role')}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {error && <p className="error-msg">{error}</p>}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
