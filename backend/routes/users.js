const router = require('express').Router();
const db = require('../db/init');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);

// GET /api/users - list all users (for assigning tasks/members)
router.get('/', (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY name').all();
  res.json({ users });
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// PUT /api/users/:id/role - admin only
router.put('/:id/role', requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!['admin', 'member'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  res.json({ message: 'Role updated' });
});

// DELETE /api/users/:id - admin only
router.delete('/:id', requireAdmin, (req, res) => {
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: 'User deleted' });
});

module.exports = router;
