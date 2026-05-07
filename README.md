# ⚡ TaskFlow — Team Task Manager

A full-stack team task management app with role-based access control, project management, and real-time task tracking.

## 🚀 Live Demo
> **URL:** _[Add your Railway URL after deployment]_

**Demo Accounts:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | demo123 |
| Member | member@demo.com | demo123 |

---

## ✨ Features

### Authentication & Authorization
- JWT-based signup/login
- Role-based access: **Admin** and **Member**
- Protected routes on both frontend and backend

### Project Management
- Create, edit, archive, delete projects
- Project-level roles (project admin / member)
- Add/remove team members per project
- Task + member count per project

### Task Management
- Full CRUD for tasks
- Status tracking: `To Do → In Progress → Review → Done`
- Priority levels: Low, Medium, High, Critical
- Task assignment to team members
- Due date tracking with overdue detection
- Comments/discussion on tasks

### Dashboard
- Stats: Total, In Progress, Review, Overdue, Completed
- Progress bar showing completion rate
- Filterable task list (by status, priority, search)
- Recent projects sidebar

### Kanban Board
- Visual board per project with 4 columns
- Drag-and-drop ready layout (status update via dropdown)

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, React Router v6, Vite |
| **Backend** | Node.js, Express.js |
| **Database** | SQLite (via better-sqlite3) |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **Validation** | express-validator |
| **Deployment** | Railway |

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── db/init.js          # SQLite schema & connection
│   ├── middleware/auth.js  # JWT + RBAC middleware
│   ├── routes/
│   │   ├── auth.js         # /api/auth/*
│   │   ├── projects.js     # /api/projects/*
│   │   ├── tasks.js        # /api/tasks/*
│   │   └── users.js        # /api/users/*
│   ├── seed.js             # Demo data seeder
│   └── server.js           # Express entry point
├── frontend/
│   ├── src/
│   │   ├── pages/          # All page components
│   │   ├── components/     # Layout, shared components
│   │   ├── AuthContext.jsx # Auth state management
│   │   ├── api.js          # API client utility
│   │   ├── App.jsx         # Router setup
│   │   └── index.css       # Global styles
│   └── vite.config.js
├── package.json            # Root scripts
├── railway.toml            # Railway deployment config
└── README.md
```

---

## ⚙️ REST API Reference

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, get JWT |
| GET | `/api/auth/me` | Auth | Current user info |

### Projects
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/projects` | Auth | List accessible projects |
| POST | `/api/projects` | Auth | Create project |
| GET | `/api/projects/:id` | Member | Project details + tasks + members |
| PUT | `/api/projects/:id` | Project Admin | Update project |
| DELETE | `/api/projects/:id` | Project Admin | Delete project |
| POST | `/api/projects/:id/members` | Project Admin | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Project Admin | Remove member |

### Tasks
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/tasks` | Auth | All tasks (dashboard) with stats |
| POST | `/api/tasks` | Member | Create task |
| GET | `/api/tasks/:id` | Auth | Task details + comments |
| PUT | `/api/tasks/:id` | Auth | Update task |
| DELETE | `/api/tasks/:id` | Auth | Delete task |
| POST | `/api/tasks/:id/comments` | Auth | Add comment |

### Users (Admin only)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/users` | Auth | List all users |
| PUT | `/api/users/:id/role` | Admin | Change role |
| DELETE | `/api/users/:id` | Admin | Delete user |

---

## 🚢 Deployment (Railway)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git push -u origin main
```

### Step 2: Deploy to Railway
1. Go to [railway.app](https://railway.app) → New Project
2. Select **Deploy from GitHub repo** → choose `taskflow`
3. Railway auto-detects config from `railway.toml`
4. Add environment variables:
   ```
   JWT_SECRET=your_super_secret_key_here_make_it_long
   NODE_ENV=production
   PORT=3001
   ```
5. Click **Deploy** — Railway handles the build and start

### Step 3: Seed Demo Data
```bash
# In Railway dashboard → your service → Shell tab
node backend/seed.js
```

### Environment Variables
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | ✅ Yes | - | Secret key for JWT signing |
| `PORT` | No | 3001 | Server port |
| `NODE_ENV` | No | development | Environment |
| `DB_PATH` | No | ./taskflow.db | SQLite DB path |

---

## 💻 Local Development

```bash
# Clone and install
git clone https://github.com/YOUR_USERNAME/taskflow.git
cd taskflow
npm run install:all

# Seed demo data
node backend/seed.js

# Run backend (port 3001)
npm run dev:backend

# Run frontend (port 5173) — in a new terminal
npm run dev:frontend

# Open http://localhost:5173
```

---

## 🔐 Role-Based Access Control

### Global Roles
| Feature | Admin | Member |
|---------|-------|--------|
| View all projects | ✅ | ❌ (own only) |
| Manage all users | ✅ | ❌ |
| Change user roles | ✅ | ❌ |
| Delete any project | ✅ | ❌ |

### Project Roles
| Feature | Project Admin | Member |
|---------|--------------|--------|
| Add/remove members | ✅ | ❌ |
| Edit project details | ✅ | ❌ |
| Delete project | ✅ | ❌ |
| Create/edit tasks | ✅ | ✅ |
| View project | ✅ | ✅ |


---

## 📝 License
MIT — Built for assessment submission.
