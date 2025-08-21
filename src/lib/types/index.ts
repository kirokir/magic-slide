// /src/lib/types/index.ts (CORRECTED)

export interface FilterSettings {
	brightness: number;
	contrast: number;
	saturate: number;
	blur: number;
}

export interface BrandingKit {
	logoUrl: string | null;
	brandColor: string;
	brandFont: string;
	showLogoOnAllSlides: boolean;
}

export interface GlobalSettings {
	// THESE ARE THE CORRECTED/ADDED LINES
	aspectRatio: '1:1' | '1.91:1' | '4:5';
	filters: FilterSettings;
	appBackgroundColor: string;
	appBackgroundImage: string | null;
	brandingKit: BrandingKit;
}

export interface Gradient {
	from: string;
	to: string;
	angle: number;
}

export interface Element {
	id: string;
	type: 'heading' | 'paragraph' | 'cta' | 'list' | 'logo' | 'image';
	content: string;
	x: number;
	y: number;
	width: number;
	height: number;
	zIndex: number;
	styles: {
		fontSize?: string;
		fontWeight?: string;
		color?: string;
		backgroundColor?: string;
		fontFamily?: string;
		isBold?: boolean;
		isItalic?: boolean;
		textAlign?: 'left' | 'center' | 'right';
		gradient?: Gradient | null;
	};
}

export interface Slide {
	id: string;
	elements: Element[];
	filters: FilterSettings | null;
	backgroundImage: string | null;
	styles: {
		backgroundColor: string;
	};
}

export interface AppState {
	slides: Slide[];
	globals: GlobalSettings;
}

export interface TemplateFile extends AppState {}