# Individual Contributions
## The Hive Platform
**Course:** SWE 574 — Software Development Practice, Spring 2026  
**Team:** Ayşenur Ünal · Sena Öz · Kenan Altunbaş · Yusuf Savaş  
**Repository:** https://github.com/senaoz/SWE-574

---

## [Ayşenur Ünal](https://github.com/aysenurunal)

## Executive Summary

I contributed across the backend, React web frontend, and Android test layers, with a strong focus on recommendation quality, dashboard usability, moderation workflows, community visibility, notifications, and test coverage. My largest feature contribution was the personalised recommendation system on the web dashboard, including pagination, interest/location matching, cold-start fallback, and explainability tooltips. I also implemented the save/bookmark flow, service-match notifications, moderator pinning across multiple content types, and community member visibility improvements. In parallel, I led a major quality push by adding and improving backend, frontend, and Android unit tests, fixing local test blockers, and participating actively in code review, merge integration, and bug triage.

---

## Code Contributions

### 1. Personalised Recommendation System (Web + Backend)

I implemented the Dashboard “For You” recommendation experience, making service discovery more personalised and useful for each user. Related requirement: FR-14.

- Added recommendation-related backend support for service posts and surfaced recommended services on the Dashboard
- Built the “For You” section with pagination and active offer/need matching
- Implemented interest-based matching and later tightened the algorithm to avoid over-broad recommendations
- Added location-based cold-start fallback for users with limited profile or activity history
- Added profile guidance so users understand when missing interests/location reduce recommendation quality
- Added hover tooltips to recommendation cards explaining why a service was recommended
- Preserved Dashboard filter state after back-navigation to avoid losing user context

