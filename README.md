# 🏠 HAVENHUB Backend REST API

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![TypeORM](https://img.shields.io/badge/TypeORM-FE0803?style=for-the-badge&logo=typeorm&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)

HAVENHUB is an enterprise-grade Property Rental & Real Estate Marketplace backend service engineered with **NestJS**, **PostgreSQL**, **TypeORM**, and **Groq LLM AI** integrations. It powers real-time property discovery, multi-filter search, landlord listing management, Cloudinary media processing, two-way inquiry messaging threads, administrator moderation workflows, and AI-powered listing copywriting.

---

## 🌐 Live Deployments & Documentation

| Resource | URL |
| :--- | :--- |
| 🚀 **Live Staging API Base URL** | `https://havenhub-be.onrender.com/api/v1` |
| 📖 **Interactive Swagger UI Docs** | [https://havenhub-be.onrender.com/api/docs](https://havenhub-be.onrender.com/api/docs) |
| 📱 **Flutter / OpenAPI Spec JSON** | [https://havenhub-be.onrender.com/api/docs-json](https://havenhub-be.onrender.com/api/docs-json) |
| 💻 **Frontend Web Application** | [https://havenhub-fe.vercel.app](https://havenhub-fe.vercel.app) |

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Clients["📱 Client Layer"]
        Web["Web SPA (Vanilla JS / Vercel)\nhttps://havenhub-fe.vercel.app"]
        Mobile["Mobile App (Flutter / Dart)"]
        Swagger["Swagger UI / Postman\nhttps://havenhub-be.onrender.com/api/docs"]
    end

    subgraph Gateway["🛡️ Gateway & Hosting Layer (Render Cloud)"]
        Nginx["TLS / HTTPS Termination & Reverse Proxy"]
        Cors["Permissive CORS & Rate Limiting"]
        GlobalPipes["ValidationPipe (class-validator) & HttpExceptionFilter"]
    end

    subgraph Backend["⚙️ NestJS Modular Core (/api/v1)"]
        AuthModule["🔐 Auth & Users Module\n- JWT Authentication (30d)\n- RBAC (Seeker, Landlord, Admin)\n- Profile Photo Upload"]
        PropModule["🏡 Properties Engine\n- Discovery Feed & Multi-Filter Search\n- Multipart Form-Data Ingestion\n- Landlord Listing CRUD & Drafts"]
        MsgModule["💬 Enquiries & Chat Module\n- Two-Way Landlord/Tenant Threads\n- Sender Role Mapping & Read Receipts"]
        AiModule["🤖 AI Assistant Module\n- Groq LLM Copywriting\n- 3-Bullet Highlight Summarization"]
        AdminModule["👑 Admin & Moderation Module\n- Property Moderation Queue\n- User Suspension & Reactivation\n- System Audit Logs"]
        MediaModule["📸 Cloudinary Media Module\n- Multi-Image Property Uploads\n- Avatar Storage & CDN Delivery"]
    end

    subgraph Persistence["🗄️ Database & External Services"]
        Postgres[("PostgreSQL Database (Render Cloud)\n- Users, Properties, Enquiries\n- Saved Properties, Audit Logs")]
        Cloudinary[("Cloudinary Media CDN\n- Property Photos & User Avatars")]
        GroqAPI[("Groq Cloud LLM API\n- openai/gpt-oss-20b\n- openai/gpt-oss-120b")]
    end

    Web -->|HTTPS / REST| Gateway
    Mobile -->|HTTPS / REST| Gateway
    Swagger -->|HTTPS / REST| Gateway

    Gateway --> GlobalPipes
    GlobalPipes --> Backend

    AuthModule --> Postgres
    PropModule --> Postgres
    MsgModule --> Postgres
    AdminModule --> Postgres
    MediaModule --> Cloudinary
    AiModule --> GroqAPI
```

---

## 🛠️ Tech Stack & Key Libraries

- **Framework**: [NestJS](https://nestjs.com/) v10 (TypeScript)
- **Database Engine**: [PostgreSQL](https://www.postgresql.org/) (Hosted on Render Cloud)
- **Object-Relational Mapping**: [TypeORM](https://typeorm.io/)
- **Authentication**: Passport JWT (`@nestjs/jwt`, `passport-jwt`, `bcrypt`) with 30-day session tokens
- **File Uploads & Media Storage**: [Cloudinary](https://cloudinary.com/) with Multer & `AnyFilesInterceptor`
- **AI Engine**: [Groq Cloud LLM API](https://groq.com/) with fallback templating
- **API Documentation**: [Swagger OpenAPI](https://swagger.io/) with custom JSON endpoint for Flutter code generators
- **Validation**: `class-validator` & `class-transformer`

---

## 📁 Repository Structure

```
HAVEN_HUB/
├── src/
│   ├── admin/                # Admin moderation, user suspension, & property stats
│   ├── ai/                   # AI property description generator & summarizer
│   ├── audit-log/            # System audit logging & activity tracking
│   ├── auth/                 # JWT strategy, Guards (JwtAuthGuard, RolesGuard), Decorators
│   ├── cloudinary/           # Cloudinary image upload stream service
│   ├── common/               # Global filters (HttpExceptionFilter), Logging interceptors
│   ├── config/               # Configuration loader & feature flag resolvers
│   ├── enquiries/            # Two-way enquiry threads, landlord reply logic & read tracking
│   ├── entities/             # TypeORM Entities (User, Property, Enquiry, SavedProperty, AuditLog)
│   ├── health/               # Health check endpoint & DB connectivity verification
│   ├── properties/           # Properties controller, search engine, multipart uploads & CRUD
│   ├── property/             # Property DTOs & Validation schemas
│   ├── saved-property/       # User property bookmarking & wishlists
│   ├── users/                # User registration, login, profile updates, & avatar uploads
│   ├── app.module.ts         # Root NestJS application module
│   └── main.ts               # Application bootstrap & Swagger documentation setup
├── test/                     # End-to-end (E2E) integration test suites
├── .env.example              # Environment variables template
├── package.json              # Project dependencies and npm scripts
└── tsconfig.json             # TypeScript compiler configuration
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- **Node.js**: `>= 18.x`
- **npm**: `>= 9.x`
- **PostgreSQL**: Local PostgreSQL instance or remote database URL

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/kodecampteam/havenhub-be.git
cd havenhub-be
npm install
```

### 2. Configure Environment Variables
Copy the `.env.example` template and populate with your database and API credentials:
```bash
cp .env.example .env
```

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Local application port | `5000` |
| `NODE_ENV` | Environment (`development` / `production`) | `development` |
| `DATABASE_URL` | PostgreSQL Connection String | `postgresql://user:pass@localhost:5432/havenhub_db` |
| `JWT_SECRET` | Secret key used to sign JWTs | `havenhub_dev_secret_key_2026` |
| `JWT_EXPIRES_IN` | Access token lifetime | `30d` |
| `GROQ_API_KEY` | Groq Cloud API Key for AI features | `gsk_...` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name | `havenhub-cloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `your_secret_here` |
| `DEV_AUTO_APPROVE_LISTINGS` | Auto-approve listings for staging | `false` |

### 3. Run the Development Server
```bash
npm run start:dev
```
- API Base URL: `http://localhost:5000/api/v1`
- Swagger UI Documentation: `http://localhost:5000/api/docs`
- Flutter OpenAPI JSON Spec: `http://localhost:5000/api/docs-json`

---

## 🧪 Testing & Quality Assurance

The codebase adheres to strict testing standards with 100% test pass rate across 17 test suites:

```bash
# Run unit tests
npm test

# Run type check
npm run type-check

# Run production build
npm run build
```

---

## 📋 Comprehensive REST API Catalog

### 🔐 Authentication & Users (`/api/v1/users`)
- `POST /api/v1/users/register`: Register new user with role (`PROPERTY_SEEKER`, `LANDLORD`, etc.)
- `POST /api/v1/users/login`: Authenticate and receive 30-day Bearer JWT
- `GET /api/v1/users/me`: Get current authenticated user profile
- `PUT /api/v1/users/me` & `PUT /api/v1/users/profile`: Update profile info & role selection
- `POST /api/v1/users/me/photo`: Upload user avatar to Cloudinary
- `PUT /api/v1/users/me/password`: Change account password

### 🏡 Properties (`/api/v1/properties`)
- `GET /api/v1/properties`: Public discovery feed (paginated, sorted)
- `GET /api/v1/properties/search`: Multi-parameter dynamic search filter
- `GET /api/v1/properties/my-listings`: Landlord's listed properties
- `GET /api/v1/properties/my-listings/stats`: Landlord listing performance statistics
- `GET /api/v1/properties/:id`: Single property details
- `GET /api/v1/properties/:id/ai-summary`: Direct AI 3-bullet highlights summary (Mobile-friendly)
- `POST /api/v1/properties`: Create property listing (supports JSON and Multipart/Form-Data with photos)
- `POST /api/v1/properties/drafts`: Save property listing as draft
- `PUT /api/v1/properties/:id`: Update property listing
- `DELETE /api/v1/properties/:id`: Remove property listing
- `PATCH /api/v1/properties/:id/status`: Moderate listing (`APPROVED`, `REJECTED`, `PENDING_REVIEW`) [Admin only]

### 💬 Enquiries & Messaging (`/api/v1/enquiries`)
- `POST /api/v1/enquiries`: Create new enquiry (Tenant) or reply to thread (Landlord/Tenant)
- `POST /api/v1/enquiries/reply`: Reply to an existing conversation thread
- `GET /api/v1/enquiries/threads`: Get all user conversations with other party's profile
- `GET /api/v1/enquiries/threads/:threadId`: Get full message history with left/right bubble sender roles
- `GET /api/v1/enquiries/unread-count`: Get unread message count badge for landlord
- `PATCH /api/v1/enquiries/:id/read` & `PATCH /api/v1/enquiries/threads/:threadId/read-all`: Mark as read
- `DELETE /api/v1/enquiries/:id`: Archive conversation thread

### 🤖 AI Listing Assistant (`/api/v1/ai`)
- `POST /api/v1/ai/generate-description` & `GET /api/v1/ai/generate-description`: Generate Nigerian real estate copy from raw landlord notes
- `POST /api/v1/ai/summarize` & `GET /api/v1/ai/summarize`: Extract 3 key bullet highlights from property text

### 👑 Admin Moderation & User Management (`/api/v1/admin`)
- `GET /api/v1/admin/users`: List users with search, role filters, and pagination
- `PATCH /api/v1/admin/users/:id/suspend`: Suspend user account with reason
- `PATCH /api/v1/admin/users/:id/activate`: Reactivate suspended account
- `GET /api/v1/admin/properties`: Admin moderation listings queue
- `GET /api/v1/audit-logs`: Moderation audit logs trail

---

## 👥 Contributors & Team
- **Backend Engineering Lead**: Ezeliora Chukwuemeka (`Therook-sudo`)
- **Backend / AI Engineer**: Lucy Nwokoye
- **QA Engineering Lead**: David Osiago Chukwuladi
- **Frontend Lead**: Ugochi Francisca
- **Mobile Engineering Lead**: Gideon Edoghotu
- **Product / Project Lead**: Chisom Promise Onyekaba
