#!/usr/bin/env python3
"""
Generate iOS-inspired UI sound effects for niotebook demo video.
Creates clean, digital but warm sounds.
"""

import numpy as np
from scipy.io import wavfile
import os

SAMPLE_RATE = 48000
OUTPUT_DIR = "../public/sfx"

def ensure_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

def normalize(audio):
    """Normalize audio to prevent clipping"""
    max_val = np.max(np.abs(audio))
    if max_val > 0:
        audio = audio / max_val * 0.8
    return audio

def apply_envelope(audio, attack_ms=5, decay_ms=50, sustain=0.7, release_ms=100):
    """Apply ADSR envelope"""
    samples = len(audio)
    attack = int(SAMPLE_RATE * attack_ms / 1000)
    decay = int(SAMPLE_RATE * decay_ms / 1000)
    release = int(SAMPLE_RATE * release_ms / 1000)

    envelope = np.ones(samples)

    # Attack
    if attack > 0:
        envelope[:attack] = np.linspace(0, 1, attack)

    # Decay
    if decay > 0 and attack + decay < samples:
        envelope[attack:attack+decay] = np.linspace(1, sustain, decay)

    # Sustain (implicit)
    if attack + decay < samples - release:
        envelope[attack+decay:samples-release] = sustain

    # Release
    if release > 0:
        envelope[-release:] = np.linspace(sustain, 0, release)

    return audio * envelope

def generate_ping(filename="ping.wav"):
    """iOS-style notification ping - bright, clear two-note ascending tone"""
    duration = 0.25
    samples = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, samples)

    # Two-note ascending (C6 to E6)
    freq1, freq2 = 1047, 1319

    # First note (short)
    note1 = np.sin(2 * np.pi * freq1 * t) * np.exp(-t * 20)

    # Second note (longer, starts after 0.05s)
    note2_start = int(SAMPLE_RATE * 0.05)
    note2 = np.zeros(samples)
    t2 = np.linspace(0, duration - 0.05, samples - note2_start)
    note2[note2_start:] = np.sin(2 * np.pi * freq2 * t2) * np.exp(-t2 * 15)

    audio = (note1 * 0.6 + note2 * 0.8)
    audio = apply_envelope(audio, attack_ms=2, decay_ms=30, sustain=0.5, release_ms=80)
    audio = normalize(audio)

    wavfile.write(os.path.join(OUTPUT_DIR, filename), SAMPLE_RATE, (audio * 32767).astype(np.int16))
    print(f"Generated {filename}")

def generate_click(filename="click.wav"):
    """macOS-style button click - crisp, tactile"""
    duration = 0.05
    samples = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, samples)

    # Low thud + high click
    low = np.sin(2 * np.pi * 200 * t) * np.exp(-t * 80)
    high = np.sin(2 * np.pi * 2000 * t) * np.exp(-t * 150)

    audio = low * 0.6 + high * 0.4
    audio = apply_envelope(audio, attack_ms=1, decay_ms=10, sustain=0.3, release_ms=20)
    audio = normalize(audio)

    wavfile.write(os.path.join(OUTPUT_DIR, filename), SAMPLE_RATE, (audio * 32767).astype(np.int16))
    print(f"Generated {filename}")

def generate_whoosh(filename="whoosh.wav"):
    """Soft panel slide whoosh"""
    duration = 0.3
    samples = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, samples)

    # Filtered noise sweep
    noise = np.random.randn(samples) * 0.3

    # Frequency sweep envelope
    freq_envelope = np.exp(-t * 8) * 0.5 + 0.1

    # Simple low-pass effect via moving average
    window_size = 50
    audio = np.convolve(noise, np.ones(window_size)/window_size, mode='same')

    audio = audio * freq_envelope
    audio = apply_envelope(audio, attack_ms=10, decay_ms=50, sustain=0.4, release_ms=150)
    audio = normalize(audio) * 0.5  # Quieter

    wavfile.write(os.path.join(OUTPUT_DIR, filename), SAMPLE_RATE, (audio * 32767).astype(np.int16))
    print(f"Generated {filename}")

def generate_success(filename="success.wav"):
    """Ascending success chime"""
    duration = 0.35
    samples = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, samples)

    # Ascending chord: C5, E5, G5
    freqs = [523, 659, 784]
    audio = np.zeros(samples)

    for i, freq in enumerate(freqs):
        delay = int(SAMPLE_RATE * i * 0.04)
        tone_samples = samples - delay
        tone_t = np.linspace(0, (samples - delay) / SAMPLE_RATE, tone_samples)
        tone = np.sin(2 * np.pi * freq * tone_t) * np.exp(-tone_t * 8)
        audio[delay:] += tone * (0.8 - i * 0.15)

    audio = apply_envelope(audio, attack_ms=3, decay_ms=40, sustain=0.6, release_ms=120)
    audio = normalize(audio)

    wavfile.write(os.path.join(OUTPUT_DIR, filename), SAMPLE_RATE, (audio * 32767).astype(np.int16))
    print(f"Generated {filename}")

def generate_typing(filename="typing.wav"):
    """Soft keyboard click for typing sequences"""
    duration = 0.03
    samples = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, samples)

    # Very short, soft click
    freq = 1500 + np.random.randint(-200, 200)
    audio = np.sin(2 * np.pi * freq * t) * np.exp(-t * 200)

    # Add subtle noise
    audio += np.random.randn(samples) * 0.05 * np.exp(-t * 300)

    audio = apply_envelope(audio, attack_ms=1, decay_ms=5, sustain=0.2, release_ms=10)
    audio = normalize(audio) * 0.6

    wavfile.write(os.path.join(OUTPUT_DIR, filename), SAMPLE_RATE, (audio * 32767).astype(np.int16))
    print(f"Generated {filename}")

if __name__ == "__main__":
    ensure_dir()
    generate_ping()
    generate_click()
    generate_whoosh()
    generate_success()
    generate_typing()
    print(f"\nAll SFX generated in {OUTPUT_DIR}/")
