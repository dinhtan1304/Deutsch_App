# Mobile API Sync — Sync new backend endpoints to mobile

When new API endpoints are added to the NestJS backend, create corresponding API clients and React Query hooks in the mobile app.

## Arguments

$ARGUMENTS — The backend module name or endpoint path (e.g., "notifications", "exam-speaking", "user-preferences")

## Process

### 1. Discover Backend Endpoints
- Read the controller at `deutschmeister-api/src/modules/{module}/{module}.controller.ts`
- Identify all endpoints: method, path, request body, response type
- Read the corresponding service for business logic context
- Check for DTOs in the module directory

### 2. Check Web App (reference)
- Check if `deutschmeister-web/src/lib/api/{module}.ts` already exists
- If yes, use it as the primary reference for the mobile API client
- If no, create the API client from scratch based on the backend controller

### 3. Create/Update Mobile API Client
- File: `deutschmeister-mobile/src/lib/api/{module}.ts`
- Import `{ apiGet, apiPost, apiPut, apiPatch, apiDelete }` from `./client`
- Define TypeScript interfaces for request/response types
- Create typed functions for each endpoint
- Example pattern:
  ```typescript
  export interface NotificationSettings {
    pushEnabled: boolean;
    dailyReminder: boolean;
    reminderTime: string;
  }

  export const notificationsApi = {
    getSettings: () => apiGet<NotificationSettings>('/notifications/settings'),
    updateSettings: (data: Partial<NotificationSettings>) => apiPatch<NotificationSettings>('/notifications/settings', data),
  };
  ```

### 4. Create/Update React Query Hook
- File: `deutschmeister-mobile/src/hooks/use{Module}.ts`
- Query keys factory pattern
- `useQuery` for GET endpoints
- `useMutation` for POST/PUT/PATCH/DELETE with cache invalidation
- Example pattern:
  ```typescript
  export const notificationKeys = {
    all: ['notifications'] as const,
    settings: () => [...notificationKeys.all, 'settings'] as const,
  };

  export function useNotificationSettings() {
    return useQuery({
      queryKey: notificationKeys.settings(),
      queryFn: notificationsApi.getSettings,
    });
  }
  ```

### 5. Update Exports
- Add to `src/lib/api/index.ts` if it exists
- Add to `src/hooks/index.ts` if it exists

### 6. Report
- List all endpoints synced
- List any types that were created
- Note any endpoints that need additional mobile-specific handling (e.g., file uploads, push tokens)
