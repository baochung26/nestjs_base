# NestJS Backend Base (Portfolio Project)

A production-minded NestJS backend starter focused on clean architecture, security, and real-world backend features.

## Why This Project

This repository is designed as a public showcase of backend engineering practices:

- Modular NestJS architecture with clear separation of concerns
- JWT auth with refresh-token flow and Google OAuth integration
- Role-based authorization (`USER`, `ADMIN`)
- PostgreSQL + TypeORM + Redis + Bull queues
- Caching, scheduling, health checks, structured logging, and Swagger
- Docker-first local setup

## Tech Stack

- NestJS 10 + TypeScript
- PostgreSQL + TypeORM
- Redis + Bull
- Passport (Local, JWT, Google OAuth)
- Swagger / OpenAPI
- Pino logging + correlation ID
- Jest for testing

## Project Structure

```text
src/
  common/             # shared decorators, guards, interceptors, middleware
  config/             # environment config + validation
  infrastructure/     # DB, cache, queue, scheduler, health, mail, storage
  modules/            # auth, users, admin domain modules
  shared/             # shared DTOs/entities/helpers
```

## Quick Start

### 1. Clone & install

```bash
npm install
cp .env.example .env
```

### 2. Run with Docker (recommended)

```bash
docker compose up -d
```

API base URL (default): `http://localhost:3001/api/v1`

Swagger (non-production): `http://localhost:3001/api/docs`

### 3. Run locally (without Docker)

Make sure PostgreSQL + Redis are available, update `.env`, then:

```bash
npm run start:dev
```

## Useful Scripts

```bash
npm run start:dev
npm run build
npm run lint
npm test
npm run test:cov
npm run seed
npm run migration:run
```

## Documentation

See the documentation index:

- [docs/README.md](./docs/README.md)

## API Summary

- Auth: `/auth/*`
- Users: `/users/*`
- Admin: `/admin/*`
- Health: `/health/*`

Full API reference:

- [docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)

## Security Notes

- Do not commit real credentials to the repository
- Keep `.env` local only (already ignored)
- Use strong JWT and OAuth secrets in production

## License

MIT
