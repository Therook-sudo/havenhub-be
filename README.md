# HAVENHUB Backend API

HAVENHUB is a modern Property Rental & Real Estate Marketplace backend service built with **NestJS**, **PostgreSQL**, **TypeORM**, and **RESTful API** principles.

## Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) (TypeScript)
- **Database**: PostgreSQL
- **ORM**: [TypeORM](https://typeorm.io/)
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
└── src/
    ├── common/               # Exception filters, interceptors, pipes
    ├── config/               # NestJS configuration loader
    ├── entities/             # TypeORM Entities (User, Property, Enquiry, etc.)
    ├── health/               # RESTful health check module
    ├── app.module.ts         # Root module with TypeORM configuration
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

# 3. Start development server (TypeORM automatically syncs schema in dev mode)
npm run start:dev
```

---

## REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | System health status & PostgreSQL TypeORM connection check |
| `GET` | `/api/docs` | Interactive Swagger API documentation |
| `PATCH` | `/api/v1/properties/:id/status` | **Admin only.** Move a listing to `PENDING_REVIEW`, `APPROVED`, or `REJECTED` |

---

## Feature Flags

| Variable | Values | Default | Effect |
| :--- | :--- | :--- | :--- |
| `DEV_AUTO_APPROVE_LISTINGS` | `true` / `false` | `false` | `true` creates new property listings as `APPROVED` (bypassing moderation) and shows every status in the public feed. `false` creates them as `PENDING_REVIEW`, and the public feed only returns `APPROVED` listings. |

Only the literal string `true` enables the flag; any other value (or an unset variable) leaves it off.
Keep it `false` in production — an admin approves listings through
`PATCH /api/v1/properties/:id/status`.

---

## Testing

```bash
npm test          # run the Jest unit test suite
npm run test:cov  # run with coverage
```

---

## Database Entities Overview

- `User`: Roles (`PROPERTY_SEEKER`, `LANDLORD`, `REAL_ESTATE_AGENT`, `PROPERTY_MANAGER`, `ADMIN`)
- `Property`: Real estate listing details, pricing, location, status (`PENDING_REVIEW`, `APPROVED`, `RENTED`, etc.)
- `Enquiry`: Property seeker messages sent to landlords/agents
- `SavedProperty`: Shortlisted properties per user
- `Report`: User & listing moderation reports
- `AuditLog`: Administrator moderation logs
