export class Theme {
  private name = "";
  private colorScheme?: ColorScheme;
  private fontScheme?: FontScheme;
  private formatScheme?: FormatScheme;

  constructor(name?: string) {
    this.name = name || '';
  }

  getName(): string {
    return this.name;
  }

  setColorScheme(colorScheme: ColorScheme): void {
    this.colorScheme = colorScheme;
  }

  getColorScheme(): ColorScheme | undefined {
    return this.colorScheme;
  }

  setFontScheme(fontScheme: FontScheme): void {
    this.fontScheme = fontScheme;
  }

  getFontScheme(): FontScheme | undefined {
    return this.fontScheme;
  }

  setFormatScheme(formatScheme: FormatScheme): void {
    this.formatScheme = formatScheme;
  }

  getFormatScheme(): FormatScheme | undefined {
    return this.formatScheme;
  }

  getColor(colorType: ThemeColorType): string | undefined {
    if (!this.colorScheme) return undefined;
    return this.colorScheme[colorType];
  }

  // Methods expected by tests
  setThemeColor(colorType: string, color: string): void {
    if (!this.colorScheme) {
      this.colorScheme = {} as ColorScheme;
    }
    (this.colorScheme as any)[colorType] = color;
  }

  getThemeColor(colorType: string): string | undefined {
    if (!this.colorScheme) return undefined;
    return (this.colorScheme as any)[colorType];
  }

  setFontName(fontName: string): void {
    if (!this.fontScheme) {
      this.fontScheme = {
        majorFont: { latin: "", ea: "", cs: "" },
        minorFont: { latin: "", ea: "", cs: "" },
      };
    }
    this.fontScheme.majorFont.latin = fontName;
    this.fontScheme.minorFont.latin = fontName;
  }

  getFontName(): string {
    return this.fontScheme?.majorFont?.latin || "";
  }

  toJSON(): any {
    return {
      name: this.name,
      colorScheme: this.colorScheme,
      fontScheme: this.fontScheme,
      formatScheme: this.formatScheme,
    };
  }
}

export interface ColorScheme {
  accent1: string;
  accent2: string;
  accent3: string;
  accent4: string;
  accent5: string;
  accent6: string;
  lt1: string;
  lt2: string;
  dk1: string;
  dk2: string;
  hyperlink: string;
  followedHyperlink: string;
}

export type ThemeColorType = keyof ColorScheme;

export interface FontScheme {
  majorFont: {
    latin: string;
    ea: string;
    cs: string;
  };
  minorFont: {
    latin: string;
    ea: string;
    cs: string;
  };
}

export interface FormatScheme {
  fillStyles: any[];
  lineStyles: any[];
  effectStyles: any[];
  backgroundFillStyles: any[];
}
