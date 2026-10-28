# SUPRA Writer v0.2 — Font & accessibility research

## Scope
The application includes a **searchable catalogue of 162 distinct font-family names** across readability, modern, book, creative, monospace, and world-script families. The catalogue does not ship 162 font files. A font is rendered if it is installed locally, loaded through the custom font-file picker, or available in the browser's font environment; otherwise a system fallback is used.

The chosen approach extends beyond any fixed list: users can enter any installed family name, import TTF/OTF/WOFF/WOFF2 files in a browser session (max 8 MB per file), or ask the browser to list locally installed families when the optional permission-based API is supported.

## Major readability-oriented font families

| Font | Origin/design purpose | License/source | Caveat |
|---|---|---|---|
| Atkinson Hyperlegible Next | Braille Institute; distinguish similar letterforms, low-vision legibility | SIL OFL 1.1, https://github.com/googlefonts/atkinson-hyperlegible-next | Not guaranteed optimal for every individual |
| Atkinson Hyperlegible Mono | Fixed-width version of the legible design | Official Braille Institute family; obtain via authorized source | Uses more horizontal space |
| OpenDyslexic | Heavy-base letterforms, developed with dyslexic readers in mind | SIL OFL in current releases, https://opendyslexic.org/ | No reliable group-level benefit in reading research |
| Lexend | Open spacing and distinctive type shapes | Google Fonts / SIL OFL, https://fonts.google.com/specimen/Lexend | May increase line lengths or page count |
| Readex Pro | Lexend-related Latin/Arabic family | Open-source project, https://github.com/ThomasJockin/readexpro | Language-specific support varies |
| Andika | Clear letterforms for literacy and multilingual use | SIL OFL, https://software.sil.org/andika/ | User preference is decisive |
| ABeeZee | Children's learning and clear letter shapes | Google Fonts, https://fonts.google.com/specimen/ABeeZee | Not a clinical intervention |
| Comic Neue | More formal reinterpretation of comic lettering | Open-source family, https://fonts.google.com/specimen/Comic+Neue | Aesthetic preference varies |

**There is no established font specific to autism that works optimally for everyone.** An individualized reading environment may be more helpful: font size, line length, line spacing, word/letter spacing, background/foreground contrast, motion reduction, and predictable layout. The Calm reading and Clear characters looks are *options* rather than diagnostic prescriptions.

## Evidence
- Azzarello et al. (2026), 15-study meta-analysis, N=688, overall effect g=-0.04 with 95% CI [-0.15,0.07], did not find a reliable improvement in speed or accuracy from specialized dyslexia fonts. https://pubmed.ncbi.nlm.nih.gov/42536336/
- Wery & Diliberto (2017/2016 online), OpenDyslexic versus common typefaces, no group-level improvement. https://pubmed.ncbi.nlm.nih.gov/26993270/
- Braille Institute explains why its Atkinson Hyperlegible family emphasizes letterform distinction. https://www.brailleinstitute.org/freefont/
- Microsoft accessibility guidance prioritizes familiar, legible type, good contrast, semantic structure and adjustable appearance. https://support.microsoft.com/en-us/accessibility/word/make-your-word-documents-accessible-to-people-with-disabilities

## Character support and world scripts
Font names in the international group include Noto variants and common CJK, Arabic, Hebrew, Devanagari, Bengali, Tamil, Telugu, Thai, Korean, Armenian, Georgian, and Ethiopic families. Rendering depends on OS glyph availability, text shaping, and font coverage. Document-level right-to-left support and complex-script DOCX layout need further testing.

## Reproducibility
The custom font loader does not silently install fonts into the device; its `FontFace` registration is limited to the current browser tab session. The browser's Local Font Access API can require permission, a secure context, and a supporting browser. If a recipient does not possess the same font, exported DOCX usually uses a fallback. Packaging or embedding open-source font files would require evaluating each font's specific OFL notices and reserved-font-name requirements.