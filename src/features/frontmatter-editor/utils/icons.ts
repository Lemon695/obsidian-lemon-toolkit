/**
 * SVG icons for the frontmatter editor
 */
export const icons = {
	string: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<path d="M4 7V4h16v3"/>
		<path d="M9 20h6"/>
		<path d="M12 4v16"/>
	</svg>`,
	
	number: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<line x1="4" y1="9" x2="20" y2="9"/>
		<line x1="4" y1="15" x2="20" y2="15"/>
		<line x1="10" y1="3" x2="8" y2="21"/>
		<line x1="16" y1="3" x2="14" y2="21"/>
	</svg>`,
	
	boolean: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<polyline points="9 11 12 14 22 4"/>
		<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
	</svg>`,
	
	date: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
		<line x1="16" y1="2" x2="16" y2="6"/>
		<line x1="8" y1="2" x2="8" y2="6"/>
		<line x1="3" y1="10" x2="21" y2="10"/>
	</svg>`,
	
	array: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<line x1="8" y1="6" x2="21" y2="6"/>
		<line x1="8" y1="12" x2="21" y2="12"/>
		<line x1="8" y1="18" x2="21" y2="18"/>
		<line x1="3" y1="6" x2="3.01" y2="6"/>
		<line x1="3" y1="12" x2="3.01" y2="12"/>
		<line x1="3" y1="18" x2="3.01" y2="18"/>
	</svg>`,
	
	object: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
		<polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
		<line x1="12" y1="22.08" x2="12" y2="12"/>
	</svg>`,
	
	null: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<circle cx="12" cy="12" r="10"/>
		<line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
	</svg>`,
	
	edit: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
		<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
	</svg>`,
	
	delete: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<polyline points="3 6 5 6 21 6"/>
		<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
		<line x1="10" y1="11" x2="10" y2="17"/>
		<line x1="14" y1="11" x2="14" y2="17"/>
	</svg>`,
	
	search: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<circle cx="11" cy="11" r="8"/>
		<path d="m21 21-4.35-4.35"/>
	</svg>`,
};

/**
 * Get SVG icon for field type
 */
export function getTypeIconSVG(type: string): string {
	return icons[type as keyof typeof icons] || icons.string;
}
