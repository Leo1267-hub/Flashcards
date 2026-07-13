import type { ReactNode } from "react";

type ModalProps = {
    children: ReactNode;
    onClose: () => void;
};

function Modal({ children, onClose }: ModalProps) {
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
