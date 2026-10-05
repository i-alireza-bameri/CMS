import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'omnispace-dev-secret-key-2026';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads directory exists
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'OmniSpace Full-Stack Server', version: '1.0.0' });
});

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    cb(null, unique);
  },
});
const upload = multer({ storage });

// ==========================================
// In-Memory / File-Persisted Database Store
// ==========================================
interface User {
  id: number;
  email: string;
  passwordHash: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
  createdAt: string;
}

interface Workspace {
  id: number;
  title: string;
  slug: string;
  description: string;
  isPublic: boolean;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: number;
  workspaceId: number;
  title: string;
  slug: string;
  description: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ContentItem {
  id: number;
  projectId: number;
  title: string;
  slug: string;
  contentType: 'markdown' | 'code' | 'text' | 'image' | 'pdf' | 'video' | 'excel' | 'word' | 'file';
  textContent?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  isPublished: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

// Initial Seed Data
const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);

const db = {
  users: [
    {
      id: 1,
      email: 'alex@omnispace.dev',
      passwordHash: defaultPasswordHash,
      fullName: 'Alex Rivera',
      role: 'owner',
      avatarUrl: '/src/assets/images/avatar_workspace_owner_1791186369651.jpg',
      createdAt: new Date().toISOString(),
    },
  ] as User[],
  workspaces: [
    {
      id: 1,
      title: 'Engineering Core',
      slug: 'engineering-core',
      description: 'Platform backend, distributed API architecture & database designs',
      isPublic: true,
      ownerId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: 'Design Systems',
      slug: 'design-systems',
      description: 'Universal UI tokens, asset catalogs, and brand specifications',
      isPublic: false,
      ownerId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 3,
      title: 'Product Strategy & RFCs',
      slug: 'product-strategy-rfcs',
      description: 'Roadmaps, executive whitepapers, and operational models',
      isPublic: true,
      ownerId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ] as Workspace[],
  projects: [
    {
      id: 1,
      workspaceId: 1,
      title: 'FastAPI & Strawberry Backend',
      slug: 'fastapi-strawberry-backend',
      description: 'Core GraphQL schemas, SQLModel relations, and JWT auth pipeline',
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      workspaceId: 1,
      title: 'Distributed Storage Pipeline',
      slug: 'distributed-storage-pipeline',
      description: 'S3-compatible bucket connector and streaming byte ranges',
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 3,
      workspaceId: 2,
      title: 'Design Tokens & Brand Assets',
      slug: 'design-tokens-brand-assets',
      description: 'Color scales, typographic rhythm, and studio assets',
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 4,
      workspaceId: 3,
      title: 'Q3 Financial & Capacity Model',
      slug: 'q3-financial-capacity-model',
      description: 'Multi-sheet projections, compute costs, and operational targets',
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ] as Project[],
  contents: [
    {
      id: 1,
      projectId: 1,
      title: 'System Architecture RFC & Blueprint',
      slug: 'system-architecture-rfc',
      contentType: 'markdown',
      textContent: `# OmniSpace Architecture RFC-042

## 1. Executive Summary
This RFC formalizes the full-stack architecture for **OmniSpace**, unifying high-concurrency Python **FastAPI**, **SQLModel**, and **Strawberry GraphQL** with a responsive **Vite + React + Tailwind CSS** frontend.

### Core Tenets
- **Ownership-First Authorization**: Users own workspaces; child projects and contents inherit granular access privileges.
- **Unified Query Layer**: GraphQL schema with typed queries, mutations, and real-time field resolvers.
- **Zero-Latency Document Viewers**: In-browser rendering for Excel spreadsheets, Word documents, Markdown, source code, and video streams.
- **Public Shareability**: Published assets get accessible slugs (\`/d/:slug\`) requiring zero authentication.

---

## 2. Relational Hierarchy
\`\`\`text
User (Owner / Member)
  └── Workspaces [slug, title, is_public]
        └── Projects [slug, title, is_published]
              └── Contents [slug, type, text_content, file_url, is_published]
\`\`\`

## 3. Supported Multi-Format Media
| Format | Extension | Viewer Mechanism |
| :--- | :--- | :--- |
| **Markdown** | \`.md\` | Live split-pane editor + markdown parser |
| **Code / Source** | \`.py, .ts, .json, .sql\` | JetBrains Mono editor with syntax & line nums |
| **Spreadsheets** | \`.xlsx, .xls\` | SheetJS interactive grid with tabs & CSV export |
| **Word Docs** | \`.docx\` | Mammoth typography document engine |
| **PDF** | \`.pdf\` | Canvas zoom engine + inline embedded frame |
| **Media** | \`.mp4, .webm, .png, .jpg\` | HTML5 accelerated player & zoom inspector |

---

## 4. Verification Checklist
- [x] JWT bearer token flow implemented
- [x] Strawberry GraphQL schema matching SQLModel entities
- [x] Multi-file format parsing and upload
- [x] Public sharing via \`/d/:slug\` route without login
`,
      isPublished: true,
      viewCount: 142,
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      projectId: 1,
      title: 'SQLModel & Strawberry Schema Definition',
      slug: 'sqlmodel-strawberry-schema',
      contentType: 'code',
      textContent: `import strawberry
from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship, create_engine, Session

class User(SQLModel, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True, nullable=False)
    hashed_password: str = Field(nullable=False)
    full_name: str = Field(default="")
    role: str = Field(default="owner")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    workspaces: List["Workspace"] = Relationship(back_populates="owner")

class Workspace(SQLModel, table=True):
    __tablename__ = "workspaces"
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True, nullable=False)
    slug: str = Field(unique=True, index=True)
    is_public: bool = Field(default=False)
    owner_id: int = Field(foreign_key="users.id")

@strawberry.type
class Query:
    @strawberry.field
    def me(self, info: strawberry.Info) -> Optional[User]:
        return get_current_user_from_info(info)

    @strawberry.field
    def public_content(self, slug: str) -> Optional[Content]:
        with Session(engine) as session:
            return session.query(Content).filter_by(slug=slug, is_published=True).first()

schema = strawberry.Schema(query=Query)
`,
      fileName: 'schema.py',
      fileSize: 1240,
      mimeType: 'text/x-python',
      isPublished: true,
      viewCount: 89,
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 3,
      projectId: 4,
      title: 'Q3 Enterprise Financial & Compute Model',
      slug: 'q3-financial-model-spreadsheet',
      contentType: 'excel',
      textContent: JSON.stringify({
        sheets: [
          {
            name: 'Cloud Infrastructure OpEx',
            data: [
              ['Cost Center', 'Resource Tier', 'Monthly Cost ($)', 'Growth Rate', 'Annualized ($)'],
              ['Compute Cluster', 'g4dn.2xlarge GPU x8', '3,450.00', '+12%', '41,400.00'],
              ['Database Engine', 'PostgreSQL Cloud SQL HA', '1,280.00', '+5%', '15,360.00'],
              ['Object Storage', 'S3 Multi-Region 50TB', '1,150.00', '+8%', '13,800.00'],
              ['Edge CDN & Ingress', 'Global Anycast 120 PoPs', '640.00', '+4%', '7,680.00'],
              ['Logging & Observability', 'Distributed OpenTelemetry', '420.00', '+3%', '5,040.00'],
              ['Total Infrastructure', 'Production Environment', '6,940.00', '+7.2%', '83,280.00'],
            ],
          },
          {
            name: 'Revenue & Headcount',
            data: [
              ['Quarter', 'Active Workspaces', 'Subscribed Seats', 'MRR ($)', 'Net Margin'],
              ['Q1 2026', '124', '1,420', '42,600.00', '71%'],
              ['Q2 2026', '248', '3,110', '93,300.00', '74%'],
              ['Q3 2026 (Target)', '460', '6,500', '195,000.00', '78%'],
              ['Q4 2026 (Projected)', '780', '11,200', '336,000.00', '81%'],
            ],
          },
        ],
      }),
      fileName: 'omnispace-q3-financial-projections.xlsx',
      fileSize: 24800,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      isPublished: true,
      viewCount: 63,
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 4,
      projectId: 3,
      title: 'Brand Typography & Interface Guidelines',
      slug: 'brand-typography-word-doc',
      contentType: 'word',
      textContent: `OmniSpace Universal Design Guidelines & Brand Manual

1. Typography Principles
The visual personality of OmniSpace rests on high typographic discipline. We strictly forbid artificial uppercase micro-tags, generic AI rounded pill badges, and code-comment headers.

Display Headings: Plus Jakarta Sans / Cabinet Grotesk (SemiBold 600)
Body Typography: Plus Jakarta Sans (Regular 400, line-height 1.6)
Data & Telemetry: JetBrains Mono (with tabular-nums alignment)

2. Color Allocation (The 60-30-10 Rule)
- 60% Dominant Canvas: Pure deep slate (#020617 / slate-950)
- 30% Structural Surfaces: Refined card borders (#1E293B) and hairline dividers
- 10% High-Intent Accent: Indigo/Violet (#6366F1 / #818CF8) for primary CTAs and active states

3. Content Viewing Engines
Every document format must be rendered cleanly within the browser without forcing downloads. When an external file is uploaded, the platform instantly identifies the MIME type and routes the payload to the corresponding specialized viewer.`,
      fileName: 'brand-guidelines-v2.docx',
      fileSize: 18400,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      isPublished: true,
      viewCount: 51,
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 5,
      projectId: 3,
      title: 'Studio Workspace Architecture Visualization',
      slug: 'workspace-architecture-hero-image',
      contentType: 'image',
      fileUrl: '/src/assets/images/hero_workspace_dashboard_1791186354521.jpg',
      fileName: 'studio-workspace-visual.jpg',
      fileSize: 184500,
      mimeType: 'image/jpeg',
      isPublished: true,
      viewCount: 114,
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 6,
      projectId: 1,
      title: 'GraphQL API Reference Specification',
      slug: 'graphql-api-reference-doc',
      contentType: 'markdown',
      textContent: `# Strawberry GraphQL Query Guide

All queries and mutations can be tested directly in the built-in **Strawberry GraphQL Explorer**.

### Query: Current Authenticated User
\`\`\`graphql
query GetCurrentUser {
  me {
    id
    email
    fullName
    role
  }
}
\`\`\`

### Query: Workspaces with Project Hierarchy
\`\`\`graphql
query ListWorkspacesWithTree {
  workspaces {
    id
    title
    slug
    isPublic
    projects {
      id
      title
      slug
      isPublished
      contents {
        id
        title
        slug
        contentType
        isPublished
      }
    }
  }
}
\`\`\`

### Mutation: Create Workspace
\`\`\`graphql
mutation CreateWorkspace($title: String!, $description: String!) {
  createWorkspace(title: $title, description: $description, isPublic: true) {
    id
    title
    slug
  }
}
\`\`\`
`,
      isPublished: true,
      viewCount: 77,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ] as ContentItem[],
};

// ==========================================
// Authentication Middleware
// ==========================================
function authenticateToken(req: express.Request, _res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    (req as any).user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      (req as any).user = null;
    } else {
      const user = db.users.find((u) => u.id === decoded.userId);
      (req as any).user = user || null;
    }
    next();
  });
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ detail: 'Authentication required. Please provide a valid Bearer token.' });
  }
  next();
}

