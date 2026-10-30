# SUPRA Writer — Fonts, Formats and Performance Audit

## Design priorities
1. **Fast & Accessible** remains lightweight, offline-first, readable, keyboard operable and task-oriented.
2. **Universal** shares the same document core but offers optional conversion adapters with explicit fidelity warnings. Do not load heavyweight engines until required.
3. Do not confuse a *listed* font name with a *bundled* or *installed* font.

## Font catalog — v0.7 development

- Source catalog: **174 distinct font names** spanning accessible, sans, serif, display, monospaced and international groupings.
- **Papyrus is already included** in the Creative/Display catalog. The v0.7 stage adds a **Find Papyrus** button. Papyrus is proprietary and is **not redistributed** by SUPRA.
- A font may be listed without being installed: the OS/browser substitutes a fallback. "Scan installed" requests the browser's local-font permission where available. A user can also provide a licensed font file for the editing session.
- Newly catalogued names (not bundled): **Bricolage Grotesque, Sora, Alegreya Sans, Recursive, Fraunces, Newsreader, Cinzel Decorative, Cormorant Unicase, UnifrakturCook, Recursive Mono, Noto Sans Math, Noto Color Emoji**.
- These increase distinct catalog names by **12 (162 → 174; +7.4%)** and increase packaged font-file size by **0 bytes**. They are choices, not proof of device availability.
- Improve next: safe status checking without intrusive font enumeration, OpenType variable-axis controls where supported, typography preview samples, fallback coverage testing across writing systems.

## Interoperability by actual format

| Input/output | Development support | What remains |
|---|---|---|
| `.txt` | Basic read/write | Unicode and line-ending regression |
| `.html`, `.htm` | Basic read/write with sanitization | Full CSS and semantic preservation |
| `.md`, `.markdown` | Basic read/write, headings, paragraphs, lists, quotes, emphasis, code fences | Complete CommonMark/GFM: links, tables, code spans, checklists, footnotes, math, robust Unicode escaping and round trips |
| `.docx` | Basic read/write | High-fidelity styles, images, page layout, citations, comments and revisions |
| `.pdf` | Print/export only | Existing PDF editing not implemented |
| `.odt`, `.rtf` | **Not supported** | Separate lazy-loaded adapters and fixtures |
| `.doc`, `.docm` | **Not supported** | Binary parser / macro-safe inspection; NEVER execute macros |
| `.pages`, `.wpd`, `.abw`, `.wps`, `.xml`, `.tex`, `.epub` | **Not supported** | Optional bridges, format detection, explicit conversion warnings |

Microsoft's format reference: https://learn.microsoft.com/office/compatibility/office-file-format-reference
LibreOffice file-format list: https://books.libreoffice.org/en/GS262/GS26210-FileFormatsSecurityExporting.html
GFM specification: https://github.github.io/gfm/

## Most valuable missing Word capabilities

**P0: correctness**
- High-fidelity DOCX import/export benchmark against a varied fixture corpus; no silent data loss
- Actual multipage layout, section breaks, headers, footers and page numbers
- Images with anchors, alt text and wrapping; robust styled tables
- Offline recovery with corrupted / large file handling and save/restore tests

**P1: interoperability**
- Footnotes/endnotes, citations, heading outlines, styles and templates
- Tracked changes/comments and document comparison (read-only inspection first)
- International text: CJK, right-to-left scripts, Unicode normalization and font substitution tests
- Open standard ODT; RTF and legacy formats only through tested optional adapters

**P2: usability**
- Accessible revision/history previews and one-click formatting workflows
- Variable-font axis controls where supported, math symbols and tables of contents
- Fast document navigation, find/replace across formatting boundaries, print fidelity

## Speed measurements to collect (not yet benchmarked)
- Cold startup and time-to-first-keystroke (50th/95th percentile)
- Typing-to-paint latency with small, medium and large documents
- Actual storage duration / failures, memory use and background recovery
- Document parse time (DOCX vs TXT vs Markdown), fidelity error counts
- Conversion CPU use and size of optional adapters

### Current autosave timing design
In v0.7 staging: small documents **50 ms idle**, medium **120 ms**, large **300 ms**, minimum **300 ms** between routine writes, maximum-target **1 second** for sustained input. These are *configured scheduling delays* not proven physical durability nor global speed records.

## Release and licensing rules
No proprietary font files in GitHub without redistribution rights. No claims of Microsoft Word parity or "all formats". Test format adapters and document conversions against exact fixture corpora; preserve original input. Keep universal adapters isolated and opt-in so Fast edition performance stays fast.
