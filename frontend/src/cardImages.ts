import { apiFetch } from "./api";
import type { Card, CardSide } from "./types/card";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
];

export const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(",");

export function uploadCardImage(
    cardId: number,
    side: CardSide,
    file: File
): Promise<Card> {
    const formData = new FormData();
    formData.append("image", file);

    return apiFetch(`/cards/${cardId}/images/${side}`, {
        method: "PUT",
        body: formData,
    });
}

export function deleteCardImage(cardId: number, side: CardSide): Promise<Card> {
    return apiFetch(`/cards/${cardId}/images/${side}`, { method: "DELETE" });
}
