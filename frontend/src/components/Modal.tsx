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
        <div className="modal-backdrop">
            <div className="modal" role="dialog" aria-modal="true">
                <button
                    type="button"
                    className="modal-close"
                    onClick={onClose}
                    aria-label="Close"
                >
                    ×
                </button>
                {children}
            </div>
        </div>
    );
}

export default Modal;
