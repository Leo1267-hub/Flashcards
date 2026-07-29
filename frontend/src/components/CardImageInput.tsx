import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import {
    ALLOWED_IMAGE_TYPES,
    IMAGE_ACCEPT,
    MAX_IMAGE_BYTES,
} from "../cardImages";

type CardImageInputProps = {
    id: string;
    label: string;
    file: File | null;
    existingUrl: string | null;
    onFileSelect: (file: File | null) => void;
    onRemove: () => void;
    disabled?: boolean;
};

function CardImageInput({
    id,
    label,
    file,
    existingUrl,
    onFileSelect,
    onRemove,
    disabled = false,
}: CardImageInputProps) {
    const [error, setError] = useState("");
    const [objectUrl, setObjectUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!file) {
            setObjectUrl(null);
            return;
        }

        const url = URL.createObjectURL(file);
        setObjectUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [file]);

    const previewUrl = objectUrl ?? existingUrl;

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const selected = event.target.files?.[0] ?? null;
        // Reset the input so picking the same file again still fires a change.
        event.target.value = "";

        if (!selected) {
            return;
        }

        if (!ALLOWED_IMAGE_TYPES.includes(selected.type)) {
            setError("Choose a JPEG, PNG, WebP, or GIF image.");
            return;
        }

        if (selected.size > MAX_IMAGE_BYTES) {
            setError("Image must be 5 MB or smaller.");
            return;
        }

        setError("");
        onFileSelect(selected);
    }

    function handleRemove() {
        setError("");
        onRemove();
    }

    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={id} className="field-label">
                {label} <span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span>
            </label>

            {previewUrl && (
                <div className="flex items-center gap-3">
                    <img
                        src={previewUrl}
                        alt={label}
                        className="h-20 w-20 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                    />
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleRemove}
                        disabled={disabled}
                    >
                        Remove
                    </button>
                </div>
            )}

            <input
                id={id}
                type="file"
                accept={IMAGE_ACCEPT}
                onChange={handleChange}
                disabled={disabled}
                aria-invalid={error.length > 0}
                className="w-full cursor-pointer text-sm text-slate-500 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:file:bg-brand-500/15 dark:file:text-brand-300 dark:hover:file:bg-brand-500/25"
            />

            {error && (
                <p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-400">
                    {error}
                </p>
            )}
        </div>
    );
}

export default CardImageInput;
