# Version 7 implementation notes

The previous versions relied on speech-to-text output. That approach failed when Chrome heard the voice but returned no text, and it could confuse Sanskrit sounds with unrelated English words.

Version 7 uses direct acoustic comparison:

1. Decode the full recording with Web Audio.
2. Detect multiple plausible speech-like segments rather than trusting only the first loud sound.
3. Extract MFCC-style spectral features and temporal delta features from each segment and the target recording.
4. Align the feature sequences with dynamic time warping so speaking speed can differ.
5. Select the candidate segment with the best target match.
6. Combine spectral, rhythm, duration and clarity measures into a percentage.

This approach measures similarity to the played reference and is independent of speech-to-text support. It is not a trained Sanskrit phoneme-recognition model, so the result remains an educational similarity score rather than a formal linguistic assessment.
