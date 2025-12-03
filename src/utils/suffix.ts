/**
 * Generate a timestamp suffix
 * @returns Timestamp string (e.g., "1733234567890")
 */
export function generateTimestamp(): string {
	return new Date().getTime().toString();
}

/**
 * Generate a short UUID suffix (8 characters)
 * @returns UUID string (e.g., "a1b2c3d4")
 */
export function generateUUID(): string {
	return "xxxxxxxx".replace(/x/g, () => {
		return Math.floor(Math.random() * 16).toString(16);
	});
}

/**
 * Generate suffix based on type
 * @param type - The type of suffix to generate
 * @returns Generated suffix string
 */
export function generateSuffix(type: "timestamp" | "uuid"): string {
	return type === "timestamp" ? generateTimestamp() : generateUUID();
}
