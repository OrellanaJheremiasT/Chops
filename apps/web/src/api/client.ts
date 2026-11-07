
const API_BASE_URL = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/+$/, "");

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: `/${string}`,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    const body: unknown = await response.json().catch(() => null);

    if (
      body !== null &&
      typeof body === "object" &&
      "detail" in body &&
      typeof body.detail === "string"
    ) {
      message = body.detail;
    }

    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("The API did not return JSON");
  }

  return (await response.json()) as T;
}

export function apiGet<T>(
  path: `/${string}`,
  signal?: AbortSignal
): Promise<T> {
  return apiRequest<T>(path, { method: "GET", signal });
}

export interface HealthResponse {
  status: string;
  application: string;
  version: string;
}

export async function getApiHealth(
  signal?: AbortSignal
): Promise<HealthResponse> {
  const health = await apiGet<HealthResponse>(
    "/api/v1/health",
    signal
  );

  if (
    health.status !== "UP" ||
    health.application !== "Chops API" ||
    typeof health.version !== "string"
  ) {
    throw new Error("Unexpected API health response");
  }

  return health;
}
