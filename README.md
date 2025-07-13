# Full Stack FastAPI Template (Refactored)

> **Note:** This project is a comprehensive architectural refactoring of the original project [fastapi/full-stack-fastapi-template](https://github.com/fastapi/full-stack-fastapi-template).

The main goal of this fork is to evolve the original template into an opinionated, production-ready boilerplate, showcasing modern best practices for both backend and frontend development. The focus has shifted from a simple template to a robust foundation with a clean, scalable, and testable architecture.

## About this Project

This project is designed as a learning resource and a high-quality starting point for new applications. Key philosophies include:

-   **Explicit is better than implicit:** Dependencies, configurations, and data flows are clearly defined.
-   **Clean Architecture:** Clear separation of concerns between layers (presentation, business logic, data access).
-   **Modern Best Practices:** Utilization of the latest stable features from FastAPI, React, and their respective ecosystems.

## Key Architectural Decisions

This project implements several key patterns that define its structure:

### Backend

-   **Layered Architecture:** The code is strictly separated into layers: `routes` (presentation), `deps` (dependency management), `crud` (data access), and `core` (business logic and configuration).
-   **Object-Oriented Design:** The entire backend is rewritten using classes (`AppFactory`, class-based views, provider classes, repositories) to improve encapsulation, reusability, and testability.
-   **Explicit Dependency Management:** A central `deps.py` module defines all FastAPI dependencies as "callable" provider classes, ensuring consistency and clean, predictable code.
-   **Repository Pattern:** Database operations are encapsulated in `CRUD` classes, abstracting away the data access logic from the business logic.

### Frontend

-   **Component-Driven Architecture:** The UI is built using a feature-based structure. A clear distinction is made between reusable UI primitives (`/components/ui`) and feature-specific components (`/components`).
-   **Centralized State Management:** Server state is exclusively managed by **TanStack Query**, which acts as a single source of truth for all API data, handling caching, refetching, and synchronization.
-   **The "Action-Dialog" Pattern:** A standardized pattern for components that trigger actions in a dialog (e.g., Edit, Delete), separating the `Trigger` from the `Dialog` to ensure a clean, unidirectional data flow.

## Technology Stack

-   ⚡ [**FastAPI**](https://fastapi.tiangolo.com) for the Python backend API.
    -   🧰 [**SQLModel**](https://sqlmodel.tiangolo.com) for Python SQL database interactions (ORM).
    -   🔍 [**Pydantic**](https://docs.pydantic.dev) for data validation and settings management.
    -   💾 [**PostgreSQL**](https://www.postgresql.org) as the SQL database.
-   🚀 [**React**](https://react.dev) for the frontend.
    -   ✨ **TypeScript** for robust type safety.
    -   ⚛️ [**TanStack Query**](https://tanstack.com/query) & [**TanStack Router**](https://tanstack.com/router) for state management and routing.
    -   🎨 [**Chakra UI**](https://chakra-ui.com) for the component library.
    -   🤖 An automatically generated API client via [**openapi-ts**](https://github.com/hey-api/openapi-ts).
    -   🦇 Dark mode support.
-   🔑 JWT (JSON Web Token) authentication with email-based password recovery.
-   ✅ Unit tests with [**Pytest**](https://pytest.org) and [**Vitest**](https://vitest.dev).

## Screenshots

*The UI functionality remains the same as in the original project.*

|                  Login                   |                   Admin Dashboard                    |
|:----------------------------------------:|:----------------------------------------------------:|
| [![Login](img/login.png)](img/login.png) | [![Dashboard](img/dashboard.png)](img/dashboard.png) |

|                             Create User                              |                          Items List                          |
|:--------------------------------------------------------------------:|:------------------------------------------------------------:|
| [![Create User](img/dashboard-create.png)](img/dashboard-create.png) | [![Items](img/dashboard-items.png)](img/dashboard-items.png) |

|                                    User Settings                                     |                           Dark Mode                            |
|:------------------------------------------------------------------------------------:|:--------------------------------------------------------------:|
| [![User Settings](img/dashboard-user-settings.png)](img/dashboard-user-settings.png) | [![Dark Mode](img/dashboard-dark.png)](img/dashboard-dark.png) |

## Quick Start (Local Development)

This project is designed to be run locally without Docker.

### 1. Backend

-   Navigate to the `backend/` directory.
-   Create and configure your `.env` file from `.env.example`.
-   Install dependencies: `pip install -r requirements.txt`.
-   Run initial database creation: `python src/app/initial_data.py`.
-   Run the server: `uvicorn app.main:app --reload`.

*(For detailed instructions, see the [Backend README](https://github.com/rin-gil/full-stack-fastapi-template/blob/master/backend/README.md)).*

### 2. Frontend

-   Navigate to the `frontend/` directory.
-   Create and configure your `.env` file from `.env.example`.
-   Install dependencies: `npm install`.
-   Generate the API client: `npm run generate-client`.
-   Run the development server: `npm run dev`.

*(For detailed instructions, see the [Frontend README](https://github.com/rin-gil/full-stack-fastapi-template/blob/master/frontend/README.md)).*

## License

This project is licensed under the terms of the [MIT license](https://github.com/rin-gil/full-stack-fastapi-template/blob/master/LICENSE.md).
