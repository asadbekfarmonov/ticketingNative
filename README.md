# Guest List React Native App

This repository hosts a React Native implementation of an offline-first guest management tool. The app runs on iOS 16+ devices and delivers guest import, manual management, QR ticket generation, and offline ticket scanning without relying on servers.

## Features

- **Guests tab** – browse, search, sort (A–Z, Z–A, Latest), filter (All, Entered, Not Entered), add/edit/delete guests, undo accidental deletes, and preview/share QR tickets.
- **Import tab** – pick `.xlsx` or `.csv` files, preview detected names, skip duplicates automatically using diacritic-insensitive matching, and optionally pre-issue tickets.
- **Scan tab** – high contrast QR scanner with torch toggle, haptic feedback, and offline HMAC verification for ticket payloads.
- **Settings** – edit event metadata, rotate the HMAC secret and key version, export guests to CSV, or clear all data.
- **Local storage** – guests and event settings persist in `AsyncStorage`, keeping the experience fully offline.

## Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start Metro:
   ```bash
   npm start
   ```
3. Run on iOS simulator or device:
   ```bash
   npm run ios
   ```

The project targets the bare React Native CLI. Ensure Xcode and CocoaPods are installed to build the iOS target.

## Testing

Unit and integration tests are not yet implemented. Run the TypeScript compiler and ESLint to verify the codebase:

```bash
npm run typecheck
npm run lint
```