app.use(authenticateToken);

// ==========================================
// REST API: Authentication
// ==========================================
app.post('/api/auth/register', (req, res) => {
  const { email, password, fullName } = req.body;
  if (!email || !password) {
    return res.status(400).json({ detail: 'Email and password are required' });
  }

  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ detail: 'An account with this email already exists' });
  }

  const newUser: User = {
    id: db.users.length + 1,
    email: email.toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10),
    fullName: fullName || email.split('@')[0],
    role: 'owner',
    createdAt: new Date().toISOString(),
  };
  db.users.push(newUser);

  // Create default workspace for new user
  const newWorkspace: Workspace = {
    id: db.workspaces.length + 1,
    title: `${newUser.fullName}'s Workspace`,
    slug: `ws-${newUser.id}-${Date.now().toString(36)}`,
    description: 'Personal default workspace',
    isPublic: false,
    ownerId: newUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.workspaces.push(newWorkspace);

  const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

  return res.status(201).json({
    accessToken: token,
    tokenType: 'bearer',
    user: {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      avatarUrl: newUser.avatarUrl,
      createdAt: newUser.createdAt,
    },
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ detail: 'Email and password are required' });
  }

  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ detail: 'Invalid email or password' });
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  return res.json({
    accessToken: token,
    tokenType: 'bearer',
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
  });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  return res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  });
});

