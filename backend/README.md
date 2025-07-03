# FastAPI Project - Backend

> **Note:** This project is an architectural refactoring of the original project [fastapi/full-stack-fastapi-template](https://github.com/fastapi/full-stack-fastapi-template).

The main goal of this fork is to rework the architecture into an object-oriented model with explicit dependency management and asynchronous data access.


## Key Architectural Decisions

The entire codebase has been rewritten using classes for better encapsulation, reusability, and testability.


### 1. Layered Architecture

The project has clearly defined layers:

-   **`main.py` (Application Layer):** The `AppFactory` class is responsible for creating and configuring the FastAPI instance, including `lifespan` for managing resources (e.g., database connections) and attaching routers.
-   **`routes` (Presentation Layer):** All routers (`users`, `items`, etc.) are implemented as class-based views using `fastapi-utils`. This allows grouping related endpoints and reusing logic through private methods.
-   **`deps.py` (Dependency Management Layer):** A central module for all FastAPI dependencies. All dependencies are implemented as "callable" provider classes (`CurrentUserProvider`, `ItemCRUDProvider`), ensuring consistency and clean code.
-   **`crud` (Data Access Layer):** For each main model (`User`, `Item`), a corresponding `...CRUD` class (Repository Pattern) is created, encapsulating all database operations (create, read, update, delete). These classes accept an `AsyncSession` in their constructor.
-   **`core` (Core Layer):** Contains singleton managers (`DatabaseManager`, `SecurityManager`, `EmailManager`), settings (`Settings`), and other foundational components.


### 2. Dependency Management (`deps.py`)

All dependencies, especially those requiring configuration or access to other services, are implemented as classes with a `__call__` method.

```python
class UserCRUDProvider:
    def __call__(self, session: SessionDep) -> UserCRUD:
        return UserCRUD(session=session)

UserCRUDDep: Type[UserCRUD] = Annotated[UserCRUD, Depends(UserCRUDProvider())]
```
This approach allows for creating complex dependencies while maintaining clean and predictable code.


### 3. Singleton Managers

Global services such as DatabaseManager, SecurityManager, and EmailManager are implemented as singletons using the @lru_cache(maxsize=1) decorator. This is a modern way to ensure that only one instance of each manager exists in the application.

```python
@lru_cache(maxsize=1)
def get_db_manager() -> DatabaseManager:
    return DatabaseManager(settings=get_settings())
```


### 4. Lifespan Management

Database connection and disconnection are now managed through the modern lifespan context manager in `app/main.py`, which is the recommended practice in FastAPI, replacing the outdated `on_startup` / `on_shutdown` events.


## Quick Start

1. Create a `.env` file: Copy `.env.example` to `.env` and fill in the required variables, especially for database connection and email server settings.
2. Install dependencies:

    ```bash
    pip install -r requirements.txt
    ```

3. Run the server:

    ```bash
    uvicorn app.main:app --reload --log-config log_config.yaml
    ```

   The server will be available at http://127.0.0.1:8000.


## Configuration (.env)

Key environment variables for configuration:

   ```dotenv
   # Environment: local, staging, or production
   ENVIRONMENT=local
   # PostgreSQL
   POSTGRES_SERVER=localhost
   POSTGRES_PORT=5432
   POSTGRES_USER=your_db_user
   POSTGRES_PASSWORD=your_db_password
   POSTGRES_DB=your_db_name
   # Email settings
   EMAILS_ENABLED=True
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_gmail@gmail.com
   SMTP_PASSWORD=your_google_app_password
   SMTP_TLS=True
   EMAILS_FROM_EMAIL=your_gmail@gmail.com
   # Frontend URL
   FRONTEND_HOST=http://localhost:3000
   ```

## Original Features

The project's functionality (registration, CRUD operations for users and items, password recovery) remains unchanged. For a detailed description of the features, refer to the [README of the original project](https://github.com/fastapi/full-stack-fastapi-template/blob/master/README.md).