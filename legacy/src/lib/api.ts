export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  status: number;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(endpoint, {
      ...options,
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    let data: T | null = null;
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text as unknown as T;
      }
    }

    if (!res.ok) {
      const errorMsg =
        (data && typeof data === "object" && "error" in data
          ? String((data as any).error)
          : null) || res.statusText || "Request failed";
      return { data, error: errorMsg, status: res.status };
    }

    return { data, error: null, status: res.status };
  } catch (err: any) {
    return { data: null, error: err.message || "Network error", status: 0 };
  }
}

export const api = {
  get: <T = any>(url: string) => apiFetch<T>(url, { method: "GET" }),
  post: <T = any>(url: string, body?: any) =>
    apiFetch<T>(url, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
};
