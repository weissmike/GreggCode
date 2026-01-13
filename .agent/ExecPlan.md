# Convert the Gregg dossier app to Android with folio, local recognition, and LaTeX input

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan must be maintained in accordance with `.agent/Plans.md` from the repository root.

## Purpose / Big Picture

Users can keep the cold-war styled Gregg shorthand experience while gaining an Android app package, a new folio of quick guides (including user-created guides), and a LaTeX-like keyboard entry mode for decoding. The decode and training flows can now run locally when the input is structured, while still offering AI fallback for freehand drawings until local freehand recognition is proven reliable. This is visible when the app shows the folio, renders LaTeX commands into strokes, and reports a local or AI decode source.

## Progress

- [x] (2026-01-13 10:30Z) Added Android packaging configuration with Capacitor and documented Android build steps.
- [x] (2026-01-13 10:35Z) Implemented folio data model, storage, UI, and modal viewer for built-in and user guides.
- [x] (2026-01-13 10:40Z) Added LaTeX-style primitive parser, decode input UI, and keyboard token tracking.
- [x] (2026-01-13 10:45Z) Implemented local recognition for primitive sequences with AI fallback for freehand strokes.
- [ ] (2026-01-13 10:45Z) Add the actual brief-forms guide images to `public/folio` and verify the UI uses them (completed: UI hooks; remaining: asset files).
- [ ] (2026-01-13 10:45Z) Run build and Android sync commands to verify the Capacitor setup on this machine.

## Surprises & Discoveries

- Observation: There were no existing guide image assets in the repository.
  Evidence: `rg --files --hidden -g '*.png'` returned no results.

## Decision Log

- Decision: Use Capacitor to package the Vite React app for Android.
  Rationale: This preserves the current UI and canvas behavior with minimal rework.
  Date/Author: 2026-01-13 / Codex

- Decision: Implement local recognition for structured primitives and retain AI fallback for freehand input.
  Rationale: Structured input can be matched against templates reliably; freehand recognition is not yet validated.
  Date/Author: 2026-01-13 / Codex

- Decision: Provide a LaTeX-like command parser rather than full LaTeX rendering.
  Rationale: A narrow command set is enough to serialize and replay Gregg primitives in the decode UI.
  Date/Author: 2026-01-13 / Codex

## Outcomes & Retrospective

The UI now supports a folio tab, user guide uploads, a LaTeX input bar, and local decode results for structured input. The Android packaging configuration is in place, but the Android project has not yet been generated in this workspace. Actual guide images still need to be placed in `public/folio` to replace the fallback placeholders.

## Context and Orientation

The UI is driven by `App.tsx`, which uses `LESSONS` from `constants.ts` to present training words. The drawing surface is `components/ShorthandCanvas.tsx`, which now exposes stroke points for local recognition and accepts an `onFreehandStart` callback to detect freehand input. AI recognition is still available via `services/geminiService.ts`. Local recognition now lives in `services/localRecognition.ts`, and the LaTeX command parser is in `services/latexParser.ts`. A new `FOLIO_GUIDES` list is defined in `constants.ts`, while `services/folioStore.ts` stores user-created guides in IndexedDB.

## Plan of Work

Add a new `FOLIO` app mode and a folio view with guide cards and a full-screen viewer modal. Add a modal that allows users to upload and name their own guide images, storing the metadata and blob in IndexedDB. Add a LaTeX-like input row to the decode view that parses commands like `\t` or `\space` into primitives and renders them via `ShorthandCanvas`. Add local recognition for primitive sequences and wire the decode action to use local recognition first, falling back to AI for freehand strokes based on confidence. Add Capacitor config and dependencies to enable Android packaging.

## Concrete Steps

From the repository root `GreggCode`:

    npm install
    npm run build
    npx cap init gregg-shorthand com.greggcode.dossier
    npx cap add android
    npx cap copy

Expected output includes a new `android/` directory and a successful asset sync.

## Validation and Acceptance

Start the web app and verify that Learn, Decode, and Folio render with cold-war styling. In Decode, enter `\t \n \e \space \r` and verify that strokes appear and a local decode result is returned when you click Execute Decode. Toggle AI fallback off to ensure local-only behavior is used. In Folio, confirm that built-in guides display (once images are present) and that a newly uploaded guide persists after refresh.

For Android, build and open the Android project, then run on an emulator or device. Touch drawing should work, and the folio should load with the guide images.

## Idempotence and Recovery

Running `npm run build` and `npx cap copy` is safe to repeat. If the Android project fails to build, re-run the build and copy steps before re-opening Android Studio. If local recognition proves unreliable for freehand input, keep AI fallback enabled while iterating on local stroke matching.

## Artifacts and Notes

Important new or modified files:

    App.tsx
    components/ShorthandCanvas.tsx
    services/localRecognition.ts
    services/latexParser.ts
    services/folioStore.ts
    constants.ts
    types.ts
    capacitor.config.ts
    public/folio/README.txt
    README.md

## Interfaces and Dependencies

`types.ts` now includes `AppMode.FOLIO` plus a `FolioGuide` model. `services/folioStore.ts` exposes async functions to load and save user guides. `services/latexParser.ts` parses LaTeX-like commands into primitive tokens, and `services/localRecognition.ts` exposes `recognizeFromPrimitives` and `recognizeFromStrokes`. `ShorthandCanvas` now exposes `getStrokes()` and accepts `onFreehandStart` to signal freehand input. Capacitor dependencies are added in `package.json`, and `capacitor.config.ts` defines the Android app ID and name.

Change note: Created this ExecPlan after implementing the requested features to document what was added, what remains (assets and Android build), and the decisions made.
