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
            <form onSubmit={onSubmit}>
                <h2>{isCreating ? "Create a deck" : "Edit deck"}</h2>

                <div>
                    <label htmlFor={`${fieldPrefix}-name`}>Name</label>
                    <input
                        id={`${fieldPrefix}-name`}
                        type="text"
                        value={name}
                        onChange={(event) => onNameChange(event.target.value)}
                        placeholder={isCreating ? "For example: Data Structures" : undefined}
                        maxLength={100}
                        required
                        autoFocus
                    />
                </div>

                <div>
                    <label htmlFor={`${fieldPrefix}-description`}>Description</label>
                    <textarea
                        id={`${fieldPrefix}-description`}
                        value={description}
                        onChange={(event) => onDescriptionChange(event.target.value)}
                        placeholder={isCreating ? "What will this deck contain?" : undefined}
                        maxLength={500}
                    />
                </div>

                {message && <p role="alert">{message}</p>}

                <div className="modal-actions">
                    <button type="button" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting || !isValid}>
                        {isSubmitting
                            ? isCreating ? "Creating..." : "Saving..."
                            : isCreating ? "Create deck" : "Save changes"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default DeckFormModal;
