# HAVENHUB Backend API

HAVENHUB is a modern Property Rental & Real Estate Marketplace backend service built with **NestJS**, **PostgreSQL**, **Prisma ORM**, and **RESTful API** principles.

## Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) (TypeScript)
- **Database**: PostgreSQL
- **ORM**: [Prisma](https://www.prisma.io/)
- **API Style**: RESTful API (`/api/v1/...`)
- **Documentation**: Swagger OpenAPI (`/api/docs`)
- **Validation & Transformation**: `class-validator`, `class-transformer`

---

## Directory Structure

```
HAVEN_HUB/
├── .env.example              # Environment variables template
├── .env                      # Local environment configuration
├── nest-cli.json             # Nest CLI configuration
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── prisma/
│   └── schema.prisma         # PostgreSQL models & datasource
└── src/
    ├── common/               # Exception filters, interceptors, pipes
    ├── config/               # NestJS configuration loader
    ├── prisma/               # Prisma database service & module
    ├── health/               # RESTful health check module
    ├── app.module.ts         # Root module
    └── main.ts               # Bootstrapping & Swagger setup
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn
- PostgreSQL instance running locally or via Docker

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env

# 3. Generate Prisma Client
npx prisma generate

# 4. Run database migrations (when PostgreSQL is active)
npx prisma migrate dev --name init

# 5. Start development server
npm run start:dev
```

---

## REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | System health status & PostgreSQL connection check |
| `GET` | `/api/docs` | Interactive Swagger API documentation |

---

## Database Models Overview

- `User`: Roles (`PROPERTY_SEEKER`, `LANDLORD`, `REAL_ESTATE_AGENT`, `PROPERTY_MANAGER`, `ADMIN`)
- `Property`: Real estate listing details, pricing, location, status (`PENDING_REVIEW`, `APPROVED`, `RENTED`, etc.)
- `Enquiry`: Property seeker messages sent to landlords/agents
- `SavedProperty`: Shortlisted properties per user
- `Report`: User & listing moderation reports
- `AuditLog`: Administrator moderation logs
