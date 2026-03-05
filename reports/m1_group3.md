# The Hive Platform

> SWE 574 — Boğaziçi University, Spring 2026

---

## Software Design (UML Diagrams)

### Table of Contents

1. [Use Case Diagram](#1-use-case-diagram)
2. [Class Diagram (Domain Model)](#2-class-diagram-domain-model)
3. [Component Diagram (System Architecture)](#3-component-diagram-system-architecture)
4. [Sequence Diagrams](#4-sequence-diagrams)
   - 4.1 [User Authentication Flow](#41-user-authentication-flow)
   - 4.2 [Service Creation & Matching Flow](#42-service-creation--matching-flow)
   - 4.3 [TimeBank Transaction Flow](#43-timebank-transaction-flow)
5. [Activity Diagram — Service Exchange Lifecycle](#5-activity-diagram--service-exchange-lifecycle)
6. [Deployment Diagram](#6-deployment-diagram)
7. [State Diagram — Service Status](#7-state-diagram--service-status)
8. [State Diagram — Transaction Status](#8-state-diagram--transaction-status)

---

### 1. Use Case Diagram

#### 1.1 Guest Use Cases

```mermaid
graph LR
    Guest(["🧑 Guest"])

    subgraph "The Hive Platform"
        UC1(["Register"])
        UC2(["Login"])
        UC5(["Browse & Search Services"])
        UC6(["View Service Details"])
    end

    Guest --- UC1
    Guest --- UC2
    Guest --- UC5
    Guest --- UC6
```

#### 1.2 Registered User Use Cases

```mermaid
graph LR
    User(["🧑 Registered User"])

    subgraph "The Hive Platform"
        direction TB

        subgraph "Service Management"
            UC4(["Create Service (Offer/Need)"])
            UC5(["Browse & Search Services"])
            UC7(["Save / Unsave Service"])
            UC8(["Edit / Delete Service"])
            UC9(["Send Join Request"])
            UC10(["Approve / Reject Join Request"])
            UC11(["Complete Service"])
            UC12(["Cancel Service"])
        end

        subgraph "TimeBank"
            UC13(["View TimeBank Balance"])
            UC14(["Earn Time Credits"])
            UC15(["Spend Time Credits"])
            UC16(["Confirm Transaction Completion"])
        end

        subgraph "Communication"
            UC17(["Send Chat Message"])
            UC18(["Create Chat Room"])
            UC19(["Comment on Service"])
        end

        subgraph "Forum"
            UC20(["Create Discussion"])
            UC21(["Create Event"])
            UC22(["Attend / Unattend Event"])
            UC23(["Comment on Discussion / Event"])
        end

        subgraph "Profile & Settings"
            UC24(["View / Edit Profile"])
            UC25(["Upload Profile Picture"])
            UC26(["Manage Interests"])
            UC27(["Update Settings"])
            UC28(["Change Password"])
            UC29(["View Badges"])
        end

        subgraph "Rating"
            UC30(["Rate User"])
            UC31(["View User Ratings"])
        end
    end

    User --- UC4
    User --- UC5
    User --- UC7
    User --- UC8
    User --- UC9
    User --- UC10
    User --- UC11
    User --- UC12
    User --- UC13
    User --- UC14
    User --- UC15
    User --- UC16
    User --- UC17
    User --- UC18
    User --- UC19
    User --- UC20
    User --- UC21
    User --- UC22
    User --- UC23
    User --- UC24
    User --- UC25
    User --- UC26
    User --- UC27
    User --- UC28
    User --- UC29
    User --- UC30
    User --- UC31
```

#### 1.3 Moderator & Admin Use Cases

```mermaid
graph LR
    Mod(["🧑 Moderator"])
    Admin(["🧑 Admin"])

    subgraph "The Hive Platform — Administration"
        UC32(["Manage Users"])
        UC33(["Manage User Roles"])
        UC34(["Adjust TimeBank Balance"])
        UC35(["View Analytics"])
        UC36(["View Failed Transactions"])
    end

    Mod --- UC32
    Mod --- UC33
    Mod --- UC35
    Mod --- UC36

    Admin --- UC32
    Admin --- UC33
    Admin --- UC34
    Admin --- UC35
    Admin --- UC36
```

---

### 2. Class Diagram (Domain Model)

```mermaid
classDiagram
    class User {
        +ObjectId _id
        +String username
        +String email
        +String password_hash
        +String full_name
        +String bio
        +String location
        +String profile_picture
        +SocialLinks social_links
        +List~String~ interests
        +Boolean is_active
        +Boolean is_verified
        +UserRole role
        +Float timebank_balance
        +Boolean profile_visible
        +Boolean show_email
        +Boolean show_location
        +Boolean email_notifications
        +DateTime created_at
        +DateTime updated_at
    }

    class UserRole {
        <<enumeration>>
        user
        moderator
        admin
    }

    class SocialLinks {
        +String linkedin
        +String github
        +String twitter
        +String instagram
        +String website
        +String portfolio
    }

    class Service {
        +ObjectId _id
        +ObjectId user_id
        +String title
        +String description
        +String category
        +List~TagEntity~ tags
        +Float estimated_duration
        +Location location
        +Boolean is_remote
        +DateTime deadline
        +ServiceType service_type
        +ServiceStatus status
        +Int max_participants
        +String scheduling_type
        +String specific_date
        +String specific_time
        +Dict recurring_pattern
        +String open_availability
        +List~String~ image_urls
        +List~ObjectId~ matched_user_ids
        +List~ObjectId~ receiver_confirmed_ids
        +DateTime created_at
        +DateTime updated_at
        +DateTime completed_at
        +get_tag_labels() List~String~
    }

    class ServiceType {
        <<enumeration>>
        offer
        need
    }

    class ServiceStatus {
        <<enumeration>>
        active
        in_progress
        completed
        cancelled
        expired
    }

    class TagEntity {
        +String label
        +String entityId
        +String description
        +List~String~ aliases
    }

    class Location {
        +Float latitude
        +Float longitude
        +String address
    }

    class Transaction {
        +ObjectId _id
        +ObjectId service_id
        +ObjectId provider_id
        +ObjectId requester_id
        +Float timebank_hours
        +String description
        +TransactionStatus status
        +String completion_notes
        +String dispute_reason
        +Boolean provider_confirmed
        +Boolean requester_confirmed
        +DateTime created_at
        +DateTime updated_at
        +DateTime completed_at
    }

    class TransactionStatus {
        <<enumeration>>
        pending
        in_progress
        completed
        cancelled
        disputed
    }

    class JoinRequest {
        +ObjectId _id
        +ObjectId service_id
        +ObjectId user_id
        +String message
        +JoinRequestStatus status
        +String admin_message
        +DateTime created_at
        +DateTime updated_at
    }

    class JoinRequestStatus {
        <<enumeration>>
        pending
        approved
        rejected
        cancelled
    }

    class Comment {
        +ObjectId _id
        +ObjectId service_id
        +ObjectId user_id
        +String content
        +DateTime created_at
        +DateTime updated_at
    }

    class ChatRoom {
        +ObjectId _id
        +List~ObjectId~ participant_ids
        +List~ObjectId~ service_ids
        +ObjectId transaction_id
        +String name
        +String description
        +Boolean is_active
        +DateTime created_at
        +DateTime updated_at
        +DateTime last_message_at
    }

    class Message {
        +ObjectId _id
        +ObjectId room_id
        +ObjectId sender_id
        +String content
        +String message_type
        +ObjectId reply_to_message_id
        +Boolean is_edited
        +Boolean is_deleted
        +DateTime created_at
        +DateTime updated_at
    }

    class Rating {
        +ObjectId _id
        +ObjectId transaction_id
        +ObjectId rater_id
        +ObjectId rated_user_id
        +Int score
        +String comment
        +DateTime created_at
    }

    class ForumDiscussion {
        +ObjectId _id
        +ObjectId user_id
        +String title
        +String body
        +List~TagEntity~ tags
        +DateTime created_at
        +DateTime updated_at
    }

    class ForumEvent {
        +ObjectId _id
        +ObjectId user_id
        +String title
        +String description
        +DateTime event_at
        +String location
        +Float latitude
        +Float longitude
        +Boolean is_remote
        +List~TagEntity~ tags
        +ObjectId service_id
        +List~String~ attendee_ids
        +DateTime created_at
        +DateTime updated_at
    }

    class ForumComment {
        +ObjectId _id
        +ObjectId user_id
        +ForumTargetType target_type
        +ObjectId target_id
        +String content
        +DateTime created_at
        +DateTime updated_at
    }

    class ForumTargetType {
        <<enumeration>>
        discussion
        event
    }

    class SavedService {
        +ObjectId user_id
        +ObjectId service_id
        +DateTime created_at
    }

    class FailedTimebankTransaction {
        +ObjectId _id
        +ObjectId user_id
        +Float amount
        +String description
        +ObjectId service_id
        +String reason
        +Float user_balance_at_failure
        +String error_message
        +DateTime created_at
    }

    User "1" --> "0..*" Service : creates
    User "1" --> "0..*" JoinRequest : submits
    User "1" --> "0..*" Comment : writes
    User "1" --> "0..*" Transaction : participates in
    User "1" --> "0..*" Rating : gives / receives
    User "1" --> "0..*" ChatRoom : participates in
    User "1" --> "0..*" Message : sends
    User "1" --> "0..*" ForumDiscussion : creates
    User "1" --> "0..*" ForumEvent : creates
    User "1" --> "0..*" ForumComment : writes
    User "1" --> "0..*" SavedService : saves

    User --> UserRole
    User --> SocialLinks

    Service --> ServiceType
    Service --> ServiceStatus
    Service --> Location
    Service "1" --> "0..*" TagEntity : tagged with
    Service "1" --> "0..*" JoinRequest : receives
    Service "1" --> "0..*" Comment : has
    Service "1" --> "0..*" Transaction : generates
    Service "0..1" --> "0..*" ForumEvent : linked to

    Transaction --> TransactionStatus
    Transaction "1" --> "0..*" Rating : rated via
    Transaction "0..1" --> "0..1" ChatRoom : discussed in

    JoinRequest --> JoinRequestStatus

    ChatRoom "1" --> "0..*" Message : contains

    ForumComment --> ForumTargetType
    ForumDiscussion "1" --> "0..*" ForumComment : has comments
    ForumEvent "1" --> "0..*" ForumComment : has comments

    FailedTimebankTransaction --> User : belongs to
    FailedTimebankTransaction --> Service : related to
```

---

### 3. Component Diagram (System Architecture)

```mermaid
graph TB
    subgraph "Client Layer"
        Browser["🌐 Web Browser"]
    end

    subgraph "Frontend (React SPA)"
        Router["React Router v6"]
        Pages["Pages<br/>(Home, Dashboard, Profile,<br/>ServiceDetail, Forum, Admin, Chat)"]
        Components["Shared Components<br/>(Layout, Forms, Map, UI)"]
        Contexts["Contexts<br/>(UserContext, FilterContext,<br/>ThemeContext)"]
        TanStack["TanStack Query<br/>(Server State Cache)"]
        APIClient["Axios API Client<br/>(services/api.ts)"]
    end

    subgraph "Reverse Proxy"
        Nginx["Nginx<br/>(Static Files + API Proxy)"]
    end

    subgraph "Backend (FastAPI)"
        APIRoutes["API Routes<br/>(auth, users, services, transactions,<br/>chat, forum, ratings, admin, ...)"]
        Services["Service Layer<br/>(AuthService, UserService,<br/>ServiceService, TransactionService,<br/>ChatService, ForumService, ...)"]
        Models["Pydantic Models<br/>(DTOs / Schemas)"]
        Security["Security<br/>(JWT, RBAC)"]
        Middleware["Middleware<br/>(CORS)"]
    end

    subgraph "Data Layer"
        MongoDB[("MongoDB 7<br/>(Motor Async Driver)")]
    end

    subgraph "External Services"
        Wikidata["Wikidata API<br/>(Tag Search)"]
    end

    Browser --> Nginx
    Nginx -->|"Static files (/)"|Pages
    Nginx -->|"API proxy (/api/)"| APIRoutes

    Pages --> Components
    Pages --> Contexts
    Pages --> TanStack
    TanStack --> APIClient
    APIClient -->|"HTTP/REST"| Nginx

    APIRoutes --> Security
    APIRoutes --> Services
    Services --> Models
    Services --> MongoDB

    Security -->|"JWT verification"| MongoDB
    Services -->|"HTTP"| Wikidata
```

---

### 4. Sequence Diagrams

#### 4.1 User Authentication Flow

```mermaid
sequenceDiagram
    actor U as User
    participant F as Frontend<br/>(React)
    participant N as Nginx
    participant B as Backend<br/>(FastAPI)
    participant DB as MongoDB

    Note over U,DB: Registration Flow
    U->>F: Fill registration form
    F->>N: POST /api/auth/register
    N->>B: POST /auth/register
    B->>DB: Check email/username uniqueness
    DB-->>B: Result
    alt Email or username exists
        B-->>N: 400 Error
        N-->>F: Error response
        F-->>U: Show error message
    else Valid registration
        B->>B: Hash password (pbkdf2_sha256)
        B->>DB: Insert user document
        DB-->>B: Created user
        B->>B: Create JWT token
        B-->>N: {access_token, user}
        N-->>F: Token + user data
        F->>F: Store token in localStorage
        F->>F: Set user in UserContext
        F-->>U: Redirect to /profile?interests=true
    end

    Note over U,DB: Login Flow
    U->>F: Enter email + password
    F->>N: POST /api/auth/login
    N->>B: POST /auth/login
    B->>DB: Find user by email
    DB-->>B: User document
    B->>B: Verify password hash
    alt Invalid credentials
        B-->>N: 401 Unauthorized
        N-->>F: Error response
        F-->>U: Show error message
    else Valid credentials
        B->>B: Create JWT token
        B-->>N: {access_token, user}
        N-->>F: Token + user data
        F->>F: Store token in localStorage
        F->>F: Update QueryClient cache
        F-->>U: Redirect to /dashboard
    end

```

#### 4.2 Service Creation & Matching Flow

```mermaid
sequenceDiagram
    actor P as Provider
    actor R as Requester
    participant F as Frontend
    participant B as Backend
    participant DB as MongoDB

    Note over P,DB: Service Creation
    P->>F: Fill OfferNeedForm
    F->>B: POST /services/
    B->>B: Validate service data
    B->>DB: Insert service (status=active)
    DB-->>B: Created service
    B-->>F: ServiceResponse
    F-->>P: Show service on Dashboard

    Note over R,DB: Join Request
    R->>F: Click "Join" on service
    F->>F: Show HandShakeModal
    R->>F: Confirm with message
    F->>B: POST /join-requests/
    B->>DB: Check for existing request
    B->>DB: Insert join request (status=pending)
    DB-->>B: Created request
    B-->>F: JoinRequestResponse
    F-->>R: "Request sent" confirmation

    Note over P,DB: Approve Join Request
    P->>F: View pending requests
    F->>B: GET /join-requests/service/{id}
    B->>DB: Fetch pending requests
    DB-->>B: Request list
    B-->>F: Requests with user info
    P->>F: Click "Approve"
    F->>B: PUT /join-requests/{id} (status=approved)
    B->>DB: Update request status
    B->>DB: Add user to matched_user_ids
    B->>DB: Update service status to in_progress
    DB-->>B: Updated
    B-->>F: Updated request
    F-->>P: Show updated applicant list

    Note over P,DB: Service Completion
    P->>F: Click "Complete Service"
    F->>B: POST /services/{id}/complete
    B->>DB: Update service (status=completed)
    B->>B: Create transaction
    B->>DB: Insert transaction
    B->>B: Transfer TimeBank credits
    B->>DB: Update provider balance (+hours)
    B->>DB: Update requester balance (-hours)
    alt Balance limit exceeded
        B->>DB: Log FailedTimebankTransaction
    end
    DB-->>B: Updated
    B-->>F: Completion response
    F-->>P: Show completed status
```

#### 4.3 TimeBank Transaction Flow

```mermaid
sequenceDiagram
    actor Prov as Service Provider
    actor Req as Service Requester
    participant F as Frontend
    participant B as Backend
    participant DB as MongoDB

    Note over Prov,DB: Transaction Created on Service Completion
    B->>DB: Create transaction<br/>(provider_id, requester_id,<br/>timebank_hours, status=pending)
    DB-->>B: Transaction created

    Note over Prov,DB: Provider Confirms Completion
    Prov->>F: View my transactions
    F->>B: GET /transactions/my-transactions
    B->>DB: Fetch transactions
    DB-->>B: Transaction list
    B-->>F: TransactionListResponse
    Prov->>F: Confirm completion
    F->>B: POST /transactions/{id}/confirm-completion
    B->>DB: Set provider_confirmed=true
    DB-->>B: Updated

    Note over Req,DB: Requester Confirms Completion
    Req->>F: Confirm completion
    F->>B: POST /transactions/{id}/confirm-completion
    B->>DB: Set requester_confirmed=true
    B->>B: Both confirmed → status=completed

    Note over B,DB: TimeBank Credit Transfer
    B->>DB: Provider balance += timebank_hours
    alt Provider balance > 10.0
        B->>B: Cap at 10.0
        B->>DB: Log FailedTimebankTransaction<br/>(reason: provider_balance_limit)
    end
    B->>DB: Requester balance -= timebank_hours
    alt Requester balance < 0
        B->>DB: Log FailedTimebankTransaction<br/>(reason: insufficient_balance)
    end
    DB-->>B: Balances updated
    B-->>F: TransactionResponse (completed)

    Note over Prov,DB: Rating After Transaction
    Prov->>F: Rate requester (1-5 stars)
    F->>B: POST /ratings/
    B->>DB: Insert rating
    DB-->>B: Rating created

    Req->>F: Rate provider (1-5 stars)
    F->>B: POST /ratings/
    B->>DB: Insert rating
    DB-->>B: Rating created
```

---

### 5. Activity Diagram — Service Exchange Lifecycle

```mermaid
flowchart TD
    Start([Start]) --> Create["Provider creates<br/>Service (offer/need)"]
    Create --> Active{{"Service Status:<br/>ACTIVE"}}
    Active --> Browse["Other users browse<br/>& discover service"]
    Browse --> JoinDecision{User wants<br/>to join?}

    JoinDecision -->|No| Browse
    JoinDecision -->|Yes| SendRequest["User sends<br/>Join Request"]
    SendRequest --> PendingRequest{{"Request Status:<br/>PENDING"}}
    PendingRequest --> OwnerReview["Service owner<br/>reviews request"]
    OwnerReview --> ApproveDecision{Approve?}

    ApproveDecision -->|Reject| Rejected["Request rejected"]
    Rejected --> Browse

    ApproveDecision -->|Approve| Approved["Request approved<br/>User added to participants"]
    Approved --> CheckCapacity{Max participants<br/>reached?}

    CheckCapacity -->|No| Browse
    CheckCapacity -->|Yes| InProgress{{"Service Status:<br/>IN_PROGRESS"}}

    Active -->|Owner cancels| Cancelled{{"Service Status:<br/>CANCELLED"}}
    Active -->|Deadline passed| Expired{{"Service Status:<br/>EXPIRED"}}

    InProgress --> ServiceDelivery["Service is<br/>delivered"]
    InProgress -->|Owner cancels| Cancelled

    ServiceDelivery --> OwnerCompletes["Owner marks<br/>service complete"]
    OwnerCompletes --> Completed{{"Service Status:<br/>COMPLETED"}}

    Completed --> TxCreated["Transaction created<br/>(status: pending)"]
    TxCreated --> ProviderConfirm["Provider confirms<br/>completion"]
    TxCreated --> RequesterConfirm["Requester confirms<br/>completion"]
    ProviderConfirm --> BothConfirmed{Both<br/>confirmed?}
    RequesterConfirm --> BothConfirmed

    BothConfirmed -->|No| WaitConfirm["Wait for other<br/>party to confirm"]
    WaitConfirm --> BothConfirmed
    BothConfirmed -->|Yes| CreditTransfer["TimeBank credit<br/>transfer"]

    CreditTransfer --> ProviderCredit["Provider:<br/>balance += hours"]
    CreditTransfer --> RequesterDebit["Requester:<br/>balance -= hours"]

    ProviderCredit --> Rating["Both parties<br/>rate each other"]
    RequesterDebit --> Rating
    Rating --> ChatOption["Optional: continue<br/>chat discussion"]
    ChatOption --> End([End])

    Cancelled --> End
    Expired --> End
```

---

### 6. Deployment Diagram

```mermaid
graph TB
    subgraph "Client"
        Browser["🌐 Web Browser<br/>(Any modern browser)"]
    end

    subgraph "Docker Host (Easypanel)"
        subgraph "docker-compose"
            subgraph "Frontend Container"
                NginxServer["Nginx<br/>Port 80"]
                StaticFiles["React SPA<br/>(Built static files)"]
            end

            subgraph "Backend Container"
                FastAPIServer["FastAPI (Uvicorn)<br/>Port 8000"]
                PythonRuntime["Python 3.x Runtime"]
            end

            subgraph "Database Container"
                MongoServer["MongoDB 7<br/>Port 27017"]
                MongoVolume[("mongo_data<br/>Persistent Volume")]
            end
        end
    end

    subgraph "External Services"
        WikidataAPI["Wikidata API<br/>wikidata.org"]
    end

    subgraph "CI/CD"
        GitHubRepo["GitHub Repository<br/>SWE-574"]
        GitHubActions["GitHub Actions<br/>(deploy-easypanel.yml)"]
    end

    Browser -->|"HTTPS"| NginxServer
    NginxServer -->|"Serves static files"| StaticFiles
    NginxServer -->|"Proxy /api/ → :8000"| FastAPIServer
    FastAPIServer --> PythonRuntime
    FastAPIServer -->|"Motor async driver"| MongoServer
    MongoServer --> MongoVolume

    FastAPIServer -.->|"REST API"| WikidataAPI

    GitHubRepo -->|"Push to main"| GitHubActions
    GitHubActions -->|"Deploy"| NginxServer
    GitHubActions -->|"Deploy"| FastAPIServer
```

---

### 7. State Diagram — Service Status

```mermaid
stateDiagram-v2
    [*] --> active : Service created

    active --> in_progress : Participant(s) approved &<br/>max capacity reached
    active --> cancelled : Owner cancels
    active --> expired : Deadline passes

    in_progress --> completed : Owner marks complete
    in_progress --> cancelled : Owner cancels

    completed --> [*]
    cancelled --> [*]
    expired --> [*]
```

---

### 8. State Diagram — Transaction Status

```mermaid
stateDiagram-v2
    [*] --> pending : Transaction created<br/>(on service completion)

    pending --> in_progress : Work begins
    pending --> cancelled : Either party cancels

    in_progress --> completed : Both parties<br/>confirm completion
    in_progress --> disputed : Dispute raised
    in_progress --> cancelled : Either party cancels

    disputed --> completed : Dispute resolved
    disputed --> cancelled : Dispute leads<br/>to cancellation

    completed --> [*] : Credits transferred<br/>& ratings submitted
    cancelled --> [*]
```
