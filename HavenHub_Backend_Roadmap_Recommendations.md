# HavenHub Master Roadmap — Backend Engineering Review & Recommendations

**Prepared By**: Backend Engineering Lead  
**For**: Product Management Team (Chisom, Happiness, Chris)  
**Date**: August 13, 2026  
**Subject**: Technical Feasibility Review & Proposed Adjustments for HavenHub Sprint Roadmap (v1.0)

---

## Executive Summary

After reviewing the **HavenHub Master Sprint Roadmap & Cycle Plan**, the backend engineering team confirms that the 4-cycle structure is **highly feasible, well-structured, and suitable for shipping a production-ready MVP by September 2, 2026**. 

The **100% Feature Lock at Cycle 3** and reserving **Cycle 4 for QA and Demo Rehearsals** is an excellent product strategy. 

To ensure seamless integration between the Frontend and Backend tracks without blocking development, we recommend **3 technical adjustments** to the roadmap.

---

## Recommended Roadmap Adjustments by Cycle

### 1. Cycle 1 (Aug 14 – Aug 21): Architecture, Auth & Base Property CRUD
* **PM Roadmap Alignment**: User Schema, Auth (US-00), Property Schema, CRUD & Cloudinary (US-03, US-04).
* **Engineering Recommendation**:
  * **Image Upload Fallback**: Image file uploads depend on Cloudinary integration. To prevent blocking the Frontend Landlord Upload Form in early Cycle 2, the backend will provide mock image URL fallbacks in Cycle 1 if Cloudinary setup experiences external delays.

---

### 2. Cycle 2 (Aug 21 – Aug 28): Search Engine, Saved Properties & Direct Messaging
* **PM Roadmap Alignment**: Dynamic Search (US-01), Direct Messaging (US-05).
* **Engineering Recommendations**:
  * ⚠️ **Add Missing `SavedProperty` API (US-02)**: The frontend track includes the *"Save Property list view"*, but the backend track did not explicitly list the `SavedProperty` CRUD endpoints (`POST /api/v1/saved-properties`, `DELETE /api/v1/saved-properties/:id`, `GET /api/v1/saved-properties`). **Please add this to the Cycle 2 Backend Track.**
  * 💬 **Messaging Architecture (RESTful vs WebSockets)**: For a 3-week MVP, we strongly recommend implementing Direct Messaging via **RESTful HTTP endpoints** (`POST /api/v1/messages`, `GET /api/v1/messages/thread/:id`) with frontend interval polling, rather than complex WebSockets. This ensures reliable delivery, easier testing, and avoids websocket state management bugs during the live demo.
  * 🔑 **Dev Mode Auto-Approval Flag**: In Cycle 1 & 2, newly created properties will default to `PENDING_REVIEW` (unapproved). Since the Admin Moderation Queue is built in Cycle 3, we will implement a `DEV_AUTO_APPROVE_LISTINGS=true` environment flag so property search testing in Cycle 2 is not blocked by unapproved listings.

---

### 3. Cycle 3 (Aug 28 – Sep 02): Admin Tools & Complete Feature Lock
* **PM Roadmap Alignment**: Admin Moderation Queue API (US-06/07), user suspension, audit logging, 100% feature lock.
* **Engineering Recommendation**:
  * Fully aligned. The backend will deliver `GET /api/v1/admin/listings/pending`, `PATCH /api/v1/admin/listings/:id/approve`, `PATCH /api/v1/admin/listings/:id/reject`, and `POST /api/v1/admin/users/:id/suspend` with audit log creation.

---

### 4. Cycle 4 (Sep 02 – Sep 04): Cross-Device QA, Demo Prep & Release
* **PM Roadmap Alignment**: S1/S2 bug squashing, cloud deployment, seed demo data.
* **Engineering Recommendation**:
  * **Automated Seed Script (`prisma/seed.ts`)**: The backend team will provide an automated seed script to populate realistic test data (verified Landlord accounts, seeker profiles, real Lagos/Abuja properties with photos, inquiry message threads) to ensure a flawless live stream presentation.

---

## Revised Backend Track Summary Matrix for Linear / Roadmap

Below is the updated Backend Track breakdown ready to be copied into the Master Roadmap document:

| Cycle | Goal | Key Backend Deliverables |
| :--- | :--- | :--- |
| **Cycle 1** (Aug 14 - Aug 21) | Auth, Base Property Models & System Architecture | • User Schema, bcrypt hashing, JWT Auth, Role middleware (US-00)<br>• Property Schema, CRUD endpoints, Cloudinary image upload (US-03, US-04)<br>• Swagger API Documentation setup (`/api/docs`) |
| **Cycle 2** (Aug 21 - Aug 28) | Search Engine, Saved Properties & Direct Messaging | • Dynamic Search & Filter API (Location, Price, Bedrooms, Type) (US-01)<br>• **Saved Properties CRUD API (US-02)** *(Added)*<br>• RESTful Direct Messaging DB schema & Inbox thread APIs (US-05)<br>• `DEV_AUTO_APPROVE` flag for search testing unblocking |
| **Cycle 3** (Aug 28 - Sep 02) | Admin Moderation Tools & Feature Lock | • Admin Moderation Queue API (Approve/Reject listings) (US-06, US-07)<br>• User Suspension endpoints & Audit Logging<br>• Staging API stabilization & 100% Feature Lock |
| **Cycle 4** (Sep 02 - Sep 04) | Deployment, QA Support & Seeding | • S1/S2 Bug fixes & hotfixes<br>• Production cloud deployment & environment verification<br>• Automated Demo Seeding script (`prisma/seed.ts`) |
