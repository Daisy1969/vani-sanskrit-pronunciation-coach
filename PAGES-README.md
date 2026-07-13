# Vāṇī v8 — GitHub Pages edition

This edition keeps the Version 7 acoustic comparison and Version 8 male/female reference choice. It is adapted for GitHub Pages.

## Publishing

1. Create a public GitHub repository and initialise it with a README.
2. Upload this project to the repository's `main` branch.
3. In **Settings → Pages**, set **Source** to **GitHub Actions**.
4. Open **Actions** and run **Build and deploy Vani to GitHub Pages**, or push a commit to `main`.

The workflow runs on a macOS GitHub-hosted runner. It uses macOS `say` to generate one female and one male WAV reference for every built-in Sanskrit word, then deploys the static `public` folder.

The same selected WAV is used for both playback and acoustic scoring. The slow-playback multiplier is unchanged from Version 7/8.