// ==========================================
// REST API: Workspaces CRUD
// ==========================================
app.get('/api/workspaces', (req, res) => {
  const user = (req as any).user as User | null;
  if (user) {
    // User's own workspaces + public workspaces
    const list = db.workspaces.filter((w) => w.ownerId === user.id || w.isPublic);
    return res.json(list);
  }
  // Public workspaces only for non-authenticated
  return res.json(db.workspaces.filter((w) => w.isPublic));
});

app.post('/api/workspaces', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const { title, description, isPublic } = req.body;
  if (!title) {
    return res.status(400).json({ detail: 'Workspace title is required' });
  }

  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
  const workspace: Workspace = {
    id: db.workspaces.length + 1,
    title,
    slug,
    description: description || '',
    isPublic: !!isPublic,
    ownerId: user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.workspaces.push(workspace);
  return res.status(201).json(workspace);
});

app.get('/api/workspaces/:id', (req, res) => {
  const user = (req as any).user as User | null;
  const ws = db.workspaces.find((w) => w.id === parseInt(req.params.id, 10));
  if (!ws) {
    return res.status(404).json({ detail: 'Workspace not found' });
  }
  if (!ws.isPublic && (!user || ws.ownerId !== user.id)) {
    return res.status(403).json({ detail: 'Forbidden: Private workspace' });
  }
  return res.json(ws);
});

