const API_URL = "http://localhost:8000";

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
        throw new Error(`Request failed: ${response.status}`);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}
