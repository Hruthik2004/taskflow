import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function UsersPage() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/users', token).then(d => setUsers(d.users)).finally(() => setLoading(false));
  };
  useEffect(load, [token]);

  const changeRole = async (id, role) => {
    if (!confirm(`Change this user's role to ${role}?`)) return;
    await api.put(`/users/${id}/role`, { role }, token);
    load();
  };

  const deleteUser = async (id, name) => {
    if (!confirm(`Delete ${name}? This will remove all their data.`)) return;
    try {
      await api.delete(`/users/${id}`, token);
      load();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}><span className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Team Members</h1>
          <p className="page-title-sub">{users.length} users registered</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {users.map(u => (
          <div key={u.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem 1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: u.role === 'admin' ? 'var(--accent3)' : 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
              {u.name[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>{u.name}</span>
                {u.id === user.id && <span style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>(you)</span>}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>{u.email}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: '0.1rem' }}>
                Joined {new Date(u.created_at).toLocaleDateString()}
              </div>
            </div>
            <span className={`badge badge-${u.role}`}>{u.role}</span>
            {u.id !== user.id && (
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => changeRole(u.id, u.role === 'admin' ? 'member' : 'admin')}
                >
                  Make {u.role === 'admin' ? 'Member' : 'Admin'}
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id, u.name)}>Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
