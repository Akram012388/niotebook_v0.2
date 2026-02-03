#!/usr/bin/env python3
"""
niotebook Demo Video - Final Cut Renderer
Simple, clean edit: logo + sped-up footage + fade to black
"""

import subprocess
import os
import tempfile
import shutil
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
PUBLIC_DIR = PROJECT_DIR / "public"
BRANDING_DIR = PUBLIC_DIR / "branding" / "wordmark"
RECORDINGS_DIR = Path("/sessions/focused-dazzling-dijkstra/mnt/niotebook_v0.2/niotebook-demo-videos/recordings")
OUT_DIR = PROJECT_DIR / "out"

# Config
SPEED_FACTOR = 1.0  # Normal speed, no rush
LOGO_DURATION = 2  # seconds
FADE_DURATION = 1  # seconds fade to black at end
CRF = 18

# Brand
BG_COLOR = "0A0A0A"  # without 0x prefix for ffmpeg

def run_ffmpeg(args, desc="Processing"):
    """Run ffmpeg with progress output"""
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "warning", "-stats"] + args
    print(f"  {desc}...")
    result = subprocess.run(cmd)
    if result.returncode != 0:
        print(f"  ❌ Error in {desc}")
        return False
    print(f"  ✓ {desc} complete")
    return True

def get_video_info(video_path):
    """Get video dimensions, fps, and duration"""
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height,r_frame_rate",
         "-show_entries", "format=duration",
         "-of", "csv=p=0", str(video_path)],
        capture_output=True, text=True
    )
    lines = result.stdout.strip().split('\n')
    # First line: width,height,fps_fraction
    w, h, fps_frac = lines[0].split(',')
    fps_num, fps_den = fps_frac.split('/')
    fps = int(fps_num) / int(fps_den)
    # Second line: duration
    duration = float(lines[1])
    return int(w), int(h), fps, duration

def main():
    print("🎬 niotebook Demo - Final Cut Renderer")
    print("=" * 50)

    OUT_DIR.mkdir(exist_ok=True)

    # Get raw video info
    raw_video = RECORDINGS_DIR / "niotebook-raw.mp4"
    print(f"\n📹 Analyzing: {raw_video.name}")
    width, height, fps, raw_duration = get_video_info(raw_video)
    print(f"   Resolution: {width}×{height}")
    print(f"   Frame rate: {fps}fps")
    print(f"   Duration: {raw_duration:.2f}s")

    sped_up_duration = raw_duration / SPEED_FACTOR
    total_duration = LOGO_DURATION + sped_up_duration
    print(f"\n📊 Final video will be:")
    print(f"   Logo: {LOGO_DURATION}s")
    print(f"   Content: {sped_up_duration:.2f}s (at {SPEED_FACTOR}x)")
    print(f"   Total: {total_duration:.2f}s")

    # Create temp directory
    temp_dir = Path(tempfile.mkdtemp(prefix="niotebook_final_"))
    print(f"\n📁 Temp dir: {temp_dir}")

    try:
        # Step 1: Create logo intro
        print("\n[1/4] Creating logo intro...")
        logo_path = BRANDING_DIR / "niotebook-wordmark-dark.png"
        logo_video = temp_dir / "logo.mp4"

        # Logo scaled to ~30% of frame height, centered
        logo_scale = int(height * 0.08)  # Smaller logo as requested

        run_ffmpeg([
            "-loop", "1",
            "-i", str(logo_path),
            "-f", "lavfi",
            "-i", f"color=c={BG_COLOR}:s={width}x{height}:r={fps}:d={LOGO_DURATION}",
            "-filter_complex",
            f"[0:v]scale=-1:{logo_scale}[logo];"
            f"[1:v][logo]overlay=(W-w)/2:(H-h)/2:format=auto[out]",
            "-map", "[out]",
            "-t", str(LOGO_DURATION),
            "-c:v", "libx264",
            "-preset", "slow",
            "-crf", str(CRF),
            "-pix_fmt", "yuv420p",
            "-r", str(fps),
            str(logo_video)
        ], "Creating logo intro")

        # Step 2: Process raw footage (with optional speed adjustment)
        print("\n[2/4] Processing footage...")
        sped_video = temp_dir / "processed.mp4"

        if SPEED_FACTOR == 1.0:
            # No speed change - just re-encode for consistency (no audio)
            run_ffmpeg([
                "-i", str(raw_video),
                "-c:v", "libx264",
                "-preset", "slow",
                "-crf", str(CRF),
                "-pix_fmt", "yuv420p",
                "-an",  # Remove audio entirely
                "-r", str(fps),
                str(sped_video)
            ], "Processing at normal speed (silent)")
        else:
            # Apply speed adjustment
            run_ffmpeg([
                "-i", str(raw_video),
                "-filter_complex",
                f"[0:v]setpts={1/SPEED_FACTOR}*PTS[v];"
                f"[0:a]atempo={SPEED_FACTOR}[a]",
                "-map", "[v]",
                "-map", "[a]",
                "-c:v", "libx264",
                "-preset", "slow",
                "-crf", str(CRF),
                "-pix_fmt", "yuv420p",
                "-c:a", "aac",
                "-b:a", "192k",
                "-r", str(fps),
                str(sped_video)
            ], f"Speeding up to {SPEED_FACTOR}x")

        # Step 3: Add fade to black at end
        print("\n[3/4] Adding fade to black...")
        faded_video = temp_dir / "faded.mp4"

        # Get actual duration of sped up video
        _, _, _, actual_sped_duration = get_video_info(sped_video)
        fade_start = actual_sped_duration - FADE_DURATION

        run_ffmpeg([
            "-i", str(sped_video),
            "-vf", f"fade=t=out:st={fade_start}:d={FADE_DURATION}",
            "-c:v", "libx264",
            "-preset", "slow",
            "-crf", str(CRF),
            "-pix_fmt", "yuv420p",
            "-an",  # No audio
            str(faded_video)
        ], "Adding fade to black")

        # Step 4: Concatenate logo + faded video
        print("\n[4/4] Concatenating final video...")

        # Create concat list (video only, no audio)
        concat_list = temp_dir / "concat.txt"
        with open(concat_list, 'w') as f:
            f.write(f"file '{logo_video}'\n")
            f.write(f"file '{faded_video}'\n")

        final_output = OUT_DIR / "niotebook-demo-final.mp4"

        run_ffmpeg([
            "-f", "concat",
            "-safe", "0",
            "-i", str(concat_list),
            "-c:v", "libx264",
            "-preset", "slow",
            "-crf", str(CRF),
            "-pix_fmt", "yuv420p",
            "-an",  # No audio in final output
            str(final_output)
        ], "Final concatenation (silent)")

        # Get final info
        _, _, _, final_duration = get_video_info(final_output)
        file_size = final_output.stat().st_size / (1024 * 1024)

        print("\n" + "=" * 50)
        print("✅ Render complete!")
        print(f"📁 Output: {final_output}")
        print(f"📐 Resolution: {width}×{height} @ {fps}fps")
        print(f"⏱️  Duration: {final_duration:.2f}s")
        print(f"💾 Size: {file_size:.1f} MB")

    finally:
        print(f"\n🧹 Cleaning up temp files...")
        shutil.rmtree(temp_dir)

if __name__ == "__main__":
    main()
