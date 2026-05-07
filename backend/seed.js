// Run: node backend/seed.js
const bcrypt = require('bcryptjs');
const db = require('./db/init');

async function seed() {
  console.log('🌱 Seeding demo data...');

  // Create demo users
  const adminPass = await bcrypt.hash('demo123', 10);
  const memberPass = await bcrypt.hash('demo123', 10);

  let adminId, memberId, member2Id;

  try {
    const a = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Alice Admin', 'admin@demo.com', adminPass, 'admin');
    adminId = a.lastInsertRowid;
  } catch { adminId = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@demo.com').id; }

  try {
    const m = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Bob Member', 'member@demo.com', memberPass, 'member');
    memberId = m.lastInsertRowid;
  } catch { memberId = db.prepare('SELECT id FROM users WHERE email = ?').get('member@demo.com').id; }

  try {
    const m2 = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Carol Dev', 'carol@demo.com', memberPass, 'member');
    member2Id = m2.lastInsertRowid;
  } catch { member2Id = db.prepare('SELECT id FROM users WHERE email = ?').get('carol@demo.com').id; }

  // Create projects
  const p1 = db.prepare('INSERT OR IGNORE INTO projects (name, description, owner_id) VALUES (?, ?, ?)').run('Website Redesign', 'Redesign the company website with a modern look and feel', adminId);
  const p2 = db.prepare('INSERT OR IGNORE INTO projects (name, description, owner_id) VALUES (?, ?, ?)').run('Mobile App v2', 'Build the next version of the mobile application', adminId);
  const p1id = p1.lastInsertRowid || db.prepare('SELECT id FROM projects WHERE name = ?').get('Website Redesign').id;
  const p2id = p2.lastInsertRowid || db.prepare('SELECT id FROM projects WHERE name = ?').get('Mobile App v2').id;

  // Add members
  ['admin', 'member'].forEach(role => {
    const userId = role === 'admin' ? adminId : memberId;
    try { db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(p1id, userId, role); } catch {}
  });
  [adminId, memberId, member2Id].forEach((uid, i) => {
    try { db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(p2id, uid, i === 0 ? 'admin' : 'member'); } catch {}
  });

  // Create tasks
  const tasks = [
    { title: 'Design new homepage mockup', description: 'Create Figma designs for the homepage', project_id: p1id, assignee_id: memberId, creator_id: adminId, status: 'in_progress', priority: 'high', due_date: '2026-05-15' },
    { title: 'Write API documentation', description: 'Document all REST endpoints', project_id: p1id, assignee_id: adminId, creator_id: adminId, status: 'todo', priority: 'medium', due_date: '2026-05-20' },
    { title: 'Fix login bug on Safari', project_id: p1id, assignee_id: memberId, creator_id: adminId, status: 'done', priority: 'critical', due_date: '2026-04-30' },
    { title: 'Set up CI/CD pipeline', project_id: p2id, assignee_id: member2Id, creator_id: adminId, status: 'review', priority: 'high', due_date: '2026-05-10' },
    { title: 'Write unit tests for auth module', project_id: p2id, assignee_id: memberId, creator_id: adminId, status: 'todo', priority: 'medium', due_date: '2026-05-25' },
    { title: 'Design onboarding flow', project_id: p2id, assignee_id: member2Id, creator_id: adminId, status: 'in_progress', priority: 'high', due_date: '2026-05-01' },
  ];

  tasks.forEach(t => {
    try {
      db.prepare(`INSERT INTO tasks (title, description, project_id, assignee_id, creator_id, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(t.title, t.description || null, t.project_id, t.assignee_id, t.creator_id, t.status, t.priority, t.due_date);
    } catch {}
  });

  console.log('✅ Seeding complete!');
  console.log('\nDemo accounts:');
  console.log('  Admin:  admin@demo.com  / demo123');
  console.log('  Member: member@demo.com / demo123');
  console.log('  Member: carol@demo.com  / demo123');
}

seed().catch(console.error);
