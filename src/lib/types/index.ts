export interface Element {
	id: string;
	type: 'heading' | 'paragraph' | 'cta' | 'list' | 'logo';
	content: string;
	x: number;
	y: number;
	width: number;
	height: number;
	styles: {
		fontSize?: string;
		fontWeight?: string;
		color?: string;
		backgroundColor?: string;
		fontFamily?: string;
	};
}

export interface Slide {
	id: string;
	elements: Element[];
	styles: {
		backgroundColor: string;
	};
}

export interface GlobalSettings {
	themeColor: string;
	fontFamily: string;
	logoUrl: string | null;
}

export interface TemplateFile {
	globals: GlobalSettings;
	slides: Slide[];
}