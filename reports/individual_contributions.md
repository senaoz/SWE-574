# Individual Contributions
## The Hive Platform
**Course:** SWE 574 — Software Development Practice, Spring 2026  
**Team:** Ayşenur Ünal · Sena Öz · Kenan Altunbaş · Yusuf Savaş  
**Repository:** https://github.com/senaoz/SWE-574

---

## Ayşenur Ünal

The personalised recommendation system, service-match notification feature, moderator pinning system, community member visibility improvements, and save/bookmark feature were implemented. The test strategy was led across all three layers of the stack (backend, frontend, Android), with active participation in code review and bug triage throughout the project.

---

### Coding Contributions

#### Recommendation System (Web)
- The Dashboard "For You" section was built with pagination, interest + location matching, and cold-start fallback for new users (FR-14)
- A hover tooltip was added to recommendation cards to explain why a service was surfaced
- Filter state was preserved after back-navigation; interest matching was tightened to reduce over-broad results
- Recommendation algorithm mismatches were identified and corrected

**Key commits:** `ebc3326` `c8e8b05` `9a6fc90` `fca8308` `23e47da`  
**Related PRs:** [#252](https://github.com/senaoz/SWE-574/pull/252) [#253](https://github.com/senaoz/SWE-574/pull/253)

#### Service Match Notification (Backend + Frontend)
- A background service was implemented to notify users when a newly posted service matches their saved interests or open Need posts (FR-9)
- The flow was implemented end-to-end: backend trigger → notification record → frontend badge update

**Key commits:** `6be87f0` `b0524cd`  
**Related PR:** [#433](https://github.com/senaoz/SWE-574/pull/433)

#### Moderator Pinning (Web)
- Pinning controls were added for moderators and admins across posts, communities, discussions, and events (FR-12)
- A two-pin-per-category server-side limit was enforced with client-side tooltip feedback

**Key commits:** `de9f6a5` `e1304f7`  
**Related PR:** [#409](https://github.com/senaoz/SWE-574/pull/409)

#### Community Member Visibility
- Member count, avatar row, and "Show all members" modal were added to community pages
- Community banners and related event cards were surfaced on community profiles

**Key commits:** `43eefe6` `5bddceb` `37bd06a`  
**Related PRs:** [#376](https://github.com/senaoz/SWE-574/pull/376) [#378](https://github.com/senaoz/SWE-574/pull/378)

#### Save / Bookmark and Dashboard UX
- A save (heart) button was added to Dashboard and Home listing cards; stale save/unsave state across navigations was fixed
- A sort filter was added to the Dashboard (newest to oldest, etc.)

**Key commits:** `6320188` `89a5ccd` `1da154b`  
**Related PRs:** [#252](https://github.com/senaoz/SWE-574/pull/252) [#253](https://github.com/senaoz/SWE-574/pull/253)

#### Test Suite (All Layers)
- **Backend:** unit tests were written for `ChatService`, `TransactionService`, upload API, duplicate transaction prevention, badge regression, and reports/communities/wikidata coverage
- **Frontend:** multiple Vitest improvement passes were completed; local test suite blockers were resolved
- **Android:** mobile unit tests were added

**Key commits:** `18fd546` `be81fe3` `4e58339` `cb2f5b8` `f17f69a` `62c258f` `1b14765` `8174f23` `099ba66` `4f9383b` `76d76f2`  
**Related PRs:** [#136](https://github.com/senaoz/SWE-574/pull/136) [#377](https://github.com/senaoz/SWE-574/pull/377) [#449](https://github.com/senaoz/SWE-574/pull/449) [#452](https://github.com/senaoz/SWE-574/pull/452) [#454](https://github.com/senaoz/SWE-574/pull/454)

---

### Challenges
- **Recommendation cold-start** — users with no history had no results; a location-based fallback was introduced, requiring a separate API call and a merge strategy for the two result sets
- **Stale save state** — the heart button went out of sync across navigations; React Query cache invalidation at the correct query key granularity was required
- **Test ordering in CI** — mongomock fixture teardown order caused intermittent failures in parallel test runs; fixture scope and teardown sequencing were adjusted

---

## Sena Öz

The backend service layer and React web frontend were owned throughout all milestones. Core areas covered include the exchange flow (TimeBank, transactions, join requests), forum and community modules, rating and badge system, and moderator tooling on the web client. The CI/CD pipeline and test infrastructure were also set up for both backend and frontend.

---

### Coding Contributions

#### Backend — Service and API Layer
- The TimeBank credit system was implemented: 3h starting balance, 10h cap, dual-confirmation flow, anti-hoarding enforcement (FR-7.7)
- 15 backend service classes were built covering auth, user, service, transaction, join request, chat, comment, forum, community, rating, report, notification, badge, wikidata, and content moderation
- Email verification and transactional notification emails were added (`notification_service.py`)
- RBAC was enforced via the `require_moderator_or_admin` dependency; moderator/admin permissions were expanded across all routes
- An ObjectId / string ID mismatch in the transaction service was identified and fixed (`0de5643`)

**Key commits:** `3268753` `f1f3844` `def0d0c` `2c5ec1c` `1be1e29` `0de5643`  
**Related PRs:** [#47](https://github.com/senaoz/SWE-574/pull/47) [#54](https://github.com/senaoz/SWE-574/pull/54) [#56](https://github.com/senaoz/SWE-574/pull/56) [#61](https://github.com/senaoz/SWE-574/pull/61)

#### React Frontend
- Dashboard was built with a service grid, floating action button, Leaflet map with distance filters, stats section, and activity chart
- ServiceDetail, Profile (interests, ratings, badges, social links), Forum (discussions, events, Markdown rendering), and Community pages were implemented
- Google Maps was replaced with Leaflet; geolocation was embedded in the service creation form
- Moderator edit for discussions and events with image upload was added (PRs [#450](https://github.com/senaoz/SWE-574/pull/450), [#451](https://github.com/senaoz/SWE-574/pull/451))
- Pin tooltip enforcement with a 2-pin-per-category limit was implemented (`5ce457c`)
- Remote service support (`is_remote` field) was added across the form, listing card, and detail page

**Key commits:** `235308e` `aa6dff9` `b85a5fc` `475ef27` `8206d77` `5ce457c`  
**Related PRs:** [#49](https://github.com/senaoz/SWE-574/pull/49) [#51](https://github.com/senaoz/SWE-574/pull/51) [#450](https://github.com/senaoz/SWE-574/pull/450) [#451](https://github.com/senaoz/SWE-574/pull/451)

#### CI/CD and Test Infrastructure
- `docker-compose.yml`, backend/frontend `Dockerfile`s, and the GitHub Actions deploy workflow were authored
- Codecov integration was added for backend (`pytest --cov`) and frontend (Vitest) coverage reporting (PR [#429](https://github.com/senaoz/SWE-574/pull/429))
- A 307-test integration and unit suite across 36 frontend files was added (PR [#440](https://github.com/senaoz/SWE-574/pull/440))
- Additional backend test coverage was added for remaining modules (PR [#449](https://github.com/senaoz/SWE-574/pull/449))

---

### Challenges
- **TimeBank anti-hoarding enforcement** — the backend guard and frontend prompt had to be coordinated without breaking existing exchange flows across all edge cases
- **MongoDB ObjectId / string ID mismatch** — query paths in the transaction service returned inconsistent results depending on ID type; fixed in `0de5643`
- **Test harness 422 vs 401** — mongomock validates request bodies before the auth check, causing 17 known test failures; the discrepancy was documented rather than masked

---

## Kenan Altunbaş

106 issues were opened covering web and mobile bugs, missing features, and test cases, making this the primary testing and bug-reporting role on the project. On the code side, shared UI components were developed for both web and Android: the service status bar, capacity warnings, bee location marker, Near Me button, community features on Android, badge additions, map UI improvements, and TimeBank balance enforcement.

---

### Coding Contributions

#### Service Status Bar (Web + Android)
- A full lifecycle step indicator was implemented (Pending → Accepted → In Progress → Completed / Cancelled / Expired) on both platforms
- Correct highlighting for the completed step was added; distinct colour coding was applied for cancelled and expired states

**Key commits:** `b6e6ded` `ca5e54a` `6fcabb7`  
**Related PR:** [#431](https://github.com/senaoz/SWE-574/pull/431)

#### Service Capacity Warning (Web + Android)
- A visual warning banner was added to listing cards and detail pages when a service is near or at its participant limit (FR-2.3)

**Key commit:** `8e718ec`  
**Related issue:** [#326](https://github.com/senaoz/SWE-574/issues/326)

#### Bee Location Marker (Web + Android)
- A bee-shaped SVG icon was added to the Leaflet map (web) and Google Maps (Android) to mark the authenticated user's position

**Key commit:** `9cb778f`  
**Related PR:** [#442](https://github.com/senaoz/SWE-574/pull/442) · Issue [#441](https://github.com/senaoz/SWE-574/issues/441)

#### Near Me Button (Web)
- A map control button was added to recentre the view on the browser's current geolocation

**Key commit:** `31c2e31`  
**Related PR:** [#432](https://github.com/senaoz/SWE-574/pull/432) · Issue [#407](https://github.com/senaoz/SWE-574/issues/407)

#### Community Feature (Android)
- A Communities tab and community detail screen were built (banner, members, posts, events, no-community label)
- Community membership was surfaced on user profiles with a mutual "common community" badge; communities were made clickable
- Accidentally deleted backend endpoints were restored after a merge conflict (`05eb55d`)

**Key commits:** `d908e9f` `facd436` `3e5f971` `16ac127` `05eb55d`  
**Related PRs:** [#446](https://github.com/senaoz/SWE-574/pull/446) [#447](https://github.com/senaoz/SWE-574/pull/447) · Issues [#337](https://github.com/senaoz/SWE-574/issues/337) [#444](https://github.com/senaoz/SWE-574/issues/444)

#### Mobile Navigation Refactor
- Android bottom navigation was refactored to the `BottomNav` + `NavHost` pattern; navbar overlap on detail screens was fixed

**Key commit:** `2f18235`  
**Related issue:** [#335](https://github.com/senaoz/SWE-574/issues/335)

#### TimeBank Balance Enforcement (Backend)
- Effective balance limit checks were added using worst-case pending calculations to prevent manipulation via concurrent requests (`dd39acf` `81dd4f0`)
- TimeBank limit error handling and debug logging were improved (`1094ead`)

#### Badge System and Map UI
- 6 new achievement badges were added; a search bar overlap on the map list view was fixed (`c956d6e` · issue [#362](https://github.com/senaoz/SWE-574/issues/362))
- Rich map popups were introduced with provider info, rating, tags, and date; a compact popup layout with inline tags and priority badge was applied
- Scheduled date/time was added to listing cards; emoji markers were replaced with SVG icons

**Key commits:** `df7d27e` `47dbd18` `fcc3e90` `0a3b1e1` `c52317d`  
**Related issues:** [#316](https://github.com/senaoz/SWE-574/issues/316) [#317](https://github.com/senaoz/SWE-574/issues/317) [#306](https://github.com/senaoz/SWE-574/issues/306)

#### Bug Fixes
- The expiry checker for specific-date services was corrected; the Dashboard was updated to show only active/upcoming services (`13a2b61` · issue [#436](https://github.com/senaoz/SWE-574/issues/436))
- Edit/delete controls for own comments were added to the web client (`4bf3852` · issue [#412](https://github.com/senaoz/SWE-574/issues/412))
- Comment username clicks were fixed to navigate to the correct user profile (`aadca4b`)
- Remote services being filterable by distance was identified and fixed (issue [#406](https://github.com/senaoz/SWE-574/issues/406))

---

### Challenges
- **Merge conflict deleted endpoints** — a rebase silently dropped routes from `users.py`; the regression only surfaced in production and was diagnosed and fixed in `05eb55d`
- **ServiceStatusBar step index** — an off-by-one in the step array mapping between the backend transaction state enum and the UI required careful enumeration of all state transitions
- **Android nav graph with community detail** — a new destination had to be integrated into the existing `NavHost` without breaking deep-link navigation from push notifications

---

## Yusuf Savaş

The Android mobile application was developed as the primary platform responsibility. The full chat system, recommendation screen, similar services panel, community creation flows, forum event image uploads, and multiple rounds of layout and padding fixes were implemented. The Android GitHub Actions workflow was authored, OpenAPI documentation was maintained, and app versioning was managed throughout the project.

---

### Coding Contributions

#### Chat System (Android)
- A full chat feature was built: user search, room creation, message previews, read receipts, and unread message count (FR-6)
- Group chat was added for all accepted participants in `ManageServiceScreen`
- Pull-to-refresh was implemented in `ManageServiceScreen`
- UI state was reset on chat room start to prevent stale navigation
- Safe-area inset and keyboard avoidance were fixed in `ChatRoomScreen` and `ChatScreen`

**Key commits:** `416b43f` `7621798` `ff4e15d` `ae39eaa` `247a3d0` `031d6a4` `5d6adca` `6851a11`  
**Related PR:** [#417](https://github.com/senaoz/SWE-574/pull/417) · Issues [#351](https://github.com/senaoz/SWE-574/issues/351) [#398](https://github.com/senaoz/SWE-574/issues/398) [#399](https://github.com/senaoz/SWE-574/issues/399)

#### Recommendation Screen (Android)
- The `RecommendationScreen` composable was built with pull-to-refresh, loading skeleton, and a reason tag label (FR-14)
- The `GET /services/recommendations` endpoint was integrated and also wired into `MapScreen`

**Key commits:** `7d4c5ca` `f204f02` `c771604`  
**Related PR:** [#439](https://github.com/senaoz/SWE-574/pull/439) · Issue [#358](https://github.com/senaoz/SWE-574/issues/358)

#### Similar Services Panel (Android)
- A horizontal scroll list of tag-matched services was added at the bottom of `ServiceDetailScreen`

**Key commit:** `aa2dea2`

#### Community Creation and Display (Android)
- Discussion, event, and community creation sheets were integrated into `MainScaffold` and `ForumViewModel`
- Cover image and avatar image support were added to community creation
- Community selection was added to discussion and event creation screens
- The `ProfileScreen` communities section and ViewModel integration were implemented; `CommunityDetailScreen` layout was completed

**Key commits:** `dedf152` `495256e` `50e305c` `c4aa18c` `b1ff860` `6a3a90c`  
**Related PR:** [#353](https://github.com/senaoz/SWE-574/pull/353)

#### Community Events (Android)
- Community events API integration was built: events list tab on the community detail screen, event cards, Repository and ViewModel layer
- `getCommunityEvents` was mocked in `CommunityRepositoryTest`

**Key commits:** `3b0c0e5` `5b13653`

#### Forum Event Image Upload (Android)
- Banner image upload was added when creating or editing forum events; the `ForumEvent` DTO was updated to include `image_urls` and `banner_image_url`

**Key commit:** `4deb9b7`  
**Related issue:** [#386](https://github.com/senaoz/SWE-574/issues/386)

#### FilterSummaryChip and MapScreen Refactor
- `FilterSummaryChip` was made clickable to open the filter bottom sheet directly from the map view
- `DiscoverScreen` was decoupled from `MapScreen`; the unused `UserLocationPulseOverlay` was removed

**Key commit:** `9b3ea5b`

#### User Experience Details (Android)
- An owner label for own comments was added to `ServiceDetailScreen` (`2117106` · issue [#397](https://github.com/senaoz/SWE-574/issues/397))
- User profile picture / initials were added to participant display in `ServiceDetailScreen` (`dc3e206` · issue [#400](https://github.com/senaoz/SWE-574/issues/400))
- An image preview dialog with a horizontal pager was added for rating images in `UserRatingsScreen` (`4f5458c` · issue [#276](https://github.com/senaoz/SWE-574/issues/276))
- Profile pictures were added to `ServiceCompletionRow` (`2032f0d`)
- Cancel join request functionality was added to `ServiceDetailScreen` (`e414db5`)
- Cancelled/expired services and events were filtered out from the map view (`9d3759a`)
- Tag selection UI in `CreateServiceScreen` was refactored for improved visual consistency (`5cac621`)

#### Android CI/CD
- A GitHub Actions workflow was built to compile and upload APK artifacts on every push to `main`

**Key commits:** `346a373` `4cc54ec` `e300wb1`  
**Related issue:** [#347](https://github.com/senaoz/SWE-574/issues/347)

---

### Challenges
- **Android safe-area / keyboard avoidance** — the message input bar was obscured by the system navigation bar on specific Android configurations; `WindowInsets` + `imePadding` modifiers had to be applied at the correct layout level
- **Horizontal pager recomposition** — `rememberPagerState` index was reset on async image load, causing flicker; loading was deferred until the pager became visible
- **MapScreen decoupling** — `DiscoverScreen` had grown tightly coupled to `MapScreen`'s ViewModel; shared state had to be promoted to a nav-graph-scoped ViewModel to separate them
