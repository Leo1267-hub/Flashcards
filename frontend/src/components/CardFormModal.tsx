import type { FormEvent } from "react";
import Modal from "./Modal";

type CardFormModalProps = {
    mode: "create" | "edit";
    front: string;
    back: string;
    isSubmitting: boolean;
    isValid: boolean;
    message: string;
    onFrontChange: (value: string) => void;
    onBackChange: (value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onClose: () => void;
};

function CardFormModal({
    mode,
    front,
    back,
    isSubmitting,
    isValid,
    message,
    onFrontChange,
    onBackChange,
    onSubmit,
    onClose,
}: CardFormModalProps) {
    const isCreating = mode === "create";
    const fieldPrefix = isCreating ? "card" : "edit-card";

    return (
        <Modal onClose={onClose}>
            <form onSubmit={onSubmit} className="flex flex-col gap-5">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {isCreating ? "Create a card" : "Edit card"}
                </h2>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor={`${fieldPrefix}-front`} className="field-label">Front</label>
                    <textarea
                        id={`${fieldPrefix}-front`}
                        className="field-input min-h-24 resize-y"
                        value={front}
                        onChange={(event) => onFrontChange(event.target.value)}
                        placeholder={isCreating ? "Question or prompt" : undefined}
                        maxLength={500}
                        required
                        autoFocus
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor={`${fieldPrefix}-back`} className="field-label">Back</label>
                    <textarea
                        id={`${fieldPrefix}-back`}
                        className="field-input min-h-24 resize-y"
                        value={back}
                        onChange={(event) => onBackChange(event.target.value)}
                        placeholder={isCreating ? "Answer" : undefined}
                        maxLength={500}
                        required
                    />
                </div>

                {message && (
                    <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                        {message}
                    </p>
                )}

                <div className="flex justify-end gap-3">
                    <button type="button" className="btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={isSubmitting || !isValid}>
                        {isSubmitting
                            ? isCreating ? "Creating…" : "Saving…"
                            : isCreating ? "Create card" : "Save changes"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default CardFormModal;
