const API_URL = "http://127.0.0.1:8000";

export async function apiFetch(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem("access_token");

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
}