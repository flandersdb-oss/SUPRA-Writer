# SUPRA Writer v0.5 staged candidate — manual page breaks

**This branch is a candidate, not an installer release or a full Word replacement.**

## Implemented
- Toolbar **Start a new page** and **Ctrl+Enter** keyboard shortcut.
- A non-editable marker with an on-screen guide retained by HTML sanitizer and local draft persistence.
- WordprocessingML page break on DOCX export: `<w:br w:type="page"/>`.
- DOCX import recognizes explicit page breaks, including those occurring within a paragraph.
- Print CSS uses `break-before:page` and removes editor-only guides.
- Browser regression test exercises insertion, Word export/import and draft restoration.

## Known limitations
- This is **manual page breaking**, not full automatic pagination.
- Page previews, page-count calculations, sections, headers, footers, complex embedded objects and high-fidelity DOCX layout remain outstanding.
- Exact pagination in Word/LibreOffice has not been independently benchmarked.

## Promotion gate
Do not promote this staging branch to a Windows alpha release until its browser and security tests pass and Windows packaging succeeds. Retain existing published alpha binaries.
