# AI Use Declaration

This document discloses every use of AI-assisted tools across the project, as required by the SWE 574 course policy. All generated output was reviewed, tested, and modified by team members before integration.

---

## Summary Table

| Area | Tool | Level of Reliance |
|---|---|---|
| Backend source code (FastAPI services, API routes) | Claude Code (Sonnet/Opus) | Partial generation |
| Backend models (Pydantic schemas) | Claude Code (Sonnet/Opus) | Partial generation |
| Backend test suite (pytest) | Claude Code (Sonnet/Opus) | Major generation |
| Mock / seed data | Claude Code (Sonnet/Opus) | Major generation |
| Frontend React components | Claude Code (Sonnet/Opus), GitHub Copilot | Partial generation |
| Frontend TypeScript types | Claude Code (Sonnet/Opus) | Suggestion only |
| Frontend test suite (Vitest) | Claude Code (Sonnet/Opus) | Partial generation |
| Android app (Kotlin/Compose) | Claude Code (Sonnet/Opus), GitHub Copilot | Partial generation |
| Android unit tests | Claude Code (Sonnet/Opus) | Partial generation |
| Docker / CI-CD configuration | Claude Code (Sonnet/Opus) | Suggestion only |
| Final project report (LaTeX) | Claude Code (Sonnet/Opus) | Partial generation |
| SRS document | ChatGPT-4o | Suggestion only |
| UML diagrams (TikZ) | Claude Code (Sonnet/Opus) | Major generation |
| AGENTS.md / CLAUDE.md guidance files | Claude Code (Sonnet/Opus) | Major generation |

---

## Detailed Entries

### 1. Backend — Service Layer (`backend/app/services/`)

**Tool:** Claude Code (Claude Sonnet 4 / Opus 4)  
**Task:** Generating scaffolding for 15 service classes covering auth, user, service, transaction, join request, chat, comment, forum, community, rating, report, notification, badge, Wikidata integration, and content moderation.  
**Level of reliance:** Partial generation — AI generated initial structure and method stubs; all business logic (TimeBank rules, anti-hoarding enforcement, capacity checks, dual-confirmation flow) was designed and written by the team, with AI used for boilerplate patterns.  
**Validation:** Each service method was tested via the pytest suite. Business-critical logic (e.g., `transaction_service.py` balance enforcement, `join_request_service.py` state machine) was manually reviewed and debugged by the team before merging.

---

### 2. Backend — API Routes (`backend/app/api/`)

**Tool:** Claude Code (Claude Sonnet 4)  
**Task:** Generating 15 FastAPI router files with endpoint signatures, dependency injection patterns, and error handling wrappers.  
**Level of reliance:** Partial generation — AI produced the route structure and HTTP method mapping; team added RBAC guards, endpoint-specific validation, and custom error messages.  
**Validation:** Tested via FastAPI's interactive Swagger UI (`/docs`) on the live deployment and validated against the Pydantic models. All routes covered by API-level pytest tests.

---

### 3. Backend — Pydantic Models (`backend/app/models/`)

**Tool:** Claude Code (Claude Sonnet 4)  
**Task:** Drafting request/response schema classes for all 12 domain model files.  
**Level of reliance:** Partial generation — field names and types were driven by team design decisions; AI filled in boilerplate validator patterns (`@validator`, `model_validator`) and Optional field handling.  
**Validation:** Schema mismatches were caught during integration testing and corrected by the team.

---

### 4. Backend — Test Suite (`backend/tests/`)

**Tool:** Claude Code (Claude Sonnet 4 / Opus 4)  
**Task:** Generating 33 test files (456 total test cases) covering API endpoints and service business logic, using mongomock and FastAPI TestClient.  
**Level of reliance:** Major generation — test file structure, fixture patterns, and individual test cases were largely AI-generated based on the existing service and route code. The `conftest.py` fixture setup was co-developed.  
**Validation:** Tests were run with `pytest --cov=app`; 17 tests were identified as failing due to a test-harness ordering issue (422 vs 401 on unauthenticated requests). The root cause was documented; tests were not blindly accepted. Overall coverage: 81%.

---

### 5. Mock and Seed Data

**Tool:** Claude Code (Claude Sonnet 4)  
**Task:** Generating MongoDB playground scripts (`playground-*.mongodb.js`, `data-services-seed.json`) for seeding realistic test users, services, comments, and transactions in the development environment.  
**Level of reliance:** Major generation — AI produced the bulk of seed data structures and transformation scripts; team reviewed for plausibility and Turkish locale correctness.  
**Validation:** Data was loaded into the development MongoDB instance and manually inspected via MongoDB Compass. Realistic user names, service descriptions, and time-bank balances were verified by team members.

---

### 6. Frontend — React Components (`frontend/src/`)

**Tool:** Claude Code (Claude Sonnet 4), GitHub Copilot  
**Task:** Generating React component scaffolding for pages (Dashboard, ServiceDetail, Profile, Forum, Admin), shared UI components (Radix UI wrappers, map markers, form dialogs), and API service layer (`services/api.ts`).  
**Level of reliance:** Partial generation — component structure, prop types, and Tailwind CSS class patterns were AI-assisted; UX decisions, layout design, and interaction flows were driven by team mockups. GitHub Copilot provided inline suggestions during active coding sessions.  
**Validation:** UI was tested manually in the browser across Chrome and Firefox. React Query integration and auth token handling were manually verified. Frontend Vitest test suite validates component rendering.

---

### 7. Frontend — TypeScript Types (`frontend/src/types/index.ts`)

