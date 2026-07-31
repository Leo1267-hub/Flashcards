import { ApiError } from "./api";

export type FieldErrors = Partial<Record<string, string>>;

const FIELD_LABELS: Record<string, string> = {
    username: "Username",
    email: "Email",
    password: "Password",
};

type ValidationItem = {
    type?: string;
    loc?: unknown[];
    msg?: string;
    ctx?: {
        min_length?: number;
        max_length?: number;
    };
};

function fieldLabel(field: string): string {
    return FIELD_LABELS[field] ?? field;
}

function friendlyValidationMessage(field: string, item: ValidationItem): string {
    const label = fieldLabel(field);

    switch (item.type) {
        case "string_too_short":
            return `${label} must be at least ${item.ctx?.min_length ?? 1} characters`;
        case "string_too_long":
            return `${label} must be at most ${item.ctx?.max_length ?? 0} characters`;
        case "missing":
            return `${label} is required`;
        case "value_error":
        case "value_error.email": {
            const msg = item.msg ?? "";
            if (field === "email" || /email/i.test(msg)) {
                return "Enter a valid email address";
            }
            return msg.replace(/^Value error,\s*/i, "") || `Invalid ${label.toLowerCase()}`;
        }
        default: {
            if (typeof item.msg === "string" && item.msg.trim()) {
                return item.msg.replace(/^Value error,\s*/i, "");
            }
            return `Invalid ${label.toLowerCase()}`;
        }
    }
}

export function getFieldErrors(error: unknown): FieldErrors {
    if (!(error instanceof ApiError) || !Array.isArray(error.detail)) {
        return {};
    }

    const errors: FieldErrors = {};

    for (const raw of error.detail) {
        if (!raw || typeof raw !== "object") {
            continue;
        }

        const item = raw as ValidationItem;
        if (!Array.isArray(item.loc) || item.loc.length === 0) {
            continue;
        }

        const field = item.loc[item.loc.length - 1];
        if (typeof field !== "string" || errors[field]) {
            continue;
        }

        errors[field] = friendlyValidationMessage(field, item);
    }

    return errors;
}

export function getFormError(error: unknown, fallback: string): string {
    if (!(error instanceof ApiError)) {
        return fallback;
    }

    if (typeof error.detail === "string" && error.detail.trim()) {
        return error.detail;
    }

    // Field-level validation errors are shown under inputs instead.
    if (Array.isArray(error.detail) && error.detail.length > 0) {
        return "";
    }

    return fallback;
}
