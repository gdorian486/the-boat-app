# AI_USAGE.md

## 1. AI Tools Used

- GitHub Copilot (primary tool, used in Plan Mode for code generation)
- OpenAI Codex (used occasionally for specific code generation tasks)
- ChatGPT and Claude (used for architecture discussions, validation of approaches, and code review)

---

## 2. What I Used AI For

I used AI as an assistant, not as a decision-maker.

Main usages:
- Code generation (entities, DTOs, services, controllers)
- Writing unit and integration tests
- Generating documentation (README, comments)
- Reviewing code and suggesting improvements
- Exploring alternative implementations

I also used AI to:
- Validate API design
- Suggest test case coverage
- Identify edge cases and missing logic

---

## 3. Representative Prompts

### Prompt 1 — Backend base structure
Create the base of my Spring application:
entity/Boat:
- id (UUID)
- name
- description
- createdAt
- createdBy

repository/BoatRepository:
- getById
- create
- update
- delete
- getAll with pagination

dto/BoatRequest + BoatResponse

service/BoatService

controller/BoatController:

RestController

For the database connection, put the information in the configuration files.

No security for now.


---

### Prompt 2 — Frontend dashboard (UC2)
UC2 — Boats Dashboard

Main goal: UC2 — The authenticated user sees a paginated list of all boats.

Description

Create the main page of the app (dashboard) to display boats.

Create a service to call the API GET /api/boats with pagination.

Use Angular Material Table: https://material.angular.dev/components/table/overview

Requirements
- Display all information of the boat object in the table
- Pagination sizes available: 10, 20, 50, 100
- Default table: 10 elements per page
- Handle multiple pages
- When changing page, trigger a new API call with the corresponding page information
- Add a dark and light mode button at the bottom right
- Use the dashboard page to implement this US


---

### Prompt 3 — Manage Boats (Create / Update / Delete) (UC3)

Main goal: UC3 — The user can create, update, and delete a boat.

Description

Add actions to manage boats from the dashboard table.

Use API endpoints:
- POST /api/boats
- PUT /api/boats/{id}
- DELETE /api/boats/{id}

Requirements
Add a last column in the table with update and delete icons
#### On delete:
- Open a confirmation modal
- Ask user: yes or no before deleting
- Call DELETE /api/boats/{id} if confirmed
#### On update:
- Open a modal
- Allow modifying name and description
- Name is mandatory
- Call PUT /api/boats/{id}
#### On create:
- Add a button at the top right of the page
- Open the same modal as update
- Allow adding name and description
- Name is mandatory
#### Call POST /api/boats
- If an error occurs with the API: Display an error message using popup

---

### Prompt 4 — Test validation
Given this service, list all relevant unit test cases.

Explain what edge cases are covered and what might be missing.


---

## 4. How I Validated AI Output

I systematically validated all AI-generated content:

- Manual code review before integration
- Ensured consistency with my architecture and design choices
- Refactored or rejected:
    - Over-engineered solutions
    - Inconsistent naming
    - Incorrect or incomplete logic
- Cross-checked outputs using different AI tools when needed

For testing, I explicitly asked AI:
- what cases are covered
- what edge cases are missing

---

## 5. What I Did NOT Delegate to AI

### Architecture decisions

I kept full control over:
- Project structure
- Layer separation (Controller / Service / Repository)
- Naming conventions
- Data flow

AI was used to challenge my decisions, not to make them.

---

### Critical thinking & validation

- I did not blindly trust AI outputs
- I used precise prompts to avoid hallucinations
- I ensured each feature matched the functional requirements

---

### Final responsibility

All final implementations were:
- Reviewed manually
- Adjusted when necessary
- Fully validated before integration

---

## 6. Additional Notes

I created reusable prompts for:
- Code review
- Test generation
- Security checks

These prompts are stored in `.github/prompts` to ensure consistency and reuse across the project.