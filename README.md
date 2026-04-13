# Boat App

A fullstack CRUD application for managing boats, built with Spring Boot, Angular, PostgreSQL, and Keycloak.

---

## Run

```bash
docker compose up --build
```

| Service    | URL                                   |
|------------|---------------------------------------|
| Frontend   | http://localhost:4200                 |
| API        | http://localhost:8080                 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| Keycloak   | http://localhost:8081                 |

---

## Demo Account

| Field    | Value        |
|----------|--------------|
| Username | `captain`    |
| Password | `captain123` |

Use these credentials to log in on the frontend or to obtain a token manually.

---

## API Endpoints

All endpoints require a valid Bearer token except Swagger UI, which is left public for testing convenience.

| Method   | Path              | Description      |
|----------|-------------------|------------------|
| `GET`    | `/api/boats`      | List all boats   |
| `GET`    | `/api/boats/{id}` | Get a boat by ID |
| `POST`   | `/api/boats`      | Create a boat    |
| `PUT`    | `/api/boats/{id}` | Update a boat    |
| `DELETE` | `/api/boats/{id}` | Delete a boat    |

---

## Swagger UI

Swagger is available at:

```
http://localhost:8080/swagger-ui.html
```

It is intentionally left **public** (no authentication required to access the UI) to make it easy to explore and test the API during a demo or review.

To call protected endpoints from Swagger, click **Authorize** and paste the access token as:

---

## Why Keycloak

Keycloak is one of the most widely used open-source identity providers. It handles the full OAuth2/OIDC flow out of the box — no custom authentication code needed on the backend or frontend.

- The backend uses `spring-boot-starter-oauth2-resource-server` to validate JWTs issued by Keycloak. No auth logic to write, just configuration.
- The frontend uses the official `keycloak-angular` library, which handles login redirects, token refresh, and attaching the Bearer token to API requests automatically.
- The realm and demo user are imported automatically at startup — no manual setup required.
