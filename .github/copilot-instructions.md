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
- Angular (latest stable)
- Angular Router
- HTTP Client
- Optional: Angular Material

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

Structure the Angular app with clear separation:

- pages → route-level components
- features → feature-specific logic and screens
- services → API communication
- models → TypeScript interfaces
- guards → route protection
- interceptors → attach authentication tokens
- ui → reusable presentational components following an atomic design approach when it adds clarity

### Rules:
- Use atomic design principles pragmatically inside the ui folder
- Keep ui components reusable, dumb, and focused on presentation when possible
- Do not force atomic design where it makes the structure harder to understand
- Use template-driven forms or reactive forms depending on the complexity of the form
- Prefer reactive forms for complex validation, dynamic controls, or advanced form state handling
- Use simpler approaches for simple forms when appropriate
- Handle loading, error, and empty states explicitly
- Keep components simple and focused
- Move API logic to services
- Avoid duplicating logic across components

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