**Tool:** Claude Code (Claude Sonnet 4)  
**Task:** Generating TypeScript interfaces that mirror the backend Pydantic response schemas.  
**Level of reliance:** Suggestion only — team provided the schema structure; AI formatted it as TypeScript interfaces and added JSDoc annotations.  
**Validation:** Verified with `npm run type-check` (zero errors required before merge).

---

### 8. Frontend — Test Suite (`frontend/src/test/`)

**Tool:** Claude Code (Claude Sonnet 4)  
**Task:** Writing Vitest unit tests for React components using jsdom, covering rendering, user interaction, and API mock patterns.  
**Level of reliance:** Partial generation — test case structure and mock patterns were AI-generated; assertions were tuned by the team to match actual component behaviour.  
**Validation:** Run with `npm test`; failures triggered team review and component corrections.

---

### 9. Android App (`app/`)

**Tool:** Claude Code (Claude Sonnet 4), GitHub Copilot  
**Task:** Generating ViewModel classes, Repository implementations, Retrofit API interface definitions, Jetpack Compose screen scaffolding, and Hilt DI module setup.  
**Level of reliance:** Partial generation — MVVM architecture, ViewModel–Repository patterns, and Compose composable structure were AI-assisted. Navigation logic, FCM push notification integration, and deep-link handling were implemented with AI support but required significant manual adjustment.  
**Validation:** Compiled with `./gradlew assembleDebug`; tested on Android emulators and physical devices. APK published as `apk/v0.9`.

---

### 10. Android — Unit Tests

**Tool:** Claude Code (Claude Sonnet 4)  
**Task:** Writing JUnit 4/5 unit tests for ViewModels using MockK and Coroutine test utilities.  
**Level of reliance:** Partial generation — test scaffolding and mock setup were AI-generated; team adjusted assertions to match actual ViewModel state transitions.  
**Validation:** Run with `./gradlew test`; failures were investigated and corrected.

---

### 11. Docker and CI/CD

**Tool:** Claude Code (Claude Sonnet 4)  
**Task:** Drafting `docker-compose.yml`, backend and frontend `Dockerfile`s, and the GitHub Actions workflow (`deploy-easypanel.yml`).  
**Level of reliance:** Suggestion only — team provided the deployment target (EasyPanel) and service topology; AI suggested multi-stage build patterns and environment variable structure.  
**Validation:** Deployment verified by observing successful CI runs on GitHub Actions and confirming the live application at `https://swe.gnahh5.easypanel.host`.

---

### 12. Final Project Report (LaTeX)

**Tool:** Claude Code (Claude Sonnet 4)  
**Task:** Structuring and writing the LaTeX final report, including chapter content for SRS, system design, API documentation, test results (coverage tables), use case/class/sequence TikZ diagrams, and the user/system manuals.  
**Level of reliance:** Partial generation — chapter outlines, table formatting, and TikZ diagram code were AI-generated; factual content (requirement text, API endpoint listing, coverage numbers, test results) was sourced directly from the codebase and verified by the team.  
**Validation:** All factual claims (coverage percentages, test counts, endpoint lists) were cross-checked against `pytest --cov` output and the live API `/docs` page. The SRS chapter was taken verbatim from the team-authored `reports/SRS.md`.

---

### 13. SRS Document (`reports/SRS.md`)

**Tool:** ChatGPT-4o  
**Task:** Suggesting IEEE 830 section structure and helping draft initial requirement statements during the design phase.  
**Level of reliance:** Suggestion only — requirement content (functional behaviour, acceptance criteria) was defined by the team; AI suggested phrasing and helped organize requirements into FR/NFR numbering scheme.  
**Validation:** SRS was reviewed across two team meetings; requirements were traced to implementation and verified complete in the Requirement Completion Status chapter of this report.

---

### 14. UML Diagrams

**Tool:** Claude Code (Claude Sonnet 4)  
**Task:** Generating TikZ LaTeX source for the Use Case diagram, Class diagram, and Service Exchange Sequence diagram embedded in Chapter 4 of the final report.  
**Level of reliance:** Major generation — TikZ code was fully AI-generated based on entity models and API routes explored in the repository. Actor roles, use case groupings, class fields, and sequence steps were provided by the team.  
**Validation:** Diagrams were reviewed by team members against the actual backend model files (`backend/app/models/`) and the SRS to ensure correctness of entities, relationships, and actor privileges.

---

### 15. Development Guidance Files (`AGENTS.md`, `CLAUDE.md`)

**Tool:** Claude Code (Claude Sonnet 4)  
**Task:** Writing structured guidance files used by the AI coding assistant during development sessions, documenting architecture patterns, testing conventions, and critical file locations.  
**Level of reliance:** Major generation — files were generated by Claude Code based on its understanding of the codebase, then reviewed and corrected by the team.  
**Validation:** Used throughout the project as living documentation; updated as architecture evolved.

---

## General Validation Practices

All AI-generated code was subject to the following before merging to `main`:

1. **Code review** — all PRs required at least one human team member review.
2. **Test execution** — backend `pytest`, frontend `npm test`, Android `./gradlew test` ran in CI.
3. **Type checking** — `npm run type-check` and `mypy`/Pydantic validation for backend schemas.
4. **Manual testing** — key user flows (service creation, handshake, transaction completion, TimeBank update) tested on the live deployment after each merge.
5. **Linting** — ESLint (frontend) and `flake8`/`ruff` (backend) enforced in CI.

No AI-generated output was merged without at least one of the above validation steps.
