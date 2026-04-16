
## Milestone Review

### Requirements

The following requirements from the SRS were addressed during Milestone 2. Full requirement definitions are in the [SRS Wiki Page](https://github.com/senaoz/SWE-574/wiki/SRS).

- **FR–18: Personalized Recommendation System** — Interest-tag matched and location-based service recommendations with cold-start fallback and onboarding prompt for new users.
- **FR–8: Tagging and Search** (FR–8.2, FR–8.3) — Dashboard filter bar supporting tag and city text search, date range, type, and sort; filter state persisted in URL parameters across back-navigation.
- **FR–6: Messaging System** (FR–6.1) — Group chat rooms auto-created on service activation, with profile picture display and links to sender profiles.
- **FR–16: User Interaction Features** (FR–16.1, FR–16.2) — Save/bookmark (heart button) on dashboard and home cards with live state sync; dedicated Saved Items section in user dashboard.
- **FR–10: Comment and Feedback System** (FR–10.8, FR–10.9) — Photo attachment for ratings (up to 3 images); dedicated Reviews section on profile page with photo thumbnails and gallery display.

---

### Deliverables

| Deliverable | Status |
|---|---|
| [Software Requirements Specification](https://github.com/senaoz/SWE-574/wiki/SRS) | Completed |
| [UML Diagrams](https://github.com/senaoz/SWE-574/wiki/UML-Diagrams) | Completed |
| [Scenarios & Mockups](https://github.com/senaoz/SWE-574/wiki/Scenarios-&-Mockups) | Completed |
| [Project Plan](https://github.com/senaoz/SWE-574/wiki) | Completed |
| [RACI](https://github.com/senaoz/SWE-574/wiki/Responsibility-Assignment-Matrix-(RACI)) | Completed |
| [Weekly Meeting Notes](https://github.com/senaoz/SWE-574/wiki/Meeting-Notes) | Completed |
| [Backend API (FastAPI + MongoDB)](https://backend-swe.gnahh5.easypanel.host/docs) | Completed |
| [Frontend Web App (React/TypeScript/Vite)](https://swe.gnahh5.easypanel.host/) | Completed |
| Android Mobile App (Kotlin/Jetpack Compose) — [#172](https://github.com/senaoz/SWE-574/pull/172), [#273](https://github.com/senaoz/SWE-574/pull/273) | Completed |
| Service recommendations engine — [#270](https://github.com/senaoz/SWE-574/pull/270) | Completed |
| Save / bookmark services — [#253](https://github.com/senaoz/SWE-574/pull/253) | Completed |
| Image upload for ratings — [#280](https://github.com/senaoz/SWE-574/pull/280) | Completed |
| Group chat rooms for active services — [#291](https://github.com/senaoz/SWE-574/pull/291) | Completed |
| Notifications (chat + service status) — [#290](https://github.com/senaoz/SWE-574/pull/290) | Completed |
| Forum upvote system — [#257](https://github.com/senaoz/SWE-574/pull/257) | Completed |
| Enriched map popups — [#307](https://github.com/senaoz/SWE-574/pull/307) | Completed |
| User reporting & admin review — [#163](https://github.com/senaoz/SWE-574/pull/163) | Completed |
| Timebank deduplication — [#91](https://github.com/senaoz/SWE-574/pull/91) | Completed |
| User profile reviews section — [#280](https://github.com/senaoz/SWE-574/pull/280) | Completed |
| Onboarding modal for new users — [#196](https://github.com/senaoz/SWE-574/pull/196) | Completed |
| Backend unit + integration tests (20 modules) — [#127](https://github.com/senaoz/SWE-574/pull/127) | Completed |
| Frontend component tests (13 modules, Vitest) — [#269](https://github.com/senaoz/SWE-574/pull/269) | Completed |
| CI: test job blocks deployment — [#218](https://github.com/senaoz/SWE-574/pull/218) | Completed |
| Persistent Docker volume for uploads — [#245](https://github.com/senaoz/SWE-574/pull/245) | Completed |
| ESLint + TypeScript strict checks in CI — [#242](https://github.com/senaoz/SWE-574/pull/242) | Completed |
| Pre-release v0.2.0-alpha | Completed |

---

### UX Design [New Parts Only]

The Hive Platform is a community time-banking domain where trust, transparency, and discoverability are central. UX decisions in this milestone were driven by these domain constraints.

**Service Cards**
Scheduled date/time appears directly on listing cards so users can assess availability without opening the detail page. The highest-priority badge is shown on the card to signal trustworthy providers at a glance. Creator names truncate with an ellipsis on overflow.

**Dashboard Recommendations**
The recommendations panel separates *For You* (interest-matched) from *Near You* (location-based fallback). New users with no interests see a guided prompt pointing them to the profile page — turning the cold-start gap into an onboarding moment. Filters persist across back-navigation so users are not forced to re-enter criteria.

**Map**
Emoji markers were replaced with SVG icons differentiated by offer (blue) and need (amber) type. Popups are enriched with provider rating, top badge, tags, and estimated duration — surfacing trust-relevant signals without requiring a page navigation.

**Ratings / Feedback**
Photo attachment lets users add richer, more authentic community feedback. A dedicated *Reviews* section on the profile page consolidates all incoming ratings with photo thumbnails, making reputation immediately visible to other users.

**Forum**
Markdown rendering (via Tailwind Typography) lets creators use headers, lists, bold, and links, matching the richness expected in a community knowledge-sharing space. Upvote counts give community members a signal of endorsed content.

**Group Chat**
When a service becomes active, a group chat room is created automatically, removing the friction of manually starting a conversation. Profile pictures appear in chat and link to the sender's profile, reinforcing trust and identity.

---

### API Documentation

Full interactive documentation: **[https://backend-swe.gnahh5.easypanel.host/docs](https://backend-swe.gnahh5.easypanel.host/docs)**

Representative examples of key endpoints added or changed in Milestone 2:

#### GET `/api/services/recommendations`
Returns personalized service recommendations for the authenticated user.

```
GET /api/services/recommendations
Authorization: Bearer <token>
```

```json
{
  "for_you": [
    {
      "_id": "661a2b3c4d5e6f7a8b9c0d1e",
      "title": "Python Tutoring",
      "service_type": "offer",
      "tags": [{"id": "Q28865", "label": "Python"}],
      "estimated_duration": 2,
      "location": {"city": "Istanbul"},
      "creator": {"name": "Ali Yılmaz", "avg_rating": 4.8}
    }
  ],
  "near_you": []
}
```

#### POST `/api/services/{service_id}/complete`
Completes a service, triggers timebank credit transfer, and unlocks ratings.

```
POST /api/services/661a2b3c.../complete
Authorization: Bearer <token>
```

```json
{
  "message": "Service marked as completed",
  "transaction_id": "661c4e5f6a7b8c9d0e1f2a3b"
}
```

#### POST `/api/ratings/`
Submit a rating with optional photo for a completed service (`multipart/form-data`).

```
POST /api/ratings/
Authorization: Bearer <token>

service_id=661a2b3c...
ratee_id=661d3e4f...
score=5
tags=["punctual","skilled"]
comment=Great experience!
image=<file>
```

```json
{
  "_id": "661e5f6a...",
  "score": 5,
  "tags": ["punctual", "skilled"],
  "image_urls": ["/uploads/ratings/661e5f6a_photo.jpg"]
}
```

#### GET `/api/services/{service_id}/potential-matches`
Returns services that could be matched with the given service based on tags and type.

#### GET `/api/users/profile`
Returns the authenticated user's profile including badge list, average rating, and timebank balance.

```json
{
  "name": "Elif Şahin",
  "avg_rating": 4.6,
  "badges": [{"key": "first_service", "display_name": "First Service", "priority": 1}],
  "timebank_balance": 12.5
}
```

---

### Testing

#### General Test Strategy

The project uses a layered testing strategy across all three clients:

- **Unit tests** — isolated tests for individual service-layer functions using mock MongoDB collections and mock auth tokens. Verify business logic (balance calculations, badge awarding, notification dispatch) without I/O.
- **Integration tests** — FastAPI `TestClient`-based tests exercising route handlers end-to-end against a mocked database. Verify HTTP contracts, status codes, and response schemas.
- **Frontend component tests** — Vitest + React Testing Library tests for UI components. Verify rendering correctness, user interactions (clicks, form submissions), and context behavior.
- **Mock data** — All backend tests use fixtures in `conftest.py`; frontend tests use `vi.mock()` for API calls. No real database or network calls are made in CI.
- **CI** — A dedicated test job runs before the deployment job in `deploy-easypanel.yml`, blocking deploys on test failures.

#### Backend Test Report

20 test modules covering all major service and API layers. Run with `cd backend && pytest --tb=short -q`.

| Module | Coverage Area |
|---|---|
| `test_auth_api.py` | Registration, login, OAuth flow |
| `test_auth_service.py` | Token generation, password hashing |
| `test_badge_service.py` | Badge award conditions and priority |
| `test_balance_controls.py` | Effective balance limit enforcement |
| `test_chat_service.py` | Room creation, message dispatch |
| `test_forum_service.py` | Discussion/event CRUD, upvotes |
| `test_join_request_service.py` | Request lifecycle, provider/requester assignment |
| `test_notification_api.py` | Notification endpoint contracts |
| `test_notification_service.py` | Notification creation logic |
| `test_rating_service.py` | Rating creation, duplicate prevention |
| `test_report_service.py` | Report submission and status transitions |
| `test_security.py` | JWT validation, permission checks |
| `test_service_service.py` | Service CRUD, expiry, match logic |
| `test_services_api.py` | REST contracts for service endpoints |
| `test_timebank_dedup.py` | Deduplication of transaction records |
| `test_transaction_service.py` | Credit/debit calculations |
| `test_upload_api.py` | File validation, storage paths |
| `test_user_service.py` | Profile update, search, role management |
| `test_wikidata.py` | WikiData tag resolution |

#### Frontend Test Report

13 test modules (Vitest + React Testing Library). Run with `cd frontend && npm run test`.

| Module | Coverage Area |
|---|---|
| `LoginForm.test.tsx` | Form validation and submit |
| `RegisterForm.test.tsx` | Registration field validation |
| `ProtectedRoute.test.tsx` | Redirect when unauthenticated |
| `GuestOnlyRoute.test.tsx` | Redirect when already authenticated |
| `OfferNeedForm.test.tsx` | Service creation form |
| `EditServiceDialog.test.tsx` | Service edit dialog |
| `CommentSection.test.tsx` | Comment rendering and submission |
| `DashboardFilterBar.test.tsx` | Filter controls and state |
| `RatingStars.test.tsx` | Star rating interaction |
| `SearchBar.test.tsx` | Search input and autocomplete |
| `UserContext.test.tsx` | Auth context state management |
| `useSavedServiceIds.test.tsx` | Custom hook for saved service IDs |
| `dashboardFilterSearchParams.test.ts` | URL param serialization for filters |

---

### Standards

| Standard | Description & Example |
|---|---|
| **OpenAPI 3.1** (FastAPI auto-generation) | All REST endpoints are documented with request/response schemas, authentication requirements, and example values. Available interactively at [Backend API Docs](https://backend-swe.gnahh5.easypanel.host/docs). |
| **JWT / RFC 7519** | Access tokens are HS256-signed JWTs with a 30-minute expiry, transmitted as Bearer tokens in the `Authorization` header. |
| **WikiData (wikidata.org)** | Service and forum tags are resolved against the WikiData knowledge graph. Users see auto-complete suggestions drawn from real-world entity labels (e.g. Q28865 → "Python"). |
| **GeoJSON / MongoDB 2dsphere** | Service locations are stored as GeoJSON `Point` objects. Geospatial queries use MongoDB `$near` / `$geoWithin` operators on a 2dsphere index. |
| **CommonMark Markdown** | Forum discussions, event descriptions, and service descriptions render via the Tailwind Typography plugin, following the CommonMark specification. |
| **WCAG 2.1 AA (partial)** | Radix UI primitives used for dialogs, dropdowns, and interactive elements provide keyboard navigation and ARIA attributes. |

---

### Planning and Team Process

#### Changes Since Milestone 1

| Change | Impact |
|---|---|
| ESLint added to frontend | Caught style and type issues before code review, reducing nitpick comments in PRs. |
| TypeScript strict checks (`tsc --noEmit`) in CI | Eliminated silent `any` propagation that caused runtime bugs in M1. |
| Vitest integrated for frontend | Frontend testing was absent in M1. Coverage tooling added. Test job now blocks deployment. |
| Persistent Docker volume for uploads | Profile and service images were lost on every redeploy in M1 (ephemeral storage). Fixed by adding a named volume in `docker-compose.yml`. |

#### Plan for Completing the Project

1. **Android feature parity** — Forum browsing, notifications, and chat on mobile.
2. **End-to-end test coverage** — Critical flows: registration → post service → join request → complete → rate.
3. **Performance** — Pagination and index tuning for services and notifications collections.
4. **Final documentation** — Update UML diagrams and SRS to reflect the implemented state.

---

### Evaluation

#### Customer Feedback Summary

From the Milestone 1 demo:

- The time-banking credit model and balance enforcement rules were well received.
- The map view needed richer service information before requiring a page open — addressed with enriched popups in M2.
- Forum upvoting was requested so community members can surface quality content — implemented.
- Recommendations were flagged as a priority feature — delivered with interest-matching and location-based fallback.
- Feedback photos were requested to increase trust in ratings — implemented.

#### Reflection

All planned M2 features were implemented and deployed to the live environment. The main structural gap from M1 — zero frontend test coverage — was closed by integrating Vitest and adding 13 component test modules. Backend tests grew from 12 to 20 modules. The CI pipeline now enforces tests before deployment, eliminating the "works locally, breaks in production" incidents seen in M1.

The persistent uploads volume fix had an outsized positive impact on demo quality: user profile pictures and service images now survive redeployments, which was a visible credibility issue in M1.

Android parity is partially complete (service creation and ratings implemented; forum and in-app notifications are scoped for M3).

---

### Individual Contributions

#### Ayşenur Ünal
* Offer post creation & transaction fixes #145, #146
* Unit tests for ChatService, TransactionService & image upload API #136, #142
* Recommendation posts in post detail page #194
* "For You" filter with tightened interest matching #208, #255
* Dashboard recommendations, sorting & filter persistence #215, #256
* Save (heart) button for posts & stale state fix #240, #252, #253
* Cold-start recommendation fallback & interests guidance #270
* Frontend type-check error fixes #241

#### Kenan Altunbaş
* Badge display names & priority display #157, #184
* Navigate to user profile on attendee avatar click #168
* 10-hour balance limit enforcement #220
* Feedback tag selection limit (max 5) & creator name overflow fix #249, #258
* Comment profile navigation fix #248
* SVG map markers & enriched map popups #299, #307, #310
* Event attendance, attendee avatars & rich map popups #318
* Chores: `.gitattributes` for line ending normalization #214

#### Yusuf Savaş
* Service creation workflow for mobile #172
* Separate profile edit page with rating info & UI improvements #247
* Photo upload for ratings & multiple rating fix on mobile #273
* Service cards, filters & icon updates on map #295
* Participant acceptiance fixes #234
* Implemantaion of profile edit for mobile #181

#### Sena Oz
* Markdown rendering with Tailwind Typography plugin #153
* Reporting system #163
* User role management for authentication #169
* Server-side search, autocomplete & geolocation format support #185, #189
* Onboarding modal for new users & search bar improvements #196
* Notifications (web & mobile) #211, #233
* Group chat & group chat rooms for active services #219, #291
* Upvote functionality for discussions & events #257
* ReviewCard component & rating image persistence #280, #309
* Notification types for chat messages & service status updates #290
* Services summary, data fetching refactor & edit/delete for forum posts #292, #294, #312
* Images in comments & events page sorting #315
* Testing infrastructure: Vitest, CI/CD, unit & integration tests #218, #243, #269, #313


---

**Full Changelog**: https://github.com/senaoz/SWE-574/compare/customer-milestone-1...customer-milestone-2