export type FieldType = "string" | "number" | "boolean" | "date" | "array" | "object" | "null";

export interface FieldTemplate {
	id: string;
	name: string;
	fields: TemplateField[];
}

export interface TemplateField {
	key: string;
	defaultValue: string;
	type: FieldType;
}

export interface QuickAction {
	id: string;
	label: string;
	action: "set" | "add" | "toggle";
	field: string;
	value?: string;
}

export interface FrontmatterEditorSettings {
	templates: FieldTemplate[];
	quickActions: QuickAction[];
	dateFormat: string;
	closeAfterSave: boolean;
	showTypeIcons: boolean;
}

export interface FieldData {
	key: string;
	value: any;
	type: FieldType;
	isModified: boolean;
	isDeleted: boolean;
	isNew: boolean;
}
