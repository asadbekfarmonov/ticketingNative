# GuestList iOS App

This repository contains a SwiftUI-based offline-first guest management app targeting iOS 16+. The app supports importing guest data from Excel/CSV, manual guest management, QR ticket generation, offline scanning, and PDF ticket sharing.

## Highlights

- Local-first storage with JSON persistence managed by `GuestStore`.
- Excel/CSV import via the Files app with duplicate detection and optional bulk QR generation.
- Guests tab with search, sorting, filtering, manual add/edit/delete, undo deletion, and ticket actions.
- QR ticket generation using HMAC-SHA256 signatures, PDF rendering, and Share Sheet integration.
- Scan tab with live camera preview, torch control, tactile feedback, and offline verification.
- Settings for event metadata, secret rotation, data export, and data reset.

Open the project with Xcode 15+ (`Package.swift`) to run on iPhone simulators or devices.
