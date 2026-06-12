// Shared font catalog for editor, export UI, and bundled font copy script.
// `package` is the @fontsource npm package slug; omit for OS/system fonts.

export const FONT_CATALOG = [
    { label: 'System UI', value: 'system-ui', system: true },
    { label: 'Roboto', value: '"Roboto", sans-serif', package: 'roboto', family: 'Roboto' },
    { label: 'Open Sans', value: '"Open Sans", sans-serif', package: 'open-sans', family: 'Open Sans' },
    { label: 'Lato', value: '"Lato", sans-serif', package: 'lato', family: 'Lato' },
    { label: 'Montserrat', value: '"Montserrat", sans-serif', package: 'montserrat', family: 'Montserrat' },
    { label: 'Raleway', value: '"Raleway", sans-serif', package: 'raleway', family: 'Raleway' },
    { label: 'Nunito', value: '"Nunito", sans-serif', package: 'nunito', family: 'Nunito' },
    { label: 'Archivo', value: '"Archivo", sans-serif', package: 'archivo', family: 'Archivo' },
    { label: 'Helvetica', value: '"Helvetica", sans-serif', system: true, family: 'Helvetica' },
    { label: 'Inter', value: '"Inter", sans-serif', package: 'inter', family: 'Inter' },
    { label: 'Source Sans Pro', value: '"Source Sans Pro", sans-serif', package: 'source-sans-pro', family: 'Source Sans Pro' },
    { label: 'Noto Sans', value: '"Noto Sans", sans-serif', package: 'noto-sans', family: 'Noto Sans' },
    { label: 'Exo 2', value: '"Exo 2", sans-serif', package: 'exo-2', family: 'Exo 2' },
    { label: 'Audiowide', value: '"Audiowide", sans-serif', package: 'audiowide', family: 'Audiowide' },
    { label: 'Electrolize', value: '"Electrolize", sans-serif', package: 'electrolize', family: 'Electrolize' },
    { label: 'Saira', value: '"Saira", sans-serif', package: 'saira', family: 'Saira' },
    { label: 'Times New Roman', value: '"Times New Roman", serif', system: true, family: 'Times New Roman' },
    { label: 'Georgia', value: '"Georgia", serif', system: true, family: 'Georgia' },
    { label: 'Merriweather', value: '"Merriweather", serif', package: 'merriweather', family: 'Merriweather' },
    { label: 'Playfair Display', value: '"Playfair Display", serif', package: 'playfair-display', family: 'Playfair Display' },
    { label: 'Lora', value: '"Lora", serif', package: 'lora', family: 'Lora' },
    { label: 'PT Serif', value: '"PT Serif", serif', package: 'pt-serif', family: 'PT Serif' },
    { label: 'Crimson Text', value: '"Crimson Text", serif', package: 'crimson-text', family: 'Crimson Text' },
    { label: 'Libre Baskerville', value: '"Libre Baskerville", serif', package: 'libre-baskerville', family: 'Libre Baskerville' },
    { label: 'EB Garamond', value: '"EB Garamond", serif', package: 'eb-garamond', family: 'EB Garamond' },
    { label: 'Bitter', value: '"Bitter", serif', package: 'bitter', family: 'Bitter' },
    { label: 'Noto Serif', value: '"Noto Serif", serif', package: 'noto-serif', family: 'Noto Serif' },
    { label: 'Cinzel', value: '"Cinzel", serif', package: 'cinzel', family: 'Cinzel' },
    { label: 'Cormorant', value: '"Cormorant Garamond", serif', package: 'cormorant-garamond', family: 'Cormorant Garamond' },
    { label: 'Old Standard', value: '"Old Standard TT", serif', package: 'old-standard-tt', family: 'Old Standard TT' },
    { label: 'Spectral', value: '"Spectral", serif', package: 'spectral', family: 'Spectral' },
    { label: 'Cardo', value: '"Cardo", serif', package: 'cardo', family: 'Cardo' },
];

export const BUNDLED_FONT_VARIANTS = [
    { style: 'normal', weight: 400, suffix: '400-normal' },
    { style: 'italic', weight: 400, suffix: '400-italic' },
    { style: 'normal', weight: 700, suffix: '700-normal' },
    { style: 'italic', weight: 700, suffix: '700-italic' },
];

// Google Fonts / fontsource subset ranges — required so latin-ext files do not
// shadow basic Latin glyphs in Chromium PDF export.
export const FONT_SUBSET_UNICODE_RANGES = {
    latin: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
    'latin-ext': 'U+0100-02AF,U+0304,U+0308,U+0329,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
};

export const BUNDLED_FONT_SUBSETS = ['latin', 'latin-ext'];
