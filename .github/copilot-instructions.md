# Copilot Instructions — Boat App (Spring Boot + Angular)

## Project Goal

This project is a fullstack application.

The goal is to deliver a clean, maintainable, and production-like implementation of an authenticated CRUD application managing boats.

Priorities:
- Clarity over cleverness
- Simplicity over over-engineering
- Readability and maintainability
- Consistent architecture across backend and frontend

---

## Tech Stack

### Backend
- Java 25
- Spring Boot 3.5
- Spring Web
- Spring Data JPA
- Spring Security (OAuth2 / JWT)
- PostgreSQL
- Validation (Jakarta)
- OpenAPI (Swagger)

### Frontend
- Angular 20
- Angular Router
- HTTP Client
- Angular Material

### Infrastructure
- Docker
- Docker Compose

---

## Backend Architecture Guidelines

Use a standard layered architecture:

- controller → handles HTTP requests
- service → contains business logic
- repository → data access (Spring Data JPA)
- entity → JPA entities
- dto → API input/output models
- exception → custom exceptions and global handler
- security → authentication and authorization config

### Rules:
- Do not expose entities directly in controllers when request/response models differ or validation needs to be isolated
- For this project, keep DTO/entity transformation simple and local to the service layer or dedicated private methods
- Do not introduce a dedicated mapper layer unless complexity clearly justifies it
- Validate all incoming data using annotations
- Use proper HTTP status codes (400, 404, etc.)
- Centralize error handling using @ControllerAdvice
- Keep controllers thin and delegate logic to services
- Prefer constructor injection

---

## Frontend Architecture Guidelines

The app is structured around two top-level folders inside `src/app/`:

```
app/
├── core/                         # Cross-cutting concerns shared across the app
│   ├── config/                   # Runtime configuration (injection token + loader)
│   ├── guards/                   # auth.guard, no-auth.guard
│   └── services/                 # App-wide services (e.g. ThemeService)
├── features/                     # One folder per feature domain
│   ├── auth/
│   │   └── pages/login/          # LoginPageComponent
│   ├── boats/
│   │   ├── pages/dashboard/      # DashboardPageComponent + BoatsDashboardStore
│   │   ├── components/           # Feature-scoped dialog components (form, details, delete)
│   │   ├── models/               # TypeScript interfaces (boat.model.ts)
│   │   ├── services/             # BoatsService (HTTP)
│   │   ├── constants/            # API path constants
│   │   └── utils/                # Pure utility functions (e.g. UUID helpers)
│   └── not-found/                # NotFoundPageComponent
└── app.routes.ts                 # Lazy-loaded routes using loadComponent
```

### Component model

- All components are **standalone** (no NgModules) and use `ChangeDetectionStrategy.OnPush`
- Routes are lazy-loaded via `loadComponent`
- Route-level components (pages) orchestrate state and open dialogs; they do not own presentation logic
- Feature-specific dialog components (create, edit, delete, details) live in `features/<name>/components/`
- There is no shared `ui/` folder — components are feature-scoped and reused within their feature only

### State management

- Page-level state is managed by a **component-scoped store**: a plain `@Injectable()` class provided in the page component's `providers` array (e.g. `BoatsDashboardStore`)
- Stores use Angular **signals** for reactive state (`signal`, `computed`) and RxJS for async operations
- The store owns all data-fetching, pagination, filtering, and mutation logic for its page
- Services (`BoatsService`) are stateless and only handle HTTP communication

### Forms

- Use **reactive forms** (`ReactiveFormsModule`, `FormBuilder`) for any form with validation or controlled submission
- Dialog components encapsulate their own form and emit the result via `MatDialogRef.close()`

### Authentication

- Authentication is handled entirely by the `keycloak-angular` library
- Token attachment to HTTP requests is managed by Keycloak's built-in interceptor — no custom interceptor needed
- Route protection is handled by `auth.guard` and `no-auth.guard` in `core/guards/`

### Runtime configuration

- Environment-specific values (API URL, Keycloak settings) are injected at runtime via `RUNTIME_CONFIG` injection token
- The config is loaded from a static JSON file served by nginx before the app bootstraps
- Never use `environment.ts` files for values that differ between Docker environments

### Rules:
- Keep page components focused on orchestration — delegate state to the store, presentation to child components
- Keep dialog components self-contained: they own their form and close with a typed result
- Move all HTTP logic into services; stores call services and update signals
- Handle loading, error, and empty states explicitly using store signals
- Avoid duplicating logic across components or stores
- Do not introduce a shared `ui/` folder unless a component is genuinely reused across multiple features

---

## Security Guidelines

- All backend endpoints must be protected unless explicitly public
- Validate authentication on every request
- Never trust frontend input
- Ensure proper validation at backend level
- Avoid exposing sensitive data in error messages
- Use secure defaults in configuration

---

## Testing Guidelines

- Prioritize unit tests first
- Add integration tests where relevant using Testcontainers
- Focus on business logic and critical flows
- Avoid excessive mocking
- Tests should be readable and meaningful

---

## AI Usage Guidelines

Copilot should assist but not replace engineering decisions.

### Expected usage:
- Generate boilerplate code (DTOs, entities, components, tests)
- Suggest test cases
- Assist with refactoring
- Improve readability and consistency

### Must NOT:
- Introduce unnecessary complexity
- Apply heavy enterprise patterns without justification
- Generate large blocks of code without review

### Always:
- Keep generated code simple
- Prefer explicit over implicit behavior
- Align with project architecture
- Ensure consistency with existing code

---

## Coding Style

### General:
- Use clear and explicit naming
- Avoid abbreviations
- Keep methods small and focused
- Prefer readability over cleverness

### Backend:
- Use standard Spring conventions
- Avoid business logic in controllers
- Use meaningful exception messages
- Keep transformations between DTOs and entities simple and easy to read

### Frontend:
- Use clear template structure
- Avoid logic in templates
- Keep components maintainable
- Prefer presentational ui components and keep page components orchestration-focused

---

## Docker Guidelines

- The full application must run with:
  docker compose up

- All services must start correctly:
    - backend
    - frontend
    - database
    - authentication (if applicable)

- Avoid manual steps after startup

---

## Decision Principles

When suggesting code or changes, always prefer:

1. Simplicity over complexity
2. Maintainability over cleverness
3. Explicitness over magic
4. Consistency over variation

---

## What to Avoid

- Over-engineered architectures
- Unnecessary abstractions
- Premature optimization
- Hidden logic or implicit behavior
- Inconsistent patterns across the codebase
- Forcing patterns that do not fit the size of the application