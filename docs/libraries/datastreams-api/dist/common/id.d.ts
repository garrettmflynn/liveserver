declare global {
    interface Crypto {
        randomUUID: () => string;
    }
}
export declare const randomUUID: () => string;
