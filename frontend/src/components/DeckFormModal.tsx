import type { FormEvent } from "react";
import Modal from "./Modal";

type DeckFormModalProps = {
    mode: "create" | "edit";
    name: string;
    description: string;
    isSubmitting: boolean;
    isValid: boolean;
    message: string;
    onNameChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onClose: () => void;
};

function DeckFormModal({
    mode,
    name,
    description,
    isSubmitting,
    isValid,
    message,
    onNameChange,
    onDescriptionChange,
    onSubmit,
    onClose,
}: DeckFormModalProps) {
    const isCreating = mode === "create";
    const fieldPrefix = isCreating ? "deck" : "edit-deck";

    return (
        <Modal onClose={onClose}>
            <form onSubmit={onSubmit} className="flex flex-col gap-5">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {isCreating ? "Create a deck" : "Edit deck"}
                </h2>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor={`${fieldPrefix}-name`} className="field-label">Name</label>
                    <input
                        id={`${fieldPrefix}-name`}
                        className="field-input"
                        type="text"
                        value={name}
                        onChange={(event) => onNameChange(event.target.value)}
                        placeholder={isCreating ? "For example: Data Structures" : undefined}
                        maxLength={100}
                        required
                        autoFocus
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor={`${fieldPrefix}-description`} className="field-label">Description</label>
                    <textarea
                        id={`${fieldPrefix}-description`}
                        className="field-input min-h-24 resize-y"
                        value={description}
                        onChange={(event) => onDescriptionChange(event.target.value)}
                        placeholder={isCreating ? "What will this deck contain?" : undefined}
                        maxLength={500}
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
                            : isCreating ? "Create deck" : "Save changes"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default DeckFormModal;
