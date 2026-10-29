# SUPRA Writer v0.6.0-alpha.1 — Windows Visual Setup + SUPRA Office Web Prototypes

## Windows Writer changes
- **Visual Setup**: six meaningful outcomes (letter, academic, readability, print, compact, manuscript) with a clear list of affected controls.
- Four optional simple overrides: Letter/A4, tall/wide, bigger/smaller text, tighter/roomier lines.
- One Apply action configures multiple existing Writer settings. All advanced settings remain separately editable.
- The v0.5 manual page-break and Word round-trip work remains available.
- Windows installer includes the new Visual Setup code and CSS.

## Browser-only experimental office prototypes
- **SUPRA Sheets v0.1** in `/office/sheets/`: local spreadsheet grid, formula math, 4 multi-step templates, CSV and project JSON.
- **SUPRA Present v0.1** in `/office/present/`: local slide editor, 4 themes, 4 multi-slide workflows, HTML slideshow and project JSON.
- **Office hub** in `/office/` shares a visual system with the other tools.
- These two prototypes are **not** Windows executables, XLSX editors, or PPTX editors.

## Testing and limitations
Automated CI checks browser interaction, formula handling and cycle detection, CSV security behavior, slide safety, Writer settings, icon consistency, Windows host controls, and executable packaging. Release still needs final real Windows device testing. The executables remain unsigned. Open copies of important documents, not irreplaceable originals.

## Development honesty
No full Word, Excel or PowerPoint feature parity is claimed. The prototypes are for validating results-first workflows and the underlying minimal editing functionality.
