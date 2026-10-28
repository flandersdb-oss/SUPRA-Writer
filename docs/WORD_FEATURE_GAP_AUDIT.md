# SUPRA Writer — Extreme feature-gap audit, October 2026

**Benchmark references:** Microsoft Word, LibreOffice Writer, ONLYOFFICE Docs and open-source rich-text editing engines. The purpose is not to copy their menus but to reveal the *effects users seek*, grouped in understandable language. Labels: **DONE** implemented in SUPRA Writer v0.2; **PART** partial/basic implementation; **NEXT** targeted for v0.3; **LATER** future work.

| Area | Conventional feature | SUPRA plain-language control | State | Priority |
|---|---|---|---|---|
| Font | Font families & favourites | Pick a letter shape / search or load a font | DONE | — |
| Font | Font size | Make letters bigger / smaller | DONE | — |
| Font | Bold / italic / underline | Make selected letters stand out | DONE | — |
| Font | Strikethrough | Cross out words | DONE | — |
| Font | Text color | Choose ink color | DONE | — |
| Font | Highlight | Marker behind text | NEXT | High |
| Font | Character tracking | Space between letters | DONE | — |
| Font | Word spacing | Space between words | DONE | — |
| Font | Font weight | Letter thickness | DONE | — |
| Font | Font substitution | Fallback if missing | PART | High |
| Font | Letter kerning | Adjust close-fitting pairs | LATER | Medium |
| Font | Font stretch/scale | Stretch or squeeze letters | LATER | Low |
| Font | Ligatures / OpenType | Fancy letter joining | LATER | Medium |
| Font | All caps/small caps | Change letter case | NEXT | Medium |
| Font | Superscript/subscript | Tiny high/low letters | PART | Medium |
| Font | Symbols | Insert special character | DONE | — |
| Font | Emoji and extended glyphs | Insert expression/symbol | PART | Medium |
| Font | Custom font file | Use my font | DONE | — |
| Paragraph | Align left/center/right | Where lines sit | DONE | — |
| Paragraph | Justify | Even up both sides | DONE | — |
| Paragraph | Line spacing | Distance between lines | DONE | — |
| Paragraph | Gap after paragraph | Space between paragraphs | DONE | — |
| Paragraph | Gap before paragraph | Space above paragraphs | LATER | Medium |
| Paragraph | First-line indentation | First line moves in | DONE | — |
| Paragraph | Hanging indent | Hanging words out | NEXT | Medium |
| Paragraph | Tab stops / ruler | Where tabs line up | NEXT | Medium |
| Paragraph | Lists / numbering | Simple bullet and number lists | DONE | — |
| Paragraph | Multilevel numbering | Number chapters and subparts | PART | High |
| Paragraph | Borders / shading | Box or shade a paragraph | LATER | Medium |
| Paragraph | Drop caps | Large first letter | LATER | Low |
| Paragraph | Hyphenation | Break long words | LATER | Medium |
| Paragraph | Widow/orphan control | Avoid lonely lines on pages | LATER | High |
| Paragraph | Keep with next / together | Keep related words together | LATER | High |
| Page | Paper size | What paper? | DONE | — |
| Page | Orientation | Tall or wide | DONE | — |
| Page | Margins | Space at edges | DONE | — |
| Page | Custom margins | Precise edge space | DONE | — |
| Page | Paper/background color | Page color | DONE | — |
| Page | Page breaks | Start new page | NEXT | High |
| Page | Section breaks | Different layout on next pages | LATER | High |
| Page | Columns | Newspaper layout | LATER | High |
| Page | Headers / footers | Repeating top/bottom lines | NEXT | High |
| Page | Page numbers | Number the pages | NEXT | High |
| Page | Page border | Decorative frame | LATER | Low |
| Page | Watermarks | Faint background wording | LATER | Low |
| Page | Facing pages / gutters | Book binding and facing pages | LATER | Medium |
| Page | Page navigation | Jump to page / outline | NEXT | High |
| Insert | Tables | Add a grid | PART | High |
| Insert | Images | Put a picture in the document | NEXT | High |
| Insert | Shapes / text boxes | Add callout boxes | LATER | Medium |
| Insert | Charts | Add a chart | LATER | Medium |
| Insert | Equations | Write a formula | LATER | Medium |
| Insert | Hyperlinks | Add a clickable link | DONE | — |
| Insert | Bookmarks / cross-references | Jump to another section | LATER | Medium |
| Insert | Footnotes/endnotes | Explain at page bottom/end | LATER | High |
| Insert | Citations/bibliography | Add source and references | LATER | High |
| Insert | Table of contents | Make chapter list | LATER | High |
| Insert | Fields / date / mail merge | Auto-fill details | LATER | Medium |
| Review | Spellcheck | Underline possible typos | PART | High |
| Review | Grammar suggestions | Explain possible grammar edits | LATER | Medium |
| Review | Find and replace | Find/change words across document | NEXT | High |
| Review | Comments | Note changes without editing | LATER | High |
| Review | Track changes | Accept/reject edits | LATER | High |
| Review | Compare versions | Show what's changed | LATER | Medium |
| Review | Collaboration | Co-write in real time | LATER | Medium |
| Review | Revision history | Restore past versions | LATER | High |
| Accessibility | Font-friendly presets | Personalized readability looks | DONE | — |
| Accessibility | Contrast ratio | Check text/paper contrast | DONE | — |
| Accessibility | Accessibility audit | Flag missing headings/alt text | LATER | High |
| Accessibility | Read aloud | Listen to document | LATER | Medium |
| Accessibility | Reading ruler/focus line | Follow one line at a time | LATER | Medium |
| Accessibility | Screen-reader semantics | Structured heading/navigation UX | PART | High |
| Design | One-click templates | Instant page makeover | DONE | — |
| Design | Save reusable theme | My saved look | DONE | — |
| Design | Paragraph/character style rules | Consistent named styles | PART | High |
| Design | Theme fonts and colors | Change a coordinated set | PART | High |
| Design | Templates library | Letter, resume, book, pamphlet | PART | Medium |
| File | TXT, HTML, DOCX open | Open my file | PART | High |
| File | DOCX export | Save for Word | PART | High |
| File | ODT import/export | Save OpenDocument | LATER | High |
| File | PDF export | Print / Save as PDF | PART | Medium |
| File | Real pagination | Accurate printed pages | PART | High |
| File | Autosave local draft | Restore my writing | DONE | — |
| File | Cloud sync / encryption | Sync securely if desired | LATER | Medium |
| Platform | Offline browser | Work without network | DONE | — |
| Platform | Windows/Linux native apps | Install like a regular app | LATER | Medium |
| Platform | Android native app | Install APK | LATER | Medium |

