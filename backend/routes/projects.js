const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const db = require('../db/init');
const { authenticate, requireProjectAccess, requireProjectAdmin } = require('../middleware/auth');

router.use(authenticate);

// GET /api/projects - list projects for current user
router.get('/', (req, res) => {
  let projects;
  if (req.user.role === 'admin') {
    projects = db.prepare(`
      SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
    `).all();
  } else {
    projects = db.prepare(`
      SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.owner_id = ? OR p.id IN (
        SELECT project_id FROM project_members WHERE user_id = ?
      )
      ORDER BY p.created_at DESC
    `).all(req.user.id, req.user.id);
  }
  res.json({ projects });
});

// POST /api/projects
router.post('/', [
  body('name').trim().notEmpty().withMessage('Project name required'),
  body('description').optional().trim()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description } = req.body;
  const result = db.prepare(
    'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)'
  ).run(name, description || null, req.user.id);

  // Auto-add creator as admin member
  db.prepare(
    'INSERT OR IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
  ).run(result.lastInsertRowid, req.user.id, 'admin');

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ project });
});

// GET /api/projects/:id
router.get('/:id', requireProjectAccess, (req, res) => {
  const project = db.prepare(`
    SELECT p.*, u.name as owner_name FROM projects p
    JOIN users u ON p.owner_id = u.id WHERE p.id = ?
  `).get(req.params.id);

  const members = db.prepare(`
    SELECT u.id, u.name, u.email, u.role as global_role, pm.role as project_role, pm.joined_at
    FROM project_members pm JOIN users u ON pm.user_id = u.id
    WHERE pm.project_id = ?
  `).all(req.params.id);

  const tasks = db.prepare(`
    SELECT t.*, u.name as assignee_name, c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    JOIN users c ON t.creator_id = c.id
    WHERE t.project_id = ?
    ORDER BY t.created_at DESC
  `).all(req.params.id);

  res.json({ project: { ...project, members, tasks } });
});

// PUT /api/projects/:id
router.put('/:id', requireProjectAdmin, [
  body('name').optional().trim().notEmpty(),
  body('status').optional().isIn(['active', 'archived'])
], (req, res) => {
  const { name, description, status } = req.body;
  const project = req.project;

  db.prepare(`
    UPDATE projects SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      status = COALESCE(?, status)
    WHERE id = ?
  `).run(name || null, description ?? null, status || null, project.id);

  res.json({ project: db.prepare('SELECT * FROM projects WHERE id = ?').get(project.id) });
});

// DELETE /api/projects/:id
router.delete('/:id', requireProjectAdmin, (req, res) => {
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ message: 'Project deleted' });
});

// POST /api/projects/:projectId/members - add member
router.post('/:projectId/members', requireProjectAdmin, [
  body('user_id').isInt().withMessage('Valid user_id required'),
  body('role').optional().isIn(['admin', 'member'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { user_id, role = 'member' } = req.body;
  const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(user_id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  try {
    db.prepare(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
    ).run(req.params.projectId, user_id, role);
    res.status(201).json({ message: 'Member added', user });
  } catch (e) {
    res.status(409).json({ error: 'User already a member' });
  }
});

// DELETE /api/projects/:projectId/members/:userId
router.delete('/:projectId/members/:userId', requireProjectAdmin, (req, res) => {
  db.prepare(
    'DELETE FROM project_members WHERE project_id = ? AND user_id = ?'
  ).run(req.params.projectId, req.params.userId);
  res.json({ message: 'Member removed' });
});

module.exports = router;
