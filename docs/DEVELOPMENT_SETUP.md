# Development Setup

## Requirements

- Node.js 18+
- npm 9+
- Docker + Docker Compose (recommended)

## Environment

Create local env file:

```bash
cp .env.example .env
```

Minimum required variables:

- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET` (minimum 32 characters)

## Run with Docker

```bash
docker compose up -d
```

Default URLs:

- API: `http://localhost:3001/api/v1`
- Swagger: `http://localhost:3001/api/docs`
- pgAdmin: `http://localhost:5050`

## Run Without Docker

1. Start PostgreSQL and Redis locally.
2. Update `.env` host/port values.
3. Start app:

```bash
npm run start:dev
```

## Common Commands

```bash
npm run build
npm run lint
npm test
npm run test:cov
npm run seed
npm run migration:run
```

## CI Expectations

Before pushing changes, run:

```bash
npm run lint
npm test
npm run build
```
