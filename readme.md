## Failure Scenarios Tested

| Scenario                     | Result                     |
| ---------------------------- | -------------------------- |
| Same Request Retry           | Cached Response Returned   |
| Same Key + Different Payload | 422 Returned               |
| Gateway Failure              | Transaction Rolled Back    |
| Server Crash Before Commit   | No Data Persisted          |
| Server Crash After Commit    | Retry Replays Response     |
| Concurrent Requests Same Key | Only One Payment Created   |
| Redis Lock Collision         | Duplicate Request Rejected |

#

#

# System Architecture Diagrams

## Architecture

![This HLD Image.](./Diagrams/Architecture.png)

## Request Flow Diagram

```mermaid
sequenceDiagram

    participant Client
    participant Middleware
    participant Redis
    participant Service
    participant Gateway
    participant Postgres

    Client->>Middleware: POST /payments\nIdempotency-Key

    Middleware->>Redis: Check key

    alt Key Exists

        Redis-->>Middleware: Stored Response

        Middleware-->>Client: Return Cached Response

    else Key Not Found

        Middleware->>Redis: Acquire Lock

        Middleware->>Redis: Save Processing State

        Middleware->>Service: Process Payment

        Service->>Gateway: Charge Card

        Gateway-->>Service: Success

        Service->>Postgres: BEGIN TRANSACTION

        Service->>Postgres: Insert Payment

        Service->>Postgres: Insert Idempotency Record

        Service->>Postgres: COMMIT

        Service->>Redis: Cache Response

        Service-->>Client: 201 Created

    end

```

## Atomic Transaction Diagram

![This HLD Image.](./Diagrams/Atomic%20Transaction%20Diagram.png)

## Retry Handling Diagram

![This HLD Image.](./Diagrams/Retry%20Handling%20Diagram.png)

## Crash Recovery Scenario

```mermaid
sequenceDiagram

    participant Client
    participant API
    participant PG as PostgreSQL

    Client->>API: Payment Request

    API->>PG: BEGIN

    API->>PG: Insert Payment

    API->>PG: Insert Idempotency Record

    API->>PG: COMMIT

    Note over API: Server Crashes Here

    Client->>API: Retry Same Request

    API->>PG: Lookup Idempotency Key

    PG-->>API: Existing Response

    API-->>Client: Return Original Response

```

## Backend Concepts Covered

### Reliability

- Idempotency Keys
- Request Hash Validation
- Distributed Locking
- Retry Safety
- Crash Recovery

### Database

- PostgreSQL Transactions
- ACID Guarantees
- Unique Constraints
- JSONB Storage
- UUID Primary Keys

### Caching

- Redis
- TTL Expiration
- Response Replay
- Processing State Tracking

### Payment Processing

- Payment Gateway Integration
- Failure Simulation
- Duplicate Charge Prevention

### Distributed Systems

- Exactly Once Processing
- Concurrency Control
- Race Condition Prevention
- Atomic Writes

### API Design

- REST APIs
- Middleware Pattern
- Error Handling
- Status Code Consistency
