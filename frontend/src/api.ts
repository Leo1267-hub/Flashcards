const API_URL = "http://localhost:8000";

export class ApiError extends Error {
    status: number;
    detail: unknown;

    constructor(status: number, detail: unknown) {
        super(apiErrorMessage(detail, status));
        this.name = "ApiError";
        this.status = status;
        this.detail = detail;
    }
}

function apiErrorMessage(detail: unknown, status: number): string {
    if (typeof detail === "string" && detail.trim()) {
        return detail;
    }
    return `Request failed: ${status}`;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem("access_token");
    // FormData bodies need the browser to set Content-Type so that the
    // multipart boundary is included.
    const isFormData = options.body instanceof FormData;

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        credentials: "include",
        headers: {
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (!response.ok) {
        let detail: unknown = null;
        try {
            const body = await response.json();
            detail = body?.detail ?? body;
        } catch {
            detail = null;
        }
        throw new ApiError(response.status, detail);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}