**Summary:** 17 ready-made looks (5 quick + 12 advanced) and saved user looks already make multi-control typography substantially faster than repeated settings menus. Production-feature gaps remain especially in accurate pagination, semantic styles, DOCX fidelity, import/export of ODT, inserted images, find/replace, headers/footers and accessibility auditing. Do not equate a count of controls with full Word compatibility.

**References:**
- Microsoft, [Word formatting](https://support.microsoft.com/en-us/word/format-your-word-document), [character spacing](https://support.microsoft.com/en-us/word/change-the-spaces-between-text-in-word), [styles](https://support.microsoft.com/en-us/word/customize-or-create-new-styles), [accessibility](https://support.microsoft.com/en-us/accessibility/word/make-your-word-documents-accessible-to-people-with-disabilities).
- LibreOffice, [Writer style types](https://help.libreoffice.org/latest/en-US/text/swriter/01/05130000.html), [advanced style editing](https://help.libreoffice.org/latest/en-GB/text/shared/01/new_style.html).
- ONLYOFFICE, [document-editor feature index](https://helpcenter.onlyoffice.com/docs/userguides/document_editor), [home tab](https://helpcenter.onlyoffice.com/docs/userguides/document_editor/HomeTab.aspx), [collaboration](https://helpcenter.onlyoffice.com/docs/userguides/document_editor/ReviewTab.aspx).