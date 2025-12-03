import { FieldType } from "../types";

/**
 * Infer the type of a frontmatter field value
 */
export function inferFieldType(value: any): FieldType {
	if (value === null || value === undefined) {
		return "null";
	}

	if (typeof value === "boolean") {
		return "boolean";
	}

	if (typeof value === "number") {
		return "number";
	}

	if (Array.isArray(value)) {
		return "array";
	}

	if (typeof value === "object") {
		return "object";
	}

	if (typeof value === "string") {
		// Check if it's a date format (YYYY-MM-DD)
		if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
			return "date";
		}
		return "string";
	}

	return "string";
}

/**
 * Convert a string value to the appropriate type
 */
export function convertValueToType(value: string, type: FieldType): any {
	switch (type) {
		case "boolean":
			return value.toLowerCase() === "true";
		case "number":
			return parseFloat(value);
		case "array":
			return value.split(",").map((v) => v.trim());
		case "null":
			return null;
		case "date":
		case "string":
		default:
			return value;
	}
}


