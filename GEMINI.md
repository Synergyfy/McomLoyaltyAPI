# Mcom Loyalty API - Project Context

## Project Overview

**Mcom Loyalty API** is a comprehensive backend service built with **NestJS** (Node.js/TypeScript) for managing loyalty programs, businesses, campaigns, rewards, and participants. It serves as the core backend for the Mcom Mall Loyalty ecosystem.

### Tech Stack

*   **Framework:** [NestJS](https://nestjs.com/) (v11+)
*   **Language:** TypeScript
*   **Database:** PostgreSQL
*   **ORM:** TypeORM
*   **Authentication:** Passport (JWT, Local, Google OAuth2)
*   **Documentation:** Swagger (OpenAPI)
*   **Payment Integration:** Stripe, PayPal
*   **Email:** Nodemailer

## Getting Started

### Prerequisites

*   Node.js (v18+ recommended)
*   PostgreSQL Database
*   npm

### Installation

```bash
npm install
```

### Environment Configuration

Create a `.env` file in the root directory. Ensure the following variables are set (refer to `src/config` or `src/database/data-source.ts` for usage):

```env
PORT=3000
NODE_ENV=development

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=password
POSTGRES_NAME=mcom_loyalty

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=1d

# Other integrations (Stripe, PayPal, Google, Mail) as needed
```

### Database Setup

The project uses TypeORM for database management.

1.  **Run Migrations:** Apply existing migrations to your database.
    ```bash
    npm run migration:run
    ```

2.  **Seed Database:** Populate the database with initial data.
    ```bash
    npm run seed
    ```

### Running the Application

*   **Development (Watch Mode):**
    ```bash
    npm run start:dev
    ```
*   **Production:**
    ```bash
    npm run build
    npm run start:prod
    ```

The API will be available at `http://localhost:3000/api/v1`.
Swagger documentation is available at `http://localhost:3000/api-docs`.

## Architecture & Conventions

### Directory Structure

*   `src/app.module.ts`: Root module importing all feature modules.
*   `src/main.ts`: Application entry point (Global pipes, guards, Swagger setup).
*   `src/auth/`: Authentication logic (Strategies, Guards, Auth Controller).
*   `src/common/`: Shared utilities, decorators, filters, and guards.
*   `src/database/`: Database configuration and migrations.
*   `src/resources/`: Feature modules (Business, Campaign, Rewards, Participant, etc.).
*   `src/seeder/`: Database seeding logic.

### Key Patterns

*   **Global Prefix:** `api/v1`
*   **Validation:** Uses `ValidationPipe` with `class-validator`. All DTOs should use validation decorators.
*   **Error Handling:** `GlobalExceptionFilter` standardizes error responses.
*   **Response Formatting:** `CamelCaseInterceptor` ensures all JSON responses use camelCase keys.
*   **Authentication:**
    *   `JwtAuthGuard` is global (via `APP_GUARD`), meaning endpoints are protected by default.
    *   Use `@Public()` decorator to expose endpoints publicly.
    *   `RolesGuard` and `ImpersonationGuard` are also globally active.

### Database & Migrations

*   **Entities:** Located in `*.entity.ts` files within modules.
*   **Migration Generation:**
    ```bash
    npm run migration:generate -- src/database/migrations/MigrationName
    ```
    *Note: Check `src/database/data-source.ts` path configuration if this fails.*

## Testing

*   **Unit Tests:** `npm run test`
*   **E2E Tests:** `npm run test:e2e`

## Documentation

*   **Swagger:** Automatically generated at `/api-docs`.
*   **Markdown:** Additional documentation can be found in the `docs/` folder.

## Operational Mandates & Coding Standards

**CRITICAL: The AI agent must strictly adhere to the following rules:**

1.  **Explicit Authorization Required:**
    *   **NEVER** run tests (`npm run test`, etc.) without explicit user instruction.
    *   **NEVER** run database migrations (`npm run migration:run`, etc.) without explicit user instruction.
    *   **NEVER** commit changes to git (`git commit`, etc.) without explicit user instruction.

2.  **Strict Typing:**
    *   **NO `any` TYPE:** The use of the `any` type is strictly forbidden. Use proper interfaces, classes, generics, or `unknown` (with type narrowing) to ensure type safety.