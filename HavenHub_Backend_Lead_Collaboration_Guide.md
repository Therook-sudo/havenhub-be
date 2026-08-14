# HAVENHUB Backend Team — Git Workflow, Branching & Collaboration Guide

**Role**: Backend Engineering Lead  
**Project**: HAVENHUB Backend API (NestJS + TypeORM + PostgreSQL)  
**Target Submission**: September 2, 2026  

---

## 1. GitHub Branching & Environment Strategy

To prevent merge conflicts, broken builds, and code overwrites, the repository will follow a **3-tier environment and branching model**:

```
[Feature Branch]  ---> (PR Review) ---> [ staging ] ---> (Release Sign-off) ---> [ main ]
 (e.g., feat/auth)                        (QA Environment)                        (Live Production)
```

### Branch Hierarchy

| Branch | Environment | Access & Push Policy | Description |
| :--- | :--- | :--- | :--- |
| `main` | **Production** | **Protected**. No direct pushes. Merges only from `staging` via Lead PR approval. | Production-ready, live code deployed to main cloud API (`api.havenhub.com`). |
| `staging` | **Staging / QA** | **Protected**. Merges only via approved Feature Branch PRs. | Pre-production integration branch used by Frontend & QA (`staging-api.havenhub.com`). |
| `feat/*` / `fix/*` | **Local Dev** | Engineer owned. Created from `staging`. | Short-lived individual developer branches for specific Linear tasks. |

---

## 2. Feature Branch Naming Conventions

Every engineer MUST create a dedicated feature branch off `staging` for their assigned task:

```bash
# Branch Naming Standard:
<type>/<linear-id>-<short-description>

# Examples:
feat/US-00-auth-jwt-signup
feat/US-03-property-crud-upload
feat/US-01-search-filter-engine
feat/US-05-direct-messaging-api
fix/US-04-image-url-validation
```

---

## 3. Recommended Developer Collaboration Workflow (Step-by-Step)

### Step 1: Branch Off Staging
Before starting a new task, pull the latest `staging` branch:
```bash
git checkout staging
git pull origin staging
git checkout -b feat/US-00-auth-jwt-signup
```

### Step 2: Local Development & Pre-Commit Verification
Work on assigned NestJS controllers/services. Before opening a PR, always run:
```bash
npm run type-check   # Ensure 0 TypeScript errors
npm run build        # Ensure clean NestJS build
```

### Step 3: Push & Create Pull Request (PR)
Push feature branch to GitHub and open a PR targeting **`staging`** (NOT `main`):
```bash
git push origin feat/US-00-auth-jwt-signup
```

### Step 4: Pull Request Requirements & Code Review
For a PR to be merged into `staging`:
1. **Title Format**: `feat(auth): implement JWT signup and role middleware (US-00)`
2. **Reviewers**: At least **1 mandatory review approval** from the Backend Lead.
3. **Automated Checks**: `npm run build` & `npm run type-check` must pass in CI/CD (GitHub Actions).
4. **Testing Proof**: Attach Postman endpoint test output or JSON payload screenshot in the PR description.

---

## 4. Task Distribution Plan Across Backend Engineers

Here is a recommended breakdown for assigning user stories across 2 to 3 backend team members:

### 👤 Engineer A: Authentication, Authorization & Admin Tools
- **Cycle 1 (Aug 14 - Aug 21)**:
  - Branch: `feat/US-00-user-auth-jwt`
  - Deliverables: Register, Login, JWT strategy, Password hashing with bcrypt, Roles decorator (`@Roles(Role.LANDLORD, Role.ADMIN)`), Auth Guard.
- **Cycle 3 (Aug 28 - Sep 02)**:
  - Branch: `feat/US-06-admin-moderation-queue`
  - Deliverables: Listing approval/rejection endpoints, User suspension API, Audit log creation.

### 👤 Engineer B: Property Management & Search Engine
- **Cycle 1 (Aug 14 - Aug 21)**:
  - Branch: `feat/US-03-property-crud-upload`
  - Deliverables: Property creation, update, delete, get endpoints, Cloudinary file upload service integration.
- **Cycle 2 (Aug 21 - Aug 28)**:
  - Branch: `feat/US-01-property-search-filter`
  - Deliverables: Dynamic SQL search query builder (Location, Price range, Bedrooms, Property Type, Pagination).

### 👤 Engineer C (or Lead): Saved Properties, Inquiries & Direct Messaging
- **Cycle 2 (Aug 21 - Aug 28)**:
  - Branch `feat/US-02-saved-properties`: Bookmark/Saved Property CRUD endpoints (`POST /saved-properties`, `GET /saved-properties`).
  - Branch `feat/US-05-direct-messaging-api`: Inquiry submission, RESTful messaging inbox threads (`POST /messages`, `GET /messages/thread/:id`).
- **Cycle 4 (Sep 02 - Sep 04)**:
  - Database Seeding script (`prisma/seed.ts` or `src/database/seed.ts`) & Production Cloud deployment support.

---

## 5. GitHub Repository Settings Checklist (For Lead)

1. **Protect `main` & `staging` Branches**:
   - Go to GitHub Repository -> **Settings** -> **Branches** -> Add Branch Protection Rule.
   - Select **Require a pull request before merging**.
   - Select **Require status checks to pass before merging** (`build`, `type-check`).
2. **Configure GitHub Actions CI Workflow** (`.github/workflows/ci.yml`):
   - Automatically run `npm run type-check` and `npm run build` on every PR opened against `staging`.
3. **Staging Auto-Deployment**:
   - Connect the `staging` branch on GitHub to Render / Railway / Heroku so merging a PR auto-deploys to `staging-api.havenhub.com`.
