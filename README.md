# SUPRA Writer v0.7.0-alpha.1 — Fast & Accessible / Universal alpha candidate

An original **MIT-licensed**, offline-first word processor that aims to replace cryptic setting names with plain English, glyphs, live examples, and one-click document looks. It is a functioning browser application, **not** yet a complete Word/LibreOffice replacement.

## Windows desktop edition (alpha)

See [Windows Desktop guide](docs/WINDOWS_DESKTOP.md). A GitHub Actions workflow builds a native Windows installer and portable `.exe` from source. Build success must be verified before distributing executables.

## Current alpha release

- [Windows alpha v0.7.0-alpha.1](https://github.com/flandersdb-oss/SUPRA-Writer/releases/tag/v0.7.0-alpha.1) — installer and portable (once Windows build succeeds).
- [Design system](docs/BRAND_SYSTEM.md) — provisional cross-platform icon family.
- [Alpha release notes](docs/RELEASE_NOTES_v0.7.0-alpha.1.md).

> Current published alpha remains v0.5 until this v0.6 candidate passes CI and is released. Windows v0.6 includes Writer Visual Setup; Sheets and Present remain browser-only prototypes.

## Writer editions (development preview)

The same Writer engine now offers two interface profiles: **Fast & Accessible** (default) and **Universal** (compatibility guidance). The document, formatting, local autosave and existing keyboard shortcuts are shared, so switching profiles does not convert or replace the document.

Basic Markdown (`.md`, `.markdown`) import/export joins DOCX, HTML and TXT. The universal compatibility panel distinguishes *Basic*, *Export only* and *Planned* formats. It does **not** pretend that ODT, RTF, older Word DOC, Apple Pages, WordPerfect, LaTeX or EPUB are working. See [Writer architecture and file-format limitations](docs/WRITER_FAST_UNIVERSAL_ARCHITECTURE.md).

## SUPRA Office experimental prototypes

- [SUPRA Office hub](office/) — choose Writer, Sheets or Present.
- [SUPRA Sheets prototype](office/sheets/) — editable 250-cell grid, basic formulas, CSV and local JSON backup.
- [SUPRA Present prototype](office/present/) — editable/reorderable slides, four themes, HTML slideshow and JSON backup.
- **Writer Visual Setup** — six document goals, visible list of settings, four optional overrides, one Apply action. Advanced controls remain available.
- [Visual workflows and limitations](docs/SUPRA_OFFICE_VISUAL_WORKFLOWS.md).

Sheets and Present are *not* XLSX/PPTX-compatible yet, and are not feature-complete office replacements.

## Run in one step

Double-click `SUPRA_Writer_v0.2_Standalone.html` (in the parent download folder) or open `index.html` in Chrome/Edge. The standalone build embeds the application's HTML, CSS and JavaScript. No server, subscription, account, or Internet connection is required.

## What's new in v0.2

- **162 unique font-family choices**, searchable and filterable: readability, sans-serif, serif, display, monospace, world scripts. Names are not the same as installed font files; fallback is automatic.
- **Unlimited font names** via manual entry, plus **Add font file** for local `.ttf`, `.otf`, `.woff` and `.woff2` files (8 MB per file limit). Uploading a font file creates a temporary browser `FontFace` for that session only; it is not uploaded or stored remotely. **Scan installed** uses the browser's optional Local Font Access API, if available and permission is granted. Not all browsers enable this, especially for local `file:` pages.
- **Accessibility-oriented font suggestions** including Atkinson Hyperlegible Next, OpenDyslexic, Lexend, Readex Pro, Andika and ABeeZee. They are *choices*, not evidence-based treatment or guarantees of improved reading.
- **12 one-click Advanced makeover cards** plus the original 5 Quick Looks. Every advanced look changes multiple properties: font, size, letter and word spacing, line and paragraph spacing, margins, paper and ink colors, heading color, and alignment.
- **Advanced controls** for letter spacing, word spacing, font weight, line spacing, paragraph gap, first-line indent, precise page margins, heading color, document alignment.
- **Live text-on-paper contrast ratio** to help spot low-contrast combinations.
- **Save my look** lets the user save up to 25 sets of document settings in local browser storage, reapply them in one click, and remove them. **Undo look** restores settings from the prior preset application.
- **Symbols:** one-click `⸮` (U+2E2E reversed question mark, historically an irony mark), plus a 30-character palette including `‽`, `§`, `¶`, `—`, and other useful marks.
- **Font size** 8–144 px via numeric entry and a convenient 8–72 px slider.
- **DOCX export** now encodes base font, size, color, bold default (where applicable), letter spacing, line spacing, after-paragraph spacing, first-line indent, alignment, heading color, and margin. Some settings, especially word spacing, colored page background, and custom font-file embedding, are not preserved in DOCX.

## Online, offline and installation

- **Use online:** https://flandersdb-oss.github.io/SUPRA-Writer/ (no sign-in or remote document database).
- **Download offline:** click **⇩ Get app** on the website. This saves a self-contained HTML file that runs locally in Chrome or Edge without a server.
- **Install PWA:** use **Install app** when supported by your browser, or use your browser's installation menu. After the first successful online load, the service worker caches the app's static shell for offline access. Available functionality depends on browser support; native APK/EXE packages are not included.
- **Export your work:** **Save file** offers DOCX, HTML, and TXT; **Print / PDF** uses the browser print dialog.
- **Important:** unsaved documents may exist only in that browser on that device. Export frequently; no automatic cloud sync or backup is provided.

## One-click Quick Actions (experimental alpha)

Use **⚡ Quick Actions** or press **Ctrl+K** in the editor. Type a result such as *professional letter*, *academic paper*, *comfortable reading*, *print*, or *find and replace*. The panel is entirely local and works offline. Four of the common document makeovers are also visible in the Quick looks panel. Settings are applied via the same UI controls as manual editing; Undo look restores the previous appearance. This is not an AI service and does not silently change document text.

## How to use

1. Open the app and type on the document page.
2. Select **Quick looks** for five immediate presets, or **⚙ Advanced** for 12 one-click makeovers and fine-tuning.
3. Select **Aa Text** to find a font by name or category, preview it, adjust text size, and choose a font file from your own device if required.
4. Select **▤ Page** to change paper size, margins, orientation, and paper color.
5. Click `⸮` or `Ω` in the toolbar to insert irony punctuation or other symbols at your cursor.
6. Click **☆ Save my look** to give all current appearance settings a memorable name; later apply that saved look from the Quick looks panel.
7. Use **Save file → Word (.docx)** for a Word-compatible export, **HTML** for a simple webpage, or **TXT** for plain text. Print/PDF uses the browser print dialog.

## Accessibility and font licensing

No font binaries are distributed in the package. Font family names reference system fonts and user-supplied fonts; available glyphs depend on the installed font and fallbacks. When a custom font isn't installed on the recipient's device, the `.docx` export may render differently there.

Free/open-source sources to obtain fonts separately, if desired:

- [Atkinson Hyperlegible Next](https://github.com/googlefonts/atkinson-hyperlegible-next) — SIL OFL 1.1; developed primarily for legibility/low vision.
- [OpenDyslexic](https://opendyslexic.org/) — SIL OFL in newer releases; a user-selectable dyslexia-oriented font.
- [Lexend](https://fonts.google.com/specimen/Lexend), [Readex Pro](https://github.com/ThomasJockin/readexpro), [Andika](https://software.sil.org/andika/) — useful alternatives.

Evidence caveat: Azzarello et al., 2026, *Annals of Dyslexia*, meta-analysis of 15 studies (N=688) reported no dependable reading speed or accuracy improvement from specialized dyslexia fonts versus common alternatives; preferences differ. PMID 42536336, https://pubmed.ncbi.nlm.nih.gov/42536336/. There is no standard, universally superior “autism font”; users should control spacing, density, contrast, and typography.

The reversed question mark `⸮` is U+2E2E, originally the *punctus percontativus*, used historically for irony. The symbol is not universally understood as sarcasm and is distinct from specific commercial SarcMark designs. https://www.unicode.org/Public/UCD/latest/charts/nameslist/2e00/.

## Implementation and honest limitations

- Vanilla HTML, CSS, and JavaScript: no external dependencies, telemetry, network requests, or backend.
- DOCX import/export covers many common text, paragraph, list, and table features but **not** embedded images, headers/footers, real page breaks, comments, tracked changes, equations, footnotes, complex fields/section layouts or exact visual round-trips.
- Font files loaded into the browser are not persisted across page reloads. For reproducible appearance, users can install the font in their operating system or add it again when restarting the editor. No fonts are embedded in DOCX.
- Imported HTML is sanitized; unsafe embedded markup is rejected. Do not open arbitrary downloaded HTML directly in a browser if you do not trust the source.
- `execCommand` provides editing and undo/redo, but is deprecated; production work should migrate to a structured model (Lexical/ProseMirror) and add robust accessibility/selection tests.
- Styles and manual format overrides may interact. One-click looks control document defaults; they do not destructively remove manual bold, italic, or other text-level formatting.
- The simple single-page workspace doesn't yet show reliable page breaks for long documents.

See `WORD_FEATURE_GAP_AUDIT.md`, `FONT_CATALOGUE.md`, and `TEST_REPORT.md` for engineering details.

## License

The application code is MIT-licensed (see LICENSE). Fonts are not included and keep their independent license terms.

## Development and contributions

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), [the roadmap](docs/ROADMAP.md) and [the release notes](docs/RELEASE_NOTES_v0.2.0.md). CI runs both static and real Chromium browser tests. The source is under the MIT license; external fonts and libraries, if added, must have compatible licenses.
