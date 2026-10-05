# OmniSpace — Workspaces, Projects & Content Management Hub

A full-stack enterprise platform for managing Workspaces, Projects, and Multi-Format Contents powered by:
- **Backend:** FastAPI, SQLModel (ORM), SQLite (default) / PostgreSQL, Strawberry GraphQL, JWT Authentication, python-multipart
- **Frontend:** Vite, React 19, TypeScript, Tailwind CSS, Lucide Icons, SheetJS / Mammoth / PDF / Markdown viewer engines
- **Deployment:** Docker, Docker Compose, Nginx

---

## 🏗 System Architecture & Hierarchy

```
User (Owner / Member)
  └── Workspaces (e.g. "Platform Engineering", "Design Systems")
        └── Projects (e.g. "API Specs v2", "Q3 Architecture Review")
              └── Contents (Multi-format Documents & Media)
                    ├── Markdown (.md) — Interactive Editor & Split Preview
                    ├── Code / Source (.py, .ts, .json, .sql, .html)
                    ├── Excel Spreadsheets (.xlsx, .xls) — Interactive Sheet Grid
                    ├── Word Documents (.docx) — Formatted Docx Render
                    ├── PDF Documents (.pdf) — Canvas & Embedded Viewer
                    ├── Images (.png, .jpg, .webp, .svg) — Zoom & Metadata
                    ├── Videos (.mp4, .webm) — Custom Player & Speed Controls
                    └── Public Shareable URL: /d/:slug (No login required)
```

---

## 🚀 Quick Start with Docker Compose

Run the entire full-stack application (FastAPI backend + Vite/Nginx frontend + SQLite volume):

```bash
# Build and start all services
docker compose up --build -d

# Frontend: http://localhost:3000
# Backend REST & OpenAPI Docs: http://localhost:8000/docs
# Strawberry GraphQL IDE: http://localhost:8000/graphql
```

### 🔄 Easy Switch to PostgreSQL

By default, OmniSpace uses SQLite with zero configuration. To switch to PostgreSQL:
1. Open `docker-compose.yml`
2. Uncomment the `postgres` service block and `postgres-data` volume.
3. Switch the `DATABASE_URL` environment variable:
   ```yaml
   DATABASE_URL=postgresql+psycopg2://omnispace:omnispace_secret@postgres:5432/omnispace_db
   ```
4. Run `docker compose up --build -d`. SQLModel will automatically provision all tables on startup!

---

## 🛠 Local Development Setup

### 1. Backend (Python 3.10+)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

pip install -r requirements.txt

# Run migrations/init & dev server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend endpoints:
- REST API: `http://localhost:8000/api`
- Swagger UI: `http://localhost:8000/docs`
- Strawberry GraphQL: `http://localhost:8000/graphql`

### 2. Frontend (Node.js 18+)

```bash
npm install
npm run dev
# Running on http://localhost:3000
```

---

## 🍓 Strawberry GraphQL Queries & Mutations

OmniSpace provides a high-performance GraphQL schema using Strawberry GraphQL.

### 1. Register & Authenticate
```graphql
mutation RegisterUser {
  register(
    email: "alex@omnispace.dev"
    password: "Password123!"
    fullName: "Alex Rivera"
  ) {
    accessToken
    tokenType
    user {
      id
      email
      fullName
      role
    }
  }
}
```

### 2. Login
```graphql
mutation LoginUser {
  login(email: "alex@omnispace.dev", password: "Password123!") {
    accessToken
    user {
      id
      email
      fullName
    }
  }
}
```

### 3. Query User Workspaces & Projects Tree
```graphql
query GetMyWorkspaceTree {
  me {
    id
    email
    fullName
  }
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
        viewCount
        fileUrl
      }
    }
  }
}
```

### 4. Create Workspace
```graphql
mutation CreateNewWorkspace {
  createWorkspace(
    title: "AI Infrastructure"
    description: "Core models, pipelines, and evaluations"
    isPublic: false
  ) {
    id
    title
    slug
  }
}
```

### 5. Create & Publish Content (Markdown / Code / File)
```graphql
mutation CreateContentItem {
  createContent(
    projectId: 1
    title: "System Architecture RFC"
    contentType: "markdown"
    textContent: "# System RFC\n\n- Real-time indexing\n- GraphQL API"
    isPublished: true
  ) {
    id
    title
    slug
    isPublished
  }
}
```

### 6. Public Access (No Authentication Required!)
```graphql
query FetchPublicContent {
  publicContent(slug: "system-architecture-rfc-17911860") {
    id
    title
    contentType
    textContent
    fileUrl
    viewCount
    updatedAt
  }
}
```

---

## 🔒 Ownership-Based Access Control

- **Workspaces:** Owned by the creator. Can be private or public. Only the owner can modify or delete the workspace and create projects within it.
- **Projects:** Belong to a workspace. Can be published. Inherits workspace authorization.
- **Contents:** Belong to a project. Can be toggled `is_published: true`.
- **Public URLs `/d/:slug`:** Anyone with the slug can view published contents without creating an account or logging in.

---

## 📁 Multi-Format Document & Media Support

- **Markdown (`.md`):** Real-time side-by-side editing, syntax highlighting, table generation, checklist parsing.
- **Source Code (`.py`, `.ts`, `.json`, `.sql`, etc.):** Line numbers, copy-to-clipboard, raw download.
- **Spreadsheets (`.xlsx`, `.xls`):** Sheet selection tabs, parsed tabular matrix, column sorting, search filter, CSV export.
- **Word Documents (`.docx`):** Rendered document pagination, rich typography, formatted tables, bullet points.
- **PDF Documents (`.pdf`):** Canvas zoom controls (fit, 100%, 150%), page jump, fullscreen, and download.
- **Images (`.png`, `.jpg`, `.webp`, `.svg`):** Zoom inspection, metadata display, aspect ratio calculator.
- **Video (`.mp4`, `.webm`):** HTML5 video player with scrub bar, playback rates (0.5x, 1x, 1.5x, 2x), and fullscreen mode.
