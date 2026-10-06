export type Convert = (amount: number, from: string, to: string) => number;

export const round2 = (value: number) => Math.round(value * 100) / 100;

/** `YYYY-MM-DD` prefix of a stored date (the app stores ISO strings). */
export const dayOf = (date: string) => (date || "").substring(0, 10);

export const todayKey = (now: Date) => now.toISOString().substring(0, 10);

export const TRANSFER_CATEGORY = "Transfer";
