import { useState } from "react";
import type { ChangeEventHandler } from "react";

type PasswordInputProps = {
    id: string;
    value: string;
    onChange: ChangeEventHandler<HTMLInputElement>;
    placeholder?: string;
    autoComplete?: string;
};

function PasswordInput({
    id,
    value,
    onChange,
    placeholder = "••••••••",
    autoComplete,
}: PasswordInputProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative">
            <input
                id={id}
                className="field-input pr-11"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                type={isVisible ? "text" : "password"}
                autoComplete={autoComplete}
            />
            <button
                type="button"
                className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 transition-colors hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
                onClick={() => setIsVisible((current) => !current)}
                aria-label={isVisible ? "Hide password" : "Show password"}
                title={isVisible ? "Hide password" : "Show password"}
            >
                {isVisible ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                        <path d="M1 1l22 22" />
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                )}
            </button>
        </div>
    );
}

export default PasswordInput;
