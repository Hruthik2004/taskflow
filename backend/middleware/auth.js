const jwt = require('jsonwebtoken');
const db = require('../db/init');

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow_secret_key_change_in_prod';

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function requireProjectAccess(req, res, next) {
  const projectId = req.params.projectId || req.params.id || req.body.project_id;
  if (!projectId) return next();

  const membership = db.prepare(
    'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?'
  ).get(projectId, req.user.id);

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);

  if (!project) return res.status(404).json({ error: 'Project not found' });

  // Admin always has access, project owner always has access
  if (req.user.role === 'admin' || project.owner_id === req.user.id || membership) {
    req.project = project;
    req.membership = membership;
    return next();
  }
  return res.status(403).json({ error: 'Access denied to this project' });
}

function requireProjectAdmin(req, res, next) {
  const projectId = req.params.projectId || req.params.id;
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const membership = db.prepare(
    'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?'
  ).get(projectId, req.user.id);

  if (req.user.role === 'admin' || project.owner_id === req.user.id || membership?.role === 'admin') {
    req.project = project;
    return next();
  }
  return res.status(403).json({ error: 'Project admin access required' });
}

module.exports = { authenticate, requireAdmin, requireProjectAccess, requireProjectAdmin, JWT_SECRET };
