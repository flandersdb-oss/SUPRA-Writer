# SUPRA Writer Windows Desktop v0.3.0

Windows application based on the same editor as GitHub Pages. Desktop host: Electron, sandboxed renderer and limited native document bridge.

## Install / use

1. Open **Actions → Windows app build** in this repository.
2. Select the latest successful run (green check), then download the `SUPRA-Writer-Windows-v0.3` artifact.
3. Extract the artifact ZIP; launch the `SUPRA-Writer-Setup-...exe` installer or `SUPRA-Writer-Portable-...exe` without installation.
4. Use **File → Open**, **File → Save**, **Save As**, **Export PDF**, or **Print**. The editor itself works without internet.

> **Unverified until built on GitHub's Windows runner:** An `.exe` file is not included in the source repository. The Actions workflow must succeed before there is an executable. Unsigned preview software may show Windows SmartScreen warnings. We do not recommend bypassing security warnings; verify the source and publisher before choosing to run experimental software.

## Build from source on a trusted Windows PC

Install Node.js 22+ and npm. In the source folder run:

```powershell
npm install
npm run test:syntax
npm run test:desktop
npm run build:win
```

The installer and portable `.exe` files are created under `release/`. Build scripts do not upload document contents.

## Windows features

- Native File menus and keyboard shortcuts: Ctrl+N, Ctrl+O, Ctrl+S, Ctrl+Shift+S, Ctrl+P, Ctrl+F, Ctrl+H.
- Open DOCX, HTML, TXT. Save DOCX, HTML, TXT and export PDF. Existing Word feature limitations still apply.
- Native Windows file pickers; writing is local to the user-chosen file.
- Persistent local draft in application storage. A draft is **not** a substitute for saving a file.
- Electron security: context isolation, sandbox, Node integration disabled, validated IPC sender, local-app-only protocol, navigation and window opening restrictions.
- No account, ads, telemetry or external document server required.

## Limitations / next milestones

- Word feature parity is not achieved. Still need robust page layout, footnotes, images, headers and footers, tracked changes, and full DOCX fidelity.
- There is no code-signing certificate, automatic update service, or confirmed virus-scan attestation for the generated installer.
- No native spell-check installation or font bundling is included; Electron uses Chromium spellcheck functionality and installed system fonts.
- More intensive verification is needed on actual Windows 10 and Windows 11 devices.
- Electron app bundles Chromium and uses more disk space/RAM than a lightweight WebView2 frontend.
