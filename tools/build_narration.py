"""Voice-over of the 30-second video, with Kokoro TTS (kokoro-onnx, runs offline).

    <python with kokoro-onnx> tools/build_narration.py <kokoro-v1.0.onnx> <voices-v1.0.bin> [voice]

Writes tools/video-narration.wav (48 kHz mono). tools/build_video.py mixes it with the music if it exists.
Model files: https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
Each line starts at a given second (in sync with the video) and is sped up if it would overrun the next line.
"""
import sys, wave
from pathlib import Path

import numpy as np
from kokoro_onnx import Kokoro

OUT = Path(__file__).resolve().parent / 'video-narration.wav'
SR = 48000
DUR = 30.0

# (start in seconds, latest end, text): same timings as tools/build_video.py
LINES = [
    (0.95, 2.4, 'Every second counts.'),
    (2.5, 4.25, 'A recap, by Team Firefighters.'),
    (4.3, 7.45, 'Challenge one. Sixty minutes, minute by minute.'),
    (7.6, 11.9, 'Challenge two. A quiz on the phone, at the start, and again at the end.'),
    (12.1, 19.1, 'Challenge three. Put out the fire! Every second, the fire grows. A right move is water. A trap card is petrol.'),
    (19.3, 23.0, 'Challenge four. A fake email. Two thousand euros. What do you do?'),
    (23.2, 26.3, 'Challenge five. One page, to take home.'),
    (26.45, 27.55, 'Learning, measured.'),
    (27.65, 29.95, 'Stop. Disconnect. Report. Write down.'),
]


def main():
    model, voices = sys.argv[1], sys.argv[2]
    voice = sys.argv[3] if len(sys.argv) > 3 else 'am_michael'
    k = Kokoro(model, voices)
    track = np.zeros(int(SR * DUR), np.float32)
    for start, end, text in LINES:
        speed = 1.0
        for _ in range(6):
            audio, sr = k.create(text, voice=voice, speed=speed, lang='en-us')
            audio = np.trim_zeros(audio, 'f') if audio.size else audio
            dur = len(audio) / sr
            if dur <= end - start or speed >= 1.4:
                break
            speed = min(1.4, speed * dur / (end - start) * 1.02)
        n = int(len(audio) * SR / sr)  # resample to 48 kHz
        audio = np.interp(np.arange(n) * sr / SR, np.arange(len(audio)), audio).astype(np.float32)
        s = int(start * SR)
        e = min(len(track), s + len(audio))
        track[s:e] += audio[:e - s]
        print(f'{start:5.2f}-{start + len(audio) / SR:5.2f} s (max {end:5.2f}) speed {speed:.2f}  {text}')
    track /= max(1e-9, np.abs(track).max())
    with wave.open(str(OUT), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((track * 32767 * 0.95).astype(np.int16).tobytes())
    print('wrote', OUT)


if __name__ == '__main__':
    main()
