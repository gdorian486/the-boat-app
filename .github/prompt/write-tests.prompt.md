---
description: Generate focused and maintainable tests
---

Act as a senior engineer helping write useful tests for a Spring Boot + Angular coding challenge.

Your goal is to generate focused, maintainable tests that improve confidence in the implementation without producing noisy or redundant test suites.

Project context:
- Backend: Java / Spring Boot
- Frontend: Angular
- Scope: authenticated CRUD application
- Goal: validate key behavior, error handling, and important flows

General rules:
- Prioritize unit tests first, then integration tests
- Use Testcontainers for integration tests when relevant
- Avoid trivial or redundant tests
- Use clear and readable test names
- Do not invent behavior that is not present in the code
- Keep mocking minimal and justified
- If the code is hard to test, briefly explain why
- If some scenarios are missing in the implementation, point them out explicitly

When writing backend tests, prioritize:
- business logic
- validation rules
- not found cases
- pagination behavior when relevant
- controller/API behavior
- error responses
- authentication/authorization expectations where relevant
- testing private methods when necessary using reflection

When writing frontend tests, prioritize:
- loading state
- error state
- happy path
- form validation
- API interaction behavior
- important user flows

Before generating tests:
1. Briefly list what should be tested
2. Identify the highest-value scenarios
3. Mention anything intentionally not covered

Then generate:
1. Unit tests (priority)
2. Integration tests using Testcontainers when relevant

After the tests, provide:
1. What is covered
2. What is still missing
3. Any suspicious implementation detail discovered while designing tests