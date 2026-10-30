# SUPRA Writer Universal — Local Document Discovery and Converter Architecture

## Status

**v0.7 development branch only**. The Windows executable has not been rebuilt and verified on this exact commit yet. This system is not a universal reader today.

### What is implemented

1. On the first Windows launch, the user sees a one-time invitation to select document folders. **Nothing is scanned without folder approval.**
2. User chooses up to 10 local folders in the native Windows folder chooser. The native Electron process saves these approved paths in its own user-data directory.
3. On later launches, the application automatically scans *only approved folders*, enumerating filenames and metadata, without reading document content.
4. A searchable index lists files by extension and flags **readable now** versus **converter required**. Selecting an openable file passes it through the existing restricted native document-reading bridge and the editor's existing import/sanitization.
5. The user can rescan, choose different folders, or **Forget access** to clear both permissions and the temporary file index.
6. Opening a discovered file asks before replacing the document and attempts a local recovery snapshot first.
7. For some unsupported formats, a button opens the official publisher page of a potential converter. It **does not download, install, run, or configure external software** automatically.

### Recognition only — not format support

| Category | Extensions | Behavior |
|---|---|---|
| Basic native read | .docx .html .htm .txt .md .markdown | Can open files up to 25 MB via existing editor; DOCX and Markdown have documented fidelity limits |
| Candidate conversion | .odt .fodt .rtf .doc .docm .pages .wpd .abw .wps .tex .epub .pdf .sxw .ott .xml .rst .org .asciidoc | Listed as conversion-needed. Not read or converted automatically. |
| Unknown extension | all others | Not indexed in this alpha |

**The scan classifies file *extensions*, not file signatures**. A file can be mislabeled. Real import requires parser validation. PDF metadata/text extraction is distinct from editable document reconstruction.

## Candidate third-party engines

- **LibreOffice**: office document conversions, especially ODT and older word-processing formats; official source https://www.libreoffice.org/download/. CLI instructions at https://help.libreoffice.org/latest/en-GB/text/shared/guide/start_parameters.html
- **Pandoc**: Markdown, HTML, LaTeX, RST, Org, EPUB, ODT, DOCX and other *structured content* conversions. Official docs https://pandoc.org/MANUAL.html; install page https://pandoc.org/installing.html. Some conversions do not preserve page layout, margins or complex tables.
- **Apache Tika**: many format types for read-only text and metadata extraction; official docs https://tika.apache.org/docs/. Extraction is not the same as producing a faithful editable DOCX.

The file type registry only proposes candidates. No external binary is bundled, executed, silently installed, or downloaded.

## Security boundaries

- Electron remains context-isolated, sandboxed, with Node integration disabled and explicit IPC sender validation.
- Only the native folder chooser can grant scan scope. The stored allowlist is local to the user's app profile.
- The scanner skips dot-hidden entries, symlinks and common system/application directories. It does not follow symlinked folders; opens are revalidated against the approved root.
- Hard limits: **10 folders; 5,000 matching files; 8 folder levels; 25 MB opened document**. This is intentionally *not* indiscriminate drive crawling.
- The renderer receives temporary numeric item IDs and filenames, not absolute root paths or filesystem APIs.
- Converter publisher links are fixed and only open from a deliberate user click. Only two official publisher URLs are whitelisted.
- The scanner does not network-upload, execute macros, write to scanned files, install anything, or index document contents.

## Future release gates

1. Test the exact branch on Windows 11 with 0, 100, 5,000 and >5,000 documents, read-only folders, denied permissions, Unicode filenames, symlink/junction targets, inaccessible directories and corrupt input.
2. Measure the scanning wall-clock latency and memory use. Add cancellable/background scanning and incremental indexing if needed.
3. Implement **content-signature verification** before reporting a file openable, where practical.
4. Check locally installed LibreOffice/Pandoc capability by version and license, without running converters while scanning.
5. Offer an opt-in "Convert copy" action: user confirmation, sandboxed temporary directory, original unmodified, fixed arguments, process time/memory limits, format-specific validation, output preview, warnings about lost structure.
6. Only after signed/checksummed publisher verification and explicit approval consider assisted installation. Never blindly execute downloaded programs.
7. Expand in stages to RTF/ODT/EPUB, searchable PDF text, WPD, older Word, HTML archives and other formats with actual regression fixtures.
8. Keep heavy conversion engines optional so **Fast & Accessible** retains its light startup profile.

## Testing

- `tests/document-catalog.test.mjs`: format classification, nested folder scan, hidden entry and symlink exclusion, file-size/permission boundaries, scan limits, restricted desktop APIs, verified publisher source links.
- Browser regression tests on latest branch commit and Windows installer packaging **not yet verified**; do not publish an alpha based solely on syntax or legacy tests.
