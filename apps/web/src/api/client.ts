
const API_BASE_URL = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export async function apiGet<T>(
  path: `/${string}`,
  signal?: AbortSignal
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
    }
  );

  if (!response.ok) {
    throw new Error(
      `API request failed: HTTP ${response.status}`
    );
  }

  const contentType =
    response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error("The API did not return JSON");
  }

  return (await response.json()) as T;
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