**Key commits:** `df7bb88` `bdd17c7` `ebc3326` `23e47da` `fca8308` `c8e8b05` `9a6fc90`  
**Related PRs:** [#252](https://github.com/senaoz/SWE-574/pull/252) [#253](https://github.com/senaoz/SWE-574/pull/253)

---

### 2. Save / Bookmark Flow and Dashboard UX

I implemented the save/bookmark interaction for service cards and improved Dashboard filtering and sorting usability.

- Added the save/heart button to Dashboard and Home listing cards
- Wired saved service state through backend API, service model, and frontend card state
- Fixed stale save/unsave state across Dashboard, Home, My Services, and Profile navigation
- Introduced React Query cache invalidation at the correct saved-service query granularity
- Added Dashboard sorting support such as newest-to-oldest ordering
- Fixed Dashboard filter persistence after navigating away and returning

**Key commits:** `473556f` `6320188` `1da154b` `46a8ae8` `89a5ccd` `fca8308`  
**Related PRs:** [#252](https://github.com/senaoz/SWE-574/pull/252) [#253](https://github.com/senaoz/SWE-574/pull/253)

---

### 3. Service Match Notification Feature (Backend + Frontend Contract)

I implemented the notification flow that alerts users when a newly created service matches their saved interests or open Need posts. Related requirement: FR-9.

- Added backend matching logic when new service posts are created
- Created notification records for users whose interests or Needs match the new post
- Extended the notification model/types to support service-match notifications
- Connected the backend trigger to the frontend notification contract so the notification badge can reflect new matches
- Added backend tests for the matching and notification behavior

**Key commits:** `6be87f0` `b0524cd`  
**Related PR:** [#433](https://github.com/senaoz/SWE-574/pull/433)

---

### 4. Moderator Pinning System (Backend + Web + Android API Support)

I implemented moderator/admin pinning across several platform content types. Related requirement: FR-12.

- Added pin/unpin support for service posts, communities, forum discussions, and events
- Enforced a two-pin-per-category limit on the backend
- Added client-side moderator/admin controls and disabled-state feedback
- Added tooltip feedback explaining why a moderator cannot pin more content when the limit is reached
- Extended backend models, services, and API routes for pinned content
- Updated Android API DTOs and repositories so mobile clients can consume pinned-state data
- Added backend tests for pinning behavior and service API coverage

**Key commits:** `de9f6a5` `e1304f7`  
**Related PR:** [#409](https://github.com/senaoz/SWE-574/pull/409)

---

### 5. Community Member Visibility and Profile Enhancements

I improved community pages and profile-community visibility so users can better understand who belongs to a community and what activity is connected to it.

- Added member count and avatar row to community detail pages
- Added “Show all members” modal for browsing community members
- Improved community banners and image visibility
- Surfaced community membership on user profiles and user detail pages
- Added related event cards to community/profile views
- Updated backend community/user APIs and models to support the new community display data
- Added community service/API tests for the new behavior

**Key commits:** `43eefe6` `c41b80b` `37bd06a` `5bddceb`  
**Related PRs:** [#376](https://github.com/senaoz/SWE-574/pull/376) [#378](https://github.com/senaoz/SWE-574/pull/378)

---

### 6. Content Moderation and Service Flow Fixes

I contributed backend and frontend fixes around service creation, transaction correctness, and user-generated content quality.

- Added profanity/content moderation checks around service-related user-generated text flows
- Updated shared moderation-related backend services
- Fixed offer post creation issues in the frontend service form
- Fixed transaction handling for Need posts in the join request flow
- Resolved frontend type-check errors across auth, forms, layout, comments, forum, profile, and Wikidata-related code

**Key commits:** `896ee46` `6b65543` `fadc61f` `4484310`

---

### 7. Map and Event UX Fixes

I contributed fixes to event/map behavior and profile navigation from event attendance surfaces.

- Fixed map event filtering logic
- Ensured cancelled or inactive event/service data was handled correctly in the map utility layer
- Fixed attendee profile links from event detail views
- Added frontend utility tests for map event behavior

**Key commit:** `75cf9ca`

---

### 8. Test Suite and Quality Engineering (Backend + Frontend + Android)

I led a broad test coverage effort across all three layers of the project.

**Backend**
- Added unit tests for `ChatService`, covering room creation, participant authorization, duplicate/existing room behavior, and soft-delete behavior
- Added unit tests for `TransactionService`
- Added duplicate transaction and repeated finalization regression tests
- Added upload API tests
- Added badge regression coverage
- Added backend API tests for admin, chat, comments, forum, join requests, ratings, transactions, upload, and users
- Added backend coverage for reports, communities, and Wikidata
- Fixed local backend/frontend test blockers

**Frontend**
- Added and improved Vitest coverage across major components and pages
- Covered Dashboard, Home, Forum, Profile, Settings, UserDetail, ServiceDetail, My Services, Saved Services, Chat, Admin Panel, Notification Bell, Service Status Bar, OfferListingCard, Applicant lists, modals, Markdown editor, tag autocomplete, and Wikidata services
- Fixed frontend type-check and test setup issues blocking the local suite

**Android**
- Added mobile unit tests for DTOs, repositories, notification/community/Wikidata flows, badge utilities, format utilities, and service completion rating arguments

**Key commits:** `2c40cc8` `2b3272d` `c273de7` `c47b83f` `495e006` `4e58339` `45d5600` `be81fe3` `cb2f5b8` `76d76f2` `18fd546` `f17f69a` `62c258f` `1b14765` `8174f23` `099ba66` `4f9383b`  
**Related PRs:** [#136](https://github.com/senaoz/SWE-574/pull/136) [#377](https://github.com/senaoz/SWE-574/pull/377) [#449](https://github.com/senaoz/SWE-574/pull/449) [#452](https://github.com/senaoz/SWE-574/pull/452) [#454](https://github.com/senaoz/SWE-574/pull/454)

---


## Technical Challenges

### Recommendation Cold-Start and Matching Quality

The recommendation system initially struggled for users with no saved interests, no history, or incomplete profile data. I introduced a location-based fallback and merged those results with interest-based recommendations, while also tightening the matching logic so broad tags did not produce noisy “For You” results.

### Stale Save / Unsave State

The save heart button could go out of sync after navigation because different pages reused cached service data. Fixing this required invalidating and refreshing the correct React Query keys so Dashboard, Home, Profile, and saved-service views stayed consistent.

### Moderator Pin Limits Across Content Types

Pinning had to work consistently across posts, communities, discussions, and events while enforcing the same two-pin-per-category rule. This required coordinated backend validation, frontend disabled states, moderator/admin permission checks, and tooltip feedback.

### Test Stability and Coverage Expansion

Expanding the test suite exposed local blockers, type issues, and regression-prone backend paths. I resolved these blockers while adding focused tests around transactions, chat, upload, badges, communities, reports, Wikidata, frontend UI behavior, and Android utilities.

---

## [Sena Öz](https://github.com/senaoz)

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

<img width="1912" height="1241" alt="Screenshot 2026-05-16 at 17 16 11" src="https://github.com/user-attachments/assets/d137b82a-e7ba-414d-85a2-21f9e9fcd74d" />
<img width="1912" height="1079" alt="Screenshot 2026-05-16 at 17 16 46" src="https://github.com/user-attachments/assets/61f2225a-a56e-4c17-97ad-e4c75593e4c9" />
<img width="1912" height="1345" alt="Screenshot 2026-05-16 at 17 17 08" src="https://github.com/user-attachments/assets/182c70f0-e69e-4682-b9ae-3e9409b67c58" />


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

## [Kenan Altunbaş](https://github.com/kj-kenan)

### Executive Summary

I acted as a full-stack feature owner across three platforms throughout the project: the React/TypeScript web client, the Kotlin/Jetpack-Compose Android app, and the Python/FastAPI backend. My largest single contribution was the Community platform — a green-field subsystem spanning backend API design, web frontend pages, and Android screens, built entirely from scratch. Beyond Communities, I delivered Event Attendance, Service Status Bar, TimeBank balance enforcement with a comprehensive test suite, map and badge improvements, and a range of bug fixes. In parallel I served as the primary QA driver, opening 106 issues covering bugs, missing features, and test-coverage gaps.

---

### Code Contributions

#### 1. Community Platform (Full-Stack)

The Community platform was my largest single contribution: a completely new subsystem I built across all three layers of the stack. Related requirements: FR-5.1, FR-5.2, FR-5.3 (community browsing, membership, and content).

**Backend**
- Designed and implemented the FastAPI router `community.py` (309 lines) with 10+ REST endpoints: list, create, get, update, delete, join, leave, get-members, update-member-role
- Wrote `community_service.py` (492 lines) encapsulating all business logic
- Defined Pydantic models in `models/community.py` (209 lines)
- Extended `forum_service.py` to surface community-scoped posts and events

**Web Frontend**
- Built `CommunityDetail.tsx` (497 lines): banner, member list, post feed, events
- Built `CommunityPostDetail.tsx` (337 lines): post view with Markdown support and upvoting
- Expanded `Forum.tsx` (+312 lines) to include community tabs
- Introduced `BottomNav.tsx` (156 lines) as a shared navigation component
- Wired routing in `App.tsx` for all new community paths

**Android**
- Built the Communities tab and community detail screen (banner, members, posts, events, no-community label)
- Surfaced community membership on user profiles with a mutual common-community badge
- Made communities tappable throughout the app
- Restored accidentally deleted backend endpoints after a rebase silently dropped routes from `users.py`

<img width="1849" height="419" alt="image" src="https://github.com/user-attachments/assets/31a9f72c-3493-4cc6-8aec-ea94eefb0114" />
<img width="921" height="2048" alt="image" src="https://github.com/user-attachments/assets/8c36c523-7dcb-4ce9-97fd-ea10c79b57be" />

---

#### 2. Android UX Overhaul and Mobile Navigation Redesign

I overhauled the Android app's navigation and overall UX to make it more compact, polished, and intuitive. Related issue: #335.

- Replaced the default `NavigationSuiteScaffold` with a custom Canvas-drawn bottom navigation bar: slimmer profile, semi-transparent frosted background, and a curved cutout for the central FAB — giving the app a more refined visual identity
- Consolidated the navigation destinations from five tabs to four, removing redundant screens (Discover, Active, Forum standalone) and relocating their content into contextually appropriate sections, reducing cognitive overhead
- Refactored the entire nav graph to the `BottomNav` + `NavHost` pattern, fixing persistent navbar overlap on detail screens throughout the app
- Ensured content was never obscured by the bar by computing per-screen bottom padding manually (`navBarHeight` for standard screens, `navBarTotalHeight` for FAB screens, `contentPadding` on lazy lists)

<img width="921" height="2048" alt="image" src="https://github.com/user-attachments/assets/a4398857-637a-4d66-9a94-d75d61379bfa" />

---

#### 3. Event Attendance Feature (Android + Backend)

I built a standalone attend/unattend subsystem on top of the existing Events model, delivered across backend and Android in one sprint. Related requirement: FR-4.2 (event attendance tracking).

- Added attend/unattend REST endpoints to the backend and extended `ForumRepository` with matching methods
- Added an Attend/Leave button on event detail screens, hidden for the organiser
- Displayed attendees with profile pictures or initials fallback; tapping navigates to their profile
- Completely redesigned the Android map info window: type badge, tag chips, date, creator info, View Details button
- Map centres on marker tap and closes the previously open popup automatically
- Filtered inactive services (cancelled, expired) out of the map feed

---

#### 4. Service Status Bar (Web + Android)

I implemented a full lifecycle step indicator on both platforms showing every transaction state. Related requirement: FR-3.4 (service transaction lifecycle visibility).

- Step indicator implemented end-to-end: Pending → Accepted → In Progress → Completed / Cancelled / Expired
- Correct step highlighted for completed state; distinct colour coding for cancelled and expired states
- Same visual contract maintained on both web and Android

<img width="620" height="168" alt="image" src="https://github.com/user-attachments/assets/5ef8937f-d5f7-47cf-a37d-b43e6a43dd1f" />

---

#### 5. Service Capacity Warning (Web + Android)

I added a visual warning banner to listing cards and detail pages when a service is near or at its participant limit. Related requirement: FR-2.3 (participant capacity enforcement).


---

#### 6. TimeBank Balance Enforcement (Backend)

I built a security-critical enforcement layer to prevent users from bypassing the 0–10 hour balance cap through concurrent requests. Related requirements: FR-6.1, FR-6.2 (TimeBank credit limits).

- Introduced `get_effective_max_balance()` and `get_effective_min_balance()` in `user_service.py`: they account for all in-flight activities (active offers/needs, pending join requests, approved application transactions) before allowing new service creation or handshakes
- Implemented five enforcement points (CP1–CP5) blocking offer creation, need creation, JR-to-need, JR-to-offer, and need-JR approval when the worst-case projected balance would breach the range
- Patched `join_request_service.py` so the need-JR approval check blocks whenever `effective_max >= 10`, regardless of whether the applicant already has an active need
- Improved error handling and debug logging for all TimeBank limit violations

---

#### 7. Balance Control Test Suite

I wrote `test_balance_controls.py` (805 lines) to cover all five enforcement points end-to-end.

- 7 test classes: `TestEffectiveMaxBalance`, `TestEffectiveMinBalance`, `TestCP1` through `TestCP5`
- 31 async test methods covering boundary conditions: base cases, single-activity projections, multi-activity interactions, edge-exact limits, and approval-time checks
- Every enforcement point has both an allowed and a blocked branch tested

---

#### 8. Chat Keyboard Fix (Mobile Web)

The message input panel on mobile web was obscured by the virtual keyboard. I refactored keyboard detection from a fragile `visualViewport` resize listener to `onFocus`/`onBlur` events with a 150 ms delay on blur to bridge the gap between blur and a tap on the Send button.

---

#### 9. Bug Fixes

- Corrected the expiry checker for specific-date services; updated Dashboard to show only active/upcoming services
- Added edit/delete controls for own comments on the web client
- Fixed comment username clicks to navigate to the correct user profile
- Identified and fixed remote services being filterable by distance
- Capped feedback tag selection at 5 in the service completion dialog
- Updated need icon colour from red to amber; corrected service type selection shadow
- Improved bio field validation on the registration form

---

### Documentation Contributions

Documentation was woven into feature development rather than delivered as standalone commits:

- Organised team meetings throughout both milestones and maintained the [Meeting Notes](https://github.com/senaoz/SWE-574/wiki/Meeting-Notes) on the project wiki.
- Authored the [Software Requirements Specification (SRS)](https://github.com/senaoz/SWE-574/wiki/SRS), covering functional and non-functional requirements for the platform.
- Created the [Demo Scenarios](https://github.com/senaoz/SWE-574/wiki/Scenarios-&-Mockups), defining end-to-end user flows used during milestone presentations.
- Inline code comments throughout `ChatRoom.tsx` explaining the `onFocus`/`onBlur` keyboard detection approach and the 150 ms delay rationale
- Detailed commit messages for the TimeBank enforcement commits describing the effective-balance model, all five control points, and the reasoning for worst-case projection
- 106 issue descriptions served as living documentation: expected behaviour, reproduction steps, and acceptance criteria for each bug and feature
- The mobile APK workflow file is self-documenting with step names and comments explaining the APK location logic and naming convention

---

### QA & Issue Tracking

I opened 152 issues across the project's GitHub tracker and closed 84 of them, the highest individual issue-reporting volume on the team. Issues spanned three categories:

- Web and mobile UI/UX bugs (layout overlaps, broken navigation, incorrect state display)
- Missing or incomplete features flagged against the SRS (e.g. capacity warnings FR-2.3, distance filter for remote services)
- Test-coverage gaps identified and logged as actionable test-case issues

Many of these issues were subsequently self-resolved in the same milestone, closing the loop between QA discovery and implementation.

---

### Code Review Activities

I reviewed several pull requests from teammates throughout the project, providing feedback on correctness, edge cases, and code style. Three notable cases also involved active conflict resolution.

**Community Branch — Rebase Conflict**
While integrating the community feature branch, a rebase against main silently dropped several routes from `users.py`. The missing endpoints were not caught by CI at the time. The regression surfaced in production; I identified the deleted routes by diffing the merged tree against the pre-rebase branch tip and restored them in a follow-up commit.

**Service Details Loading — Merge Conflict**
A merge conflict arose when integrating the fix/service-details branch with concurrent changes on main. The conflict touched component state initialisation logic and required manual resolution to preserve both the loading-state fix and the upstream changes without introducing a regression.

**Pre-PR Conflict Resolution on Feature Branches**
Before opening the Near Me button and bee-location-marker pull requests, main had diverged enough to cause conflicts in shared files (`ServiceMap.tsx` and related components). I merged main into both branches and resolved the conflicts locally before submitting the PRs, keeping the review diffs clean.

---

### Technical Challenges

#### Android Custom Bottom Navigation Bar — Content Overlap and Inset Management

The most time-consuming UI challenge in the project was getting the custom bottom navigation bar to behave correctly on Android. The nav bar was drawn with a Canvas-based custom composable rather than the standard `NavigationBar` component, which meant Jetpack Compose's `Scaffold` had no knowledge of its height and could not insert the correct bottom padding automatically.

The first symptom was content scrolling behind the bar and becoming unreadable. The fix required manually computing `navBarTotalHeight = navBarHeight (70 dp) + fabRadius (30 dp)` and passing that value as explicit bottom padding to every screen's content modifier. Each screen type needed its own version of this padding: regular screens got `navBarHeight`, screens with a floating action button got `navBarTotalHeight`, and list screens used `contentPadding` on the `LazyColumn`.

The second symptom appeared in the chat screen: the message input panel was not rising when the keyboard opened. The root cause was that `Scaffold` was consuming the IME `WindowInsets` before `ChatRoomScreen` could read them, so `WindowInsets.ime.getBottom()` always returned 0 inside the screen. The fix was to configure the Scaffold with `contentWindowInsets = WindowInsets.safeDrawing.exclude(WindowInsets.ime)`, which preserved the IME inset for downstream composables while still handling safe-area padding at the scaffold level.

A third related issue was the navbar background showing as semi-transparent on some devices because the system was drawing the navigation gesture bar behind the custom composable. Resolving this required calling `WindowCompat.setDecorFitsSystemWindows(window, false)` at the activity level to opt into edge-to-edge display, then carefully re-adding only the insets each screen actually needed rather than letting the system handle them globally.

---

#### Silent Rebase Deletion of Backend Endpoints

A rebase on the community branch silently dropped several routes from `users.py`. The regression only surfaced in production when mobile clients began receiving 404 responses. I diagnosed it by diffing the merged tree against the pre-rebase branch tip and restored the deleted endpoints in a follow-up commit.

---

#### ServiceStatusBar Step-Index Off-by-One

The step array mapping between the backend transaction state enum and the UI step indicator had an off-by-one that caused the wrong step to be highlighted for completed transactions. Fixing it required enumerating every state transition — including the three terminal states (Completed, Cancelled, Expired) — and verifying colour logic for each independently on both platforms.

---

#### Concurrent TimeBank Manipulation

Naive balance checks based on the stored value are trivially bypassed by two simultaneous requests. The fix required modelling the worst-case projected balance — accounting for all in-flight offers, needs, join requests, and approved transactions — and applying the check atomically at each of the five enforcement points across three service files.

---

## [Yusuf Savaş](https://github.com/Yusufss4)

Owned the end-to-end development of the primary Android application, engineering core features including a chat system, map integration, service discovery, service and community management flows. Optimized application performance and UI responsiveness through layout refinements while streamlining DevOps by authoring the GitHub Actions CI/CD workflow for APK build, managing app versioning, and maintaining OpenAPI documentation for mobile app. Additionally, drove product quality across both web and mobile platforms by executing testing and documenting 56 critical issues to ensure a stable, production-ready release.

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

<img width="1920" height="800" alt="2" src="https://github.com/user-attachments/assets/a400a742-bffd-4452-ba10-052c02a53dd0" />
<img width="1920" height="800" alt="1" src="https://github.com/user-attachments/assets/8bdc8b13-da62-4e38-a7f9-d7485d13ba18" />

