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
            <form onSubmit={onSubmit}>
                <h2>{isCreating ? "Create a card" : "Edit card"}</h2>

                <div>
                    <label htmlFor={`${fieldPrefix}-front`}>Front</label>
                    <textarea
                        id={`${fieldPrefix}-front`}
                        value={front}
                        onChange={(event) => onFrontChange(event.target.value)}
                        placeholder={isCreating ? "Question or prompt" : undefined}
                        maxLength={500}
                        required
                        autoFocus
                    />
                </div>

                <div>
                    <label htmlFor={`${fieldPrefix}-back`}>Back</label>
                    <textarea
                        id={`${fieldPrefix}-back`}
                        value={back}
                        onChange={(event) => onBackChange(event.target.value)}
                        placeholder={isCreating ? "Answer" : undefined}
                        maxLength={500}
                        required
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
                            : isCreating ? "Create card" : "Save changes"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default CardFormModal;
