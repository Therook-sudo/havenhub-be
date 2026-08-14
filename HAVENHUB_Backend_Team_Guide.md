# HAVENHUB Backend Team — Git Collaboration & Engineering Guide

Welcome to the **HAVENHUB Backend Engineering Team**! This guide outlines our Git workflow, branching conventions, Pull Request rules, and sprint task assignments. 

Please read and follow these standards carefully to ensure smooth integration and a conflict-free development process.

---

## 📌 1. Repository & Branching Rules

Our repository uses a **2-tier main branch structure**:

- **`main`**: Production branch. Stable, release-ready code.
- **`staging`**: Integration branch. All new feature development must be merged into `staging` first.
- **`feat/*` / `fix/*`**: Your personal feature branch. Always created off `staging`.

> ⚠️ **IMPORTANT RULE**: **NEVER push directly to `main` or `staging`.** Always develop on your own feature branch and submit a Pull Request (PR) targeting the `staging` branch.

---

## 🌿 2. How to Start a New Task (Step-by-Step)

### Step 1: Switch to `staging` and pull latest changes
```bash
git checkout staging
git pull origin staging
```

### Step 2: Create your feature branch off `staging`
Use the naming format: `feat/<task-id>-<short-description>`

```bash
# Examples:
git checkout -b feat/US-00-auth-jwt-signup
git checkout -b feat/US-03-property-crud-upload
git checkout -b feat/US-01-search-filter-engine
```

### Step 3: Develop & Verify Locally
Before pushing your code, run the verification scripts to make sure there are no compiler errors:

```bash
# 1. Verify TypeScript types (Must pass with 0 errors)
npm run type-check

# 2. Verify NestJS build
npm run build
```

### Step 4: Commit & Push to GitHub
Commit your work using conventional commit messages:

```bash
git add .
git commit -m "feat(auth): implement signup endpoint and password hashing"
git push -u origin feat/US-00-auth-jwt-signup
```

---

## 📥 3. Submitting a Pull Request (PR)

1. Go to the GitHub repository: `https://github.com/kodecampteam/havenhub-be`
2. Open a Pull Request from your feature branch into **`staging`** (NOT `main`).
3. **PR Title Format**: `feat(module): brief description of work` (e.g. `feat(property): add property CRUD endpoints`).
4. **Assignee**: Assign yourself.
5. **Reviewer**: Assign **Backend Lead** for review.
6. **Description**: Include a brief summary of what you built and attach Postman test results / screenshots showing the endpoints work.
7. Ensure all automated GitHub Actions CI checks (`type-check` & `build`) pass.

---

## 🗓️ 4. Task Breakdown & Assignments

### 👤 Track A: Authentication, Security & Admin Tools
- **Cycle 1**: User Registration, Login, Password Hashing (`bcrypt`), JWT Strategy, Auth Guards, Role Decorators (`PROPERTY_SEEKER`, `LANDLORD`, `ADMIN`).
- **Cycle 3**: Admin Moderation Queue (Approve/Reject listings), User Suspension endpoints, Audit Logging.

### 👤 Track B: Property Listings & Search Engine
- **Cycle 1**: Property CRUD endpoints (`POST /properties`, `GET /properties`, `PUT /properties/:id`, `DELETE /properties/:id`), Image Upload service integration.
- **Cycle 2**: Advanced Dynamic Search & Filter API (filtering by Location, Price range, Bedrooms, Property Type).

### 👤 Track C: Inquiries, Saved Properties & Direct Messaging
- **Cycle 2**: Saved Property / Bookmark API (`POST /saved-properties`, `DELETE /saved-properties/:id`, `GET /saved-properties`).
- **Cycle 2**: Renter Inquiries & Direct Messaging Inbox Thread APIs (`POST /messages`, `GET /messages/thread/:id`).

---

## 💡 5. Best Practices & Coding Standards

- **RESTful Conventions**: Use plural nouns for resource routes (`/api/v1/properties`, `/api/v1/users`).
- **DTO Validation**: Use `class-validator` decorators (`@IsString()`, `@IsNotEmpty()`, `@IsEnum()`) on all Request DTOs.
- **Type Safety**: Never use explicit `any` types. Use proper TypeORM entities and TypeScript interfaces.
- **Environment Variables**: Always use `@nestjs/config` (`ConfigService`) to access `.env` variables. Never hardcode credentials.

---

**Questions or Blockers?** Reach out directly to your Backend Engineering Lead!