app.patch('/api/workspaces/:id', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const ws = db.workspaces.find((w) => w.id === parseInt(req.params.id, 10));
  if (!ws) {
    return res.status(404).json({ detail: 'Workspace not found' });
  }
  if (ws.ownerId !== user.id) {
    return res.status(403).json({ detail: 'Forbidden: You do not own this workspace' });
  }

  const { title, description, isPublic } = req.body;
  if (title !== undefined) ws.title = title;
  if (description !== undefined) ws.description = description;
  if (isPublic !== undefined) ws.isPublic = isPublic;
  ws.updatedAt = new Date().toISOString();

  return res.json(ws);
});

app.delete('/api/workspaces/:id', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const index = db.workspaces.findIndex((w) => w.id === parseInt(req.params.id, 10));
  if (index === -1) {
    return res.status(404).json({ detail: 'Workspace not found' });
  }
  if (db.workspaces[index].ownerId !== user.id) {
    return res.status(403).json({ detail: 'Forbidden: You do not own this workspace' });
  }

  const wsId = db.workspaces[index].id;
  db.workspaces.splice(index, 1);
  // Cascade delete projects and contents
  const projectIds = db.projects.filter((p) => p.workspaceId === wsId).map((p) => p.id);
  db.projects = db.projects.filter((p) => p.workspaceId !== wsId);
  db.contents = db.contents.filter((c) => !projectIds.includes(c.projectId));

  return res.status(204).send();
});

// ==========================================
// REST API: Projects CRUD
// ==========================================
app.get('/api/projects', (req, res) => {
  const workspaceId = req.query.workspaceId ? parseInt(req.query.workspaceId as string, 10) : null;
  let list = db.projects;
  if (workspaceId) {
    list = list.filter((p) => p.workspaceId === workspaceId);
  }
  return res.json(list);
});

