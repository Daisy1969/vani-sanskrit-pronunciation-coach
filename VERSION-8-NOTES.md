# Version 8 — Natural Voice Choice

Version 8 keeps the Version 7 Acoustic Match checker unchanged and changes only the reference voice system.

- Choose **Female** or **Male** under Settings → Reference audio.
- On macOS, the local server chooses the most natural matching installed Mac voice.
- Preferred Indian voices are used when installed; otherwise the app uses a compatible natural English voice such as Samantha or Alex.
- Each selected voice is rendered to a WAV file on the Mac and cached locally.
- The exact WAV played by **Hear word** and **Hear slowly** is also used by Acoustic Match for the percentage score.
- The **Hear slowly** speed remains the same as Version 7.
- No microphone, voice scanning, sound/rhythm/clarity scoring, or progress behaviour was changed.

The generated reference recordings are stored locally in `.generated-reference-audio` inside the application folder.
