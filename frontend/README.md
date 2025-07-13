# FastAPI Project - Frontend

> **Note:** This project is an architectural refactoring of the original project [fastapi/full-stack-fastapi-template](https://github.com/fastapi/full-stack-fastapi-template).

The goal of this refactoring is to establish clean, scalable, and maintainable architectural patterns for a modern Single-Page Application (SPA) using React, TypeScript, and the TanStack ecosystem.

## Key Architectural Decisions

The frontend codebase has been significantly restructured to follow modern best practices for component design, state management, and data fetching.

### 1. Component Architecture & Feature-Based Structure

The project follows a feature-based structure combined with principles of Atomic Design:

-   **`routes` (Pages):** Each file corresponds to a specific page or layout (`_layout/admin.tsx`, `_layout/items.tsx`). These are compositional roots that assemble features and components.
-   **`components/ui` (UI Primitives):** Contains highly reusable, generic components like `Field`, `Dialog`, `Table`, which are the building blocks of the application.
-   **`components` (Feature Components):** Contains components tied to specific features, such as `EditItem` or `UserActionsMenu`. These components implement specific business logic.
-   **`hooks` (Logic Abstraction):** Custom hooks like `useAuth` and `useCustomToast` encapsulate and centralize reusable logic, keeping components clean and focused on presentation.

### 2. State Management and Data Fetching with TanStack Query

Server state management is fully delegated to TanStack Query, which acts as a centralized cache and a single source of truth for all API data.

-   **Caching and Synchronization:** TanStack Query handles all caching, background refetching, and stale-data management automatically.
-   **Mutations and Data Invalidation:** To ensure data consistency after creating, updating, or deleting entities, we use the `queryClient.invalidateQueries` pattern within the `onSuccess` callback of our mutations. This is the primary mechanism for triggering data re-fetch and keeping the UI in sync with the backend.

    ```typescript
    const mutation = useMutation({
      mutationFn: deleteUser,
      onSuccess: () => {
        // ... show success toast
        queryClient.invalidateQueries({ queryKey: ["users"] });
      },
    });
    ```

### 3. The "Action-Dialog" Component Pattern

A key architectural pattern was established for components that trigger actions in a dialog (e.g., Edit, Delete). To solve issues with state management and focus, these components are split into two parts:

-   **`Trigger`:** A simple component (e.g., a `MenuItem`) that only calls an `onOpen` function passed via props.
-   **`Dialog`:** The modal window component, whose visibility (`isOpen`) is controlled by state in the parent.

The parent component is responsible for managing the `isOpen` state and rendering the `Dialog`, ensuring clean state flow and correct menu behavior.

```tsx
// Parent Component (e.g., UserActionsMenu.tsx)
const [isEditDialogOpen, setEditDialogOpen] = useState(false);

return (
  <>
    <EditUser.Trigger onOpen={() => setEditDialogOpen(true)} />
    <EditUser.Dialog 
      isOpen={isEditDialogOpen} 
      onClose={() => setEditDialogOpen(false)} 
    />
  </>
);
```

### 4. Centralized Providers and Theming

All top-level providers (`QueryClientProvider`, `ChakraProvider`, `RouterProvider`) are consolidated in `main.tsx` and wrapped in a single `<CustomProvider>`. This creates a single, clean entry point for application-wide context and theming.

## Quick Start

1.  **Create a `.env` file:** Copy `frontend/.env.example` to `frontend/.env` and set the required variables.

    ```dotenv
    # The URL of your running backend API
    VITE_API_URL=http://localhost:8000
    
    # The URL for the Mailcatcher UI to view sent emails during development
    MAILCATCHER_HOST=http://localhost:1080
    ```

2.  **Install dependencies:** Navigate to the `/frontend` directory and run:
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The frontend will be available at http://localhost:5173/.

## API Client Generation

The TypeScript client used to communicate with the FastAPI backend is generated from the backend's OpenAPI schema.

To update the client after making changes to the backend API:

1.  Ensure the backend development server is running.
2.  From the `/frontend` directory, run the generation script:
    ```bash
    npm run generate-client
    ```3.  Commit the changes in the `frontend/src/client` directory.

## Original Features

The project's core functionality (user authentication, CRUD operations, password recovery) remains unchanged. For details on end-to-end testing with Playwright and other operational aspects not covered here, please refer to the [README of the original project](https://github.com/fastapi/full-stack-fastapi-template/blob/master/frontend/README.md).
