# Version 7 — Acoustic Match

Version 7 no longer scores speech-to-text output. It compares the recorded audio directly with the exact reference recording played by the app.

- Bundled reference WAV recordings for all built-in Sanskrit words.
- MFCC + delta features for sound-spectrum comparison.
- Dynamic time warping so slower or faster speech can still align with the reference.
- Target-aware segment selection: the complete recording is scanned and each plausible voice/background segment is compared with the target.
- Percentage breakdown for sound, rhythm and clarity.
- No Chrome phonetic transcript is required and no speech-recognition start chime is used.