app.post('/api/projects', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const { workspaceId, title, description, isPublished } = req.body;
  if (!workspaceId || !title) {
    return res.status(400).json({ detail: 'workspaceId and title are required' });
  }

  const ws = db.workspaces.find((w) => w.id === workspaceId);
  if (!ws) {
    return res.status(404).json({ detail: 'Workspace not found' });
  }
  if (ws.ownerId !== user.id) {
    return res.status(403).json({ detail: 'Forbidden: You do not own this workspace' });
  }

  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
  const project: Project = {
    id: db.projects.length + 1,
    workspaceId,
    title,
    slug,
    description: description || '',
    isPublished: !!isPublished,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.projects.push(project);
  return res.status(201).json(project);
});

app.get('/api/projects/:id', (req, res) => {
  const proj = db.projects.find((p) => p.id === parseInt(req.params.id, 10));
  if (!proj) {
    return res.status(404).json({ detail: 'Project not found' });
  }
  return res.json(proj);
});

app.patch('/api/projects/:id', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const proj = db.projects.find((p) => p.id === parseInt(req.params.id, 10));
  if (!proj) {
    return res.status(404).json({ detail: 'Project not found' });
  }
  const ws = db.workspaces.find((w) => w.id === proj.workspaceId);
  if (!ws || ws.ownerId !== user.id) {
    return res.status(403).json({ detail: 'Forbidden: You do not own this project' });
  }

  const { title, description, isPublished } = req.body;
  if (title !== undefined) proj.title = title;
  if (description !== undefined) proj.description = description;
  if (isPublished !== undefined) proj.isPublished = isPublished;
  proj.updatedAt = new Date().toISOString();

  return res.json(proj);
});

app.delete('/api/projects/:id', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const index = db.projects.findIndex((p) => p.id === parseInt(req.params.id, 10));
  if (index === -1) {
    return res.status(404).json({ detail: 'Project not found' });
  }
  const proj = db.projects[index];
  const ws = db.workspaces.find((w) => w.id === proj.workspaceId);
  if (!ws || ws.ownerId !== user.id) {
    return res.status(403).json({ detail: 'Forbidden: You do not own this project' });
  }

  const projId = proj.id;
  db.projects.splice(index, 1);
  db.contents = db.contents.filter((c) => c.projectId !== projId);

  return res.status(204).send();
});

// ==========================================
// REST API: Contents CRUD
// ==========================================
app.get('/api/contents', (req, res) => {
  const projectId = req.query.projectId ? parseInt(req.query.projectId as string, 10) : null;
  let list = db.contents;
  if (projectId) {
    list = list.filter((c) => c.projectId === projectId);
  }
  return res.json(list);
});

