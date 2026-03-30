# Architecture Overview

## Goals

This backend is structured to demonstrate practical, production-ready NestJS patterns:

- Clear module boundaries
- Infrastructure concerns isolated from business modules
- Secure defaults
- Observable runtime behavior (logging + health checks)

## High-Level Structure

```text
src/
  common/
    decorators, guards, interceptors, middleware, pipes, base abstractions
  config/
    app configuration and Joi env validation
  infrastructure/
    database, cache, queue, scheduler, mail, storage, security, health, logger
  modules/
    auth, users, admin
  shared/
    shared entities, response wrappers, pagination DTOs
```

## Request Lifecycle

1. Request enters NestJS app.
2. Security middleware and CORS are applied.
3. Global validation pipe enforces DTO contracts.
4. Guards perform authentication and authorization.
5. Interceptors provide structured logging, response transformation, and cache behavior.
6. Exceptions are normalized by global filters.

## Security Model

- JWT bearer auth for protected endpoints
- Role-based access via `RolesGuard`
- Request throttling presets
- Helmet + CORS policy from config
- Refresh-token flow with token rotation/revocation strategy in auth module

## Reliability and Operations

- Health endpoints for database, Redis, memory, and disk
- Queue processing with Bull + Redis
- Scheduler tasks for maintenance workflows
- Structured JSON logging with correlation IDs

## API Convention

- Global prefix: `/api`
- URI versioning: `/v1`
- Effective base path: `/api/v1`
- Standardized success and error response envelope

## Improvement Backlog (for future iterations)

- Increase unit and e2e test coverage
- Add OpenAPI contract test in CI
- Add deployment docs (Railway/Render/Fly.io)
- Add rate-limit policy table per endpoint group
