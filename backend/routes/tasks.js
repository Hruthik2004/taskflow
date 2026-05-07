const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const db = require('../db/init');
const { authenticate, requireProjectAccess } = require('../middleware/auth');

router.use(authenticate);

// GET /api/tasks - dashboard: all tasks for user
router.get('/', (req, res) => {
  let tasks;
  const today = new Date().toISOString().split('T')[0];

  if (req.user.role === 'admin') {
    tasks = db.prepare(`
      SELECT t.*, u.name as assignee_name, c.name as creator_name, p.name as project_name,
        CASE WHEN t.due_date < ? AND t.status != 'done' THEN 1 ELSE 0 END as is_overdue
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      JOIN users c ON t.creator_id = c.id
      JOIN projects p ON t.project_id = p.id
      ORDER BY t.due_date ASC
    `).all(today);
  } else {
    tasks = db.prepare(`
      SELECT t.*, u.name as assignee_name, c.name as creator_name, p.name as project_name,
        CASE WHEN t.due_date < ? AND t.status != 'done' THEN 1 ELSE 0 END as is_overdue
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      JOIN users c ON t.creator_id = c.id
      JOIN projects p ON t.project_id = p.id
      WHERE t.assignee_id = ? OR t.creator_id = ?
        OR t.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)
      ORDER BY t.due_date ASC
    `).all(today, req.user.id, req.user.id, req.user.id);
  }

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => t.is_overdue).length,
  };

  res.json({ tasks, stats });
});

// POST /api/tasks
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('project_id').isInt().withMessage('project_id required'),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('due_date').optional().isDate()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, project_id, assignee_id, status, priority, due_date } = req.body;

  // Verify user has access to project
  const access = db.prepare(
    'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?'
  ).get(project_id, req.user.id);
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id);

  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (req.user.role !== 'admin' && project.owner_id !== req.user.id && !access) {
    return res.status(403).json({ error: 'No access to this project' });
  }

  const result = db.prepare(`
    INSERT INTO tasks (title, description, project_id, assignee_id, creator_id, status, priority, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title, description || null, project_id,
    assignee_id || null, req.user.id,
    status || 'todo', priority || 'medium', due_date || null
  );

  const task = db.prepare(`
    SELECT t.*, u.name as assignee_name, c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    JOIN users c ON t.creator_id = c.id
    WHERE t.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ task });
});

// GET /api/tasks/:id
router.get('/:id', (req, res) => {
  const task = db.prepare(`
    SELECT t.*, u.name as assignee_name, c.name as creator_name, p.name as project_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    JOIN users c ON t.creator_id = c.id
    JOIN projects p ON t.project_id = p.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!task) return res.status(404).json({ error: 'Task not found' });

  const comments = db.prepare(`
    SELECT cm.*, u.name as user_name FROM comments cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.task_id = ? ORDER BY cm.created_at ASC
  `).all(req.params.id);

  res.json({ task: { ...task, comments } });
});

// PUT /api/tasks/:id
router.put('/:id', [
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const { title, description, assignee_id, status, priority, due_date } = req.body;

  db.prepare(`
    UPDATE tasks SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      assignee_id = CASE WHEN ? IS NOT NULL THEN ? ELSE assignee_id END,
      status = COALESCE(?, status),
      priority = COALESCE(?, priority),
      due_date = COALESCE(?, due_date),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title || null, description || null,
    assignee_id !== undefined ? 1 : null, assignee_id || null,
    status || null, priority || null, due_date || null,
    req.params.id
  );

  const updated = db.prepare(`
    SELECT t.*, u.name as assignee_name, c.name as creator_name
    FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id
    JOIN users c ON t.creator_id = c.id WHERE t.id = ?
  `).get(req.params.id);

  res.json({ task: updated });
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Task deleted' });
});

// POST /api/tasks/:id/comments
router.post('/:id/comments', [
  body('content').trim().notEmpty().withMessage('Comment cannot be empty')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const result = db.prepare(
    'INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)'
  ).run(req.params.id, req.user.id, req.body.content);

  const comment = db.prepare(`
    SELECT cm.*, u.name as user_name FROM comments cm
    JOIN users u ON cm.user_id = u.id WHERE cm.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ comment });
});

module.exports = router;
