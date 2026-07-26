import { useLayoutEffect, useRef } from "react";
import type { KeyboardEvent } from "react";

type InlineEditableTextProps = {
    value: string;
    onChange: (value: string) => void;
    onBlur: () => void;
    onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    maxLength: number;
    ariaLabel: string;
    className?: string;
};

function InlineEditableText({
    value,
    onChange,
    onBlur,
    onKeyDown,
    placeholder,
    maxLength,
    ariaLabel,
    className = "",
}: InlineEditableTextProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useLayoutEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) {
            return;
        }

        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
    }, [value]);

    return (
        <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            maxLength={maxLength}
            aria-label={ariaLabel}
            className={`w-full resize-none overflow-hidden rounded-lg border border-transparent bg-transparent px-2.5 py-1 transition-colors hover:border-slate-200 hover:bg-white/70 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100 dark:hover:border-slate-700 dark:hover:bg-slate-900/60 dark:focus:border-brand-500 dark:focus:bg-slate-900 dark:focus:ring-brand-500/20 ${className}`}
        />
    );
}

export default InlineEditableText;
