# SUPRA Writer — Public Project Status (2026-11-03)

This note is limited to the already-public **SUPRA Writer** open-source project. It is not a backup index and contains no private SUPRA files, keys, account configuration, messaging rooms, or unpublished encryption research.

## Present capabilities documented by this repository
- Offline-first browser word processor with visual document presets, font selection, print/PDF, and DOCX/HTML/TXT export.
- Public source currently describes **SUPRA Office** browser prototypes for Sheets and Present; these are experimental and not complete XLSX/PPTX-compatible applications.
- The README identifies **v0.6.0-alpha.1** as a Windows candidate and warns that the currently published alpha remains **v0.5** until CI and release verification. Check the actual release assets and workflow status before treating a Windows installer as available.

## Acceptance work still required
1. Confirm the Windows release workflow succeeded and verify the exact installer/portable artifact hashes before distribution.
2. Run on a real Windows PC, including offline edit, save/reopen, and export/import round trips.
3. Measure document-format fidelity and prevent silent loss of unsupported DOCX features.
4. Retain user-controlled local backups; no automatic cloud backup is claimed.
5. Maintain separate, approved public releases and private internal work. Do not add proprietary SUPRA project archives to this public repository.

**Evidence level:** public repository README and accessible repository metadata checked 2026-11-03. No new Windows build, deployment, or end-user functional test was carried out by this note.