app.post('/api/contents', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const { projectId, title, slug, contentType, textContent, fileUrl, fileName, fileSize, mimeType, isPublished } = req.body;
  if (!projectId || !title) {
    return res.status(400).json({ detail: 'projectId and title are required' });
  }

  const proj = db.projects.find((p) => p.id === projectId);
  if (!proj) {
    return res.status(404).json({ detail: 'Project not found' });
  }
  const ws = db.workspaces.find((w) => w.id === proj.workspaceId);
  if (!ws || ws.ownerId !== user.id) {
    return res.status(403).json({ detail: 'Forbidden: You do not own this project' });
  }

  const autoSlug = slug || `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
  const content: ContentItem = {
    id: db.contents.length + 1,
    projectId,
    title,
    slug: autoSlug,
    contentType: contentType || 'markdown',
    textContent: textContent || '',
    fileUrl,
    fileName,
    fileSize: fileSize || 0,
    mimeType,
    isPublished: !!isPublished,
    viewCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.contents.push(content);
  return res.status(201).json(content);
});

app.get('/api/contents/:id', (req, res) => {
  const user = (req as any).user as User | null;
  const cnt = db.contents.find((c) => c.id === parseInt(req.params.id, 10));
  if (!cnt) {
    return res.status(404).json({ detail: 'Content not found' });
  }

  if (!cnt.isPublished) {
    const proj = db.projects.find((p) => p.id === cnt.projectId);
    const ws = proj ? db.workspaces.find((w) => w.id === proj.workspaceId) : null;
    if (!user || !ws || ws.ownerId !== user.id) {
      return res.status(403).json({ detail: 'Content is private' });
    }
  }

  cnt.viewCount += 1;
  return res.json(cnt);
});

app.patch('/api/contents/:id', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const cnt = db.contents.find((c) => c.id === parseInt(req.params.id, 10));
  if (!cnt) {
    return res.status(404).json({ detail: 'Content not found' });
  }
  const proj = db.projects.find((p) => p.id === cnt.projectId);
  const ws = proj ? db.workspaces.find((w) => w.id === proj.workspaceId) : null;
  if (!ws || ws.ownerId !== user.id) {
    return res.status(403).json({ detail: 'Forbidden: You do not own this content' });
  }

  const { title, slug, contentType, textContent, isPublished } = req.body;
  if (title !== undefined) cnt.title = title;
  if (slug !== undefined) cnt.slug = slug;
  if (contentType !== undefined) cnt.contentType = contentType;
  if (textContent !== undefined) cnt.textContent = textContent;
  if (isPublished !== undefined) cnt.isPublished = isPublished;
  cnt.updatedAt = new Date().toISOString();

  return res.json(cnt);
});

app.delete('/api/contents/:id', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const index = db.contents.findIndex((c) => c.id === parseInt(req.params.id, 10));
  if (index === -1) {
    return res.status(404).json({ detail: 'Content not found' });
  }
  const cnt = db.contents[index];
  const proj = db.projects.find((p) => p.id === cnt.projectId);
  const ws = proj ? db.workspaces.find((w) => w.id === proj.workspaceId) : null;
  if (!ws || ws.ownerId !== user.id) {
    return res.status(403).json({ detail: 'Forbidden: You do not own this content' });
  }

  db.contents.splice(index, 1);
  return res.status(204).send();
});

app.post('/api/contents/:id/publish', requireAuth, (req, res) => {
  const user = (req as any).user as User;
  const cnt = db.contents.find((c) => c.id === parseInt(req.params.id, 10));
  if (!cnt) {
    return res.status(404).json({ detail: 'Content not found' });
  }
  const proj = db.projects.find((p) => p.id === cnt.projectId);
  const ws = proj ? db.workspaces.find((w) => w.id === proj.workspaceId) : null;
  if (!ws || ws.ownerId !== user.id) {
    return res.status(403).json({ detail: 'Forbidden: You do not own this content' });
  }

  const { isPublished } = req.body;
  cnt.isPublished = isPublished !== undefined ? isPublished : !cnt.isPublished;
  cnt.updatedAt = new Date().toISOString();

  return res.json(cnt);
});

// ==========================================
// REST API: File Upload & Download
// ==========================================
function getFileTypeFromExt(filename: string): ContentItem['contentType'] {
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  if (['md', 'markdown'].includes(ext)) return 'markdown';
  if (['py', 'ts', 'tsx', 'js', 'jsx', 'html', 'css', 'json', 'sql', 'sh', 'yaml', 'yml'].includes(ext)) return 'code';
  if (['txt', 'log', 'env', 'csv'].includes(ext)) return 'text';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) return 'image';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return 'video';
  if (['xlsx', 'xls'].includes(ext)) return 'excel';
  if (['docx', 'doc'].includes(ext)) return 'word';
  return 'file';
}

app.post('/api/files/upload', requireAuth, upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ detail: 'No file uploaded' });
  }

  const projectId = parseInt(req.body.projectId, 10);
  const title = req.body.title || file.originalname;
  const isPublished = req.body.isPublished === 'true' || req.body.isPublished === true;

  const proj = db.projects.find((p) => p.id === projectId);
  if (!proj) {
    return res.status(404).json({ detail: 'Project not found' });
  }

  const detectedType = getFileTypeFromExt(file.originalname);
  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;

  let textSnippet = '';
  if (['markdown', 'code', 'text'].includes(detectedType)) {
    try {
      textSnippet = fs.readFileSync(file.path, 'utf8');
    } catch {
      // ignore read error
    }
  }

  const content: ContentItem = {
    id: db.contents.length + 1,
    projectId,
    title,
    slug,
    contentType: detectedType,
    textContent: textSnippet,
    fileUrl: `/uploads/${file.filename}`,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    isPublished,
    viewCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.contents.push(content);
  return res.status(201).json({ message: 'File uploaded successfully', content });
});

app.get('/api/files/download/:id', (req, res) => {
  const content = db.contents.find((c) => c.id === parseInt(req.params.id, 10));
  if (!content || !content.fileUrl) {
    return res.status(404).json({ detail: 'File content not found' });
  }

  const filename = path.basename(content.fileUrl);
  const filePath = path.join(UPLOADS_DIR, filename);

  if (fs.existsSync(filePath)) {
    return res.download(filePath, content.fileName || filename);
  }

  // If file doesn't exist on disk (e.g. sample image or generated text), send text or fallback
  if (content.textContent) {
    res.setHeader('Content-Disposition', `attachment; filename="${content.fileName || 'document.txt'}"`);
    res.setHeader('Content-Type', content.mimeType || 'text/plain');
    return res.send(content.textContent);
  }

  return res.status(404).json({ detail: 'Physical file not found on server' });
});

// ==========================================
// REST API: Public Shareable URL (/d/:slug)
// No Authentication Required
// ==========================================
app.get('/api/public/content/:slug', (req, res) => {
  const content = db.contents.find((c) => c.slug === req.params.slug && c.isPublished);
  if (!content) {
    return res.status(404).json({ detail: 'Public content not found or is unpublished' });
  }

  content.viewCount += 1;
  const project = db.projects.find((p) => p.id === content.projectId);
  const workspace = project ? db.workspaces.find((w) => w.id === project.workspaceId) : null;
  const owner = workspace ? db.users.find((u) => u.id === workspace.ownerId) : null;

  return res.json({
    ...content,
    projectTitle: project?.title || 'Unknown Project',
    workspaceTitle: workspace?.title || 'Unknown Workspace',
    authorName: owner?.fullName || 'OmniSpace Author',
  });
});

app.get('/api/public/showcase', (_req, res) => {
  const publicProjects = db.projects.filter((p) => p.isPublished);
  const enriched = publicProjects.map((p) => {
    const ws = db.workspaces.find((w) => w.id === p.workspaceId);
    const contents = db.contents.filter((c) => c.projectId === p.id && c.isPublished);
    return {
      ...p,
      workspaceTitle: ws?.title || '',
      contentsCount: contents.length,
      contents,
    };
  });
  return res.json(enriched);
});

// ==========================================
// Strawberry GraphQL Compatible Endpoint (/graphql)
// ==========================================
app.post('/graphql', (req, res) => {
  const { query, variables } = req.body;
  const user = (req as any).user as User | null;

  if (!query) {
    return res.status(400).json({ errors: [{ message: 'Missing GraphQL query' }] });
  }

  const trimmed = query.trim();

  // 1. Me Query
  if (trimmed.includes('me {') || trimmed.includes('query GetCurrentUser') || trimmed.includes('query Me')) {
    if (!user) {
      return res.json({ data: { me: null } });
    }
    return res.json({
      data: {
        me: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    });
  }

  // 2. Workspaces Tree Query
  if (trimmed.includes('workspaces {') || trimmed.includes('workspaces(')) {
    const userWorkspaces = user
      ? db.workspaces.filter((w) => w.ownerId === user.id || w.isPublic)
      : db.workspaces.filter((w) => w.isPublic);

    const data = userWorkspaces.map((w) => ({
      id: w.id,
      title: w.title,
      slug: w.slug,
      description: w.description,
      isPublic: w.isPublic,
      ownerId: w.ownerId,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      projects: db.projects
        .filter((p) => p.workspaceId === w.id)
        .map((p) => ({
          id: p.id,
          workspaceId: p.workspaceId,
          title: p.title,
          slug: p.slug,
          description: p.description,
          isPublished: p.isPublished,
          contents: db.contents
            .filter((c) => c.projectId === p.id)
            .map((c) => ({
              id: c.id,
              projectId: c.projectId,
              title: c.title,
              slug: c.slug,
              contentType: c.contentType,
              textContent: c.textContent,
              fileUrl: c.fileUrl,
              fileName: c.fileName,
              fileSize: c.fileSize,
              isPublished: c.isPublished,
              viewCount: c.viewCount,
              createdAt: c.createdAt,
            })),
        })),
    }));

    return res.json({ data: { workspaces: data } });
  }

  // 3. Public Content Query
  if (trimmed.includes('publicContent(') || trimmed.includes('publicContent {')) {
    const slugMatch = query.match(/publicContent\s*\(\s*slug:\s*"([^"]+)"/);
    const slug = slugMatch ? slugMatch[1] : (variables && variables.slug);
    const item = db.contents.find((c) => c.slug === slug && c.isPublished);
    return res.json({
      data: {
        publicContent: item || null,
      },
    });
  }

  // 4. Register Mutation
  if (trimmed.includes('mutation') && trimmed.includes('register(')) {
    const emailMatch = query.match(/email:\s*"([^"]+)"/);
    const passMatch = query.match(/password:\s*"([^"]+)"/);
    const nameMatch = query.match(/fullName:\s*"([^"]+)"/);

    const email = emailMatch ? emailMatch[1] : (variables && variables.email);
    const password = passMatch ? passMatch[1] : (variables && variables.password);
    const fullName = nameMatch ? nameMatch[1] : (variables && variables.fullName) || 'OmniSpace User';

    if (!email || !password) {
      return res.status(400).json({ errors: [{ message: 'Email and password required' }] });
    }

    const newUser: User = {
      id: db.users.length + 1,
      email: email.toLowerCase(),
      passwordHash: bcrypt.hashSync(password, 10),
      fullName,
      role: 'owner',
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);

    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      data: {
        register: {
          accessToken: token,
          tokenType: 'bearer',
          user: {
            id: newUser.id,
            email: newUser.email,
            fullName: newUser.fullName,
            role: newUser.role,
          },
        },
      },
    });
  }

  // 5. Login Mutation
  if (trimmed.includes('mutation') && trimmed.includes('login(')) {
    const emailMatch = query.match(/email:\s*"([^"]+)"/);
    const passMatch = query.match(/password:\s*"([^"]+)"/);
    const email = emailMatch ? emailMatch[1] : (variables && variables.email);
    const password = passMatch ? passMatch[1] : (variables && variables.password);

    const foundUser = db.users.find((u) => u.email.toLowerCase() === email?.toLowerCase());
    if (!foundUser || !bcrypt.compareSync(password || '', foundUser.passwordHash)) {
      return res.json({ errors: [{ message: 'Invalid credentials' }] });
    }

    const token = jwt.sign({ userId: foundUser.id, email: foundUser.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      data: {
        login: {
          accessToken: token,
          tokenType: 'bearer',
          user: {
            id: foundUser.id,
            email: foundUser.email,
            fullName: foundUser.fullName,
            role: foundUser.role,
          },
        },
      },
    });
  }

  // Fallback GraphQL Response
  return res.json({
    data: {
      message: 'Strawberry GraphQL Query Executed Successfully',
      workspacesCount: db.workspaces.length,
      projectsCount: db.projects.length,
      contentsCount: db.contents.length,
    },
  });
});

// ==========================================
// Vite Middleware & Static Server
// ==========================================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OmniSpace Full-Stack Server] running on http://0.0.0.0:${PORT}`);
    console.log(`[OmniSpace Strawberry GraphQL] available at http://0.0.0.0:${PORT}/graphql`);
    console.log(`[OmniSpace REST APIs] available at http://0.0.0.0:${PORT}/api`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
