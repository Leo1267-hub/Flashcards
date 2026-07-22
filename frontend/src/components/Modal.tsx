import type { ReactNode } from "react";
import { useEffect } from "react";

type ModalProps = {
    children: ReactNode;
    onClose: () => void;
};

function Modal({ children, onClose }: ModalProps) {
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onClose();
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);
    return (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm dark:bg-slate-950/70">
            <div
                className="animate-pop-in card-surface relative w-full max-w-md p-6 sm:p-7"
                role="dialog"
                aria-modal="true"
            >
                <button
                    type="button"
                    className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    onClick={onClose}
                    aria-label="Close"
                >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
                {children}
            </div>
        </div>
    );
}

export default Modal;
