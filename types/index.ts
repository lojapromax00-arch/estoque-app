/**
 * Shared application types.
 * Domain-specific types go here; database row types come from database.generated.ts.
 */

export type AppEnvironment = "development" | "staging" | "production";

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}
