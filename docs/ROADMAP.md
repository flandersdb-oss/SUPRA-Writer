# SUPRA Writer Roadmap

## Available in v0.2
- Browser-based writer with simple text and page options.
- Advanced multi-setting styles and saveable local presets.
- 162 searchable font family choices, custom font file loading, irony punctuation.
- Basic DOCX, HTML, TXT export; browser printing to PDF.
- Standalone offline HTML file and installable PWA shell (browser support varies).

## Priority work
1. Reliable, tested DOCX import/export with loss warnings and formatting preservation.
2. True multi-page layout, breaks, headers, footers and page numbering.
3. Images and improved table editing.
4. Find and replace, undo robustness, keyboard accessibility.
5. User experience tests with one-click format choices and visual setting previews.
6. Extensive file format tests (DOCX, ODT, HTML, RTF, TXT and PDF output).
7. Localization, RTL document controls, accessibility improvements and font testing.
8. Android app package and signed desktop distributions (not currently available).

## Engineering rules
- Never claim Microsoft Word feature parity without a verified test.
- Track regression and privacy risks as issues.
- Keep generated standalone HTML available so it works offline without an installer.
