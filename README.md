# SWE 574: Software Development as A Team - Spring 2026

## The Hive Platform

A community-oriented **time-bank service exchange platform** built for the **SWE 574** course at **Boğaziçi University (Spring 2026)**.

The Hive is built around the idea that everyone has something valuable to offer. Users list services they can provide — tutoring, home repairs, language lessons, cooking — and earn **time credits** for each hour they spend helping others. Those credits can then be spent to receive services in return, creating a self-sustaining community economy where time, not money, is the currency.

### Core Features

- **Time Bank** — Earn and spend time credits by offering and requesting services. Transactions are tracked and enforced automatically.
- **Services Dashboard** — Browse, filter, and search community services with geolocation support. Services are tagged using WikiData entities for semantic discoverability.
- **Requests to get or give a service** — Request to join a service, agree on a time, and confirm completion to trigger automatic credit transfer.
- **Forum** — Create discussions and events. Members can comment, react, and attach photos. Events include time and location.
- **Community Groups** — Users can form and join communities around shared interests, with dedicated posts and moderation tools.
- **Real-time Chat** — Direct messaging between users with chat room support.
- **Ratings & Reviews** — Rate service providers after each completed exchange to build reputation.
- **Badges & Gamification** — Users earn badges based on participation and contribution milestones.
- **Admin & Moderation Panel** — Admins and moderators can manage users, review reported content, and handle bans. Automated profanity filtering runs on all user-generated content.
- **Notifications** — In-app notifications for join requests, messages, ratings, and system events.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Radix UI, React Query |
| Backend | Python, FastAPI, Motor (async MongoDB driver) |
| Database | MongoDB 7 with geospatial indexes |
| Mobile | Android (Kotlin, Jetpack Compose, MVVM) |
| Auth | JWT (HS256), role-based access control (user / moderator / admin / banned) |
| DevOps | Docker Compose, GitHub Actions, Easypanel |

### Live Deployment

- Live Application: [https://swe.gnahh5.easypanel.host](https://swe.gnahh5.easypanel.host)
- Backend API Docs: [https://backend-swe.gnahh5.easypanel.host/docs](https://backend-swe.gnahh5.easypanel.host/docs)

#### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | <tazeyta@gmail.com> | Password123 |
| User | <mehmet.demir@example.com> | Password123 |

### Documentations

| Resource | URL |
|----------|-----|
| Final Report | [https://github.com/senaoz/SWE-574/blob/main/final-deliverables/SWE574_Group3_Final_Project_Report.pdf](https://github.com/senaoz/SWE-574/blob/main/final-deliverables/SWE574_Group3_Final_Project_Report.pdf) |
| Final Deliverables Folder | [https://github.com/senaoz/SWE-574/blob/main/final-deliverables](https://github.com/senaoz/SWE-574/blob/main/final-deliverables) |
| Individual Contributions | [https://github.com/senaoz/SWE-574/blob/main/final-deliverables/individual_contributions.md](https://github.com/senaoz/SWE-574/blob/main/final-deliverables/individual_contributions.md) |
| Wiki | [https://github.com/senaoz/SWE-574/wiki](https://github.com/senaoz/SWE-574/wiki) |
| AI Use Declaration | [https://github.com/senaoz/SWE-574/blob/main/AI_USAGE.md](https://github.com/senaoz/SWE-574/blob/main/AI_USAGE.md) |
| Testing Coverage - Codecov | [https://app.codecov.io/gh/senaoz/SWE-574/tree/main](https://app.codecov.io/gh/senaoz/SWE-574/tree/main) |
| UML Diagrams | [https://github.com/senaoz/SWE-574/wiki/UML-Diagrams](https://github.com/senaoz/SWE-574/wiki/UML-Diagrams) |
| GitHub Actions | [https://github.com/senaoz/SWE-574/actions](https://github.com/senaoz/SWE-574/actions) |

-------

## Quick Start

```bash
docker compose up -d --build
```

| Service  | Port  | URL |
|----------|-------|-----|
| Frontend | 80    | <http://localhost> |
| Backend  | 8000  | <http://localhost:8000> |
| API Docs | 8000  | <http://localhost:8000/docs> |

See [`backend/README.md`](backend/README.md) for local development setup and CI/CD details.
See [`frontend/`](https://github.com/senaoz/SWE-574/tree/main/frontend) for the React web app setup and development guide.

-------

## Milestones

- 9 March 2026: Milestone 1 - [Milestone 1 Deliverables](https://github.com/senaoz/SWE-574/blob/main/reports/m1_group3.md)
- 13 April 2026: Milestone 2 - [Milestone 2 Deliverables](https://github.com/senaoz/SWE-574/blob/main/reports/m2_group3.md)

## Wiki Details

- [Repository Rules](https://github.com/senaoz/SWE-574/wiki/Repository-Rules)
- [Elicitation Questions](https://github.com/senaoz/SWE-574/wiki/Elicitation-Questions)
- [Software Requirements Specification](https://github.com/senaoz/SWE-574/wiki/SRS)
- [Software Design (UML Diagrams)](https://github.com/senaoz/SWE-574/wiki/UML-Diagrams)
- [Scenarios and Mockups](https://github.com/senaoz/SWE-574/wiki/Scenarios-&-Mockups)
- [Project Plan](https://github.com/senaoz/SWE-574/wiki)
- [Communication Plan](https://github.com/senaoz/SWE-574/wiki/Communication-Plan)
- [Responsibility Assignment Matrix (RACI)](https://github.com/senaoz/SWE-574/wiki/Responsibility-Assignment-Matrix-(RACI))
- [Weekly Reports and Additional Meeting Notes](https://github.com/senaoz/SWE-574/wiki/Meeting-Notes)
