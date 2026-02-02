#!/usr/bin/env python3
"""
niotebook Demo Video Renderer using FFmpeg
Renders the 30s looping demo video without requiring a browser.

Sequence Plan (at 60fps):
0:00-0:02 (0-120)     Logo reveal
0:02-0:04 (120-240)   Workspace slides in (1-pane video)
0:04-0:06 (240-360)   Layout 1→2 transition
0:06-0:09 (360-540)   Layout 2→3 transition
0:09-0:13 (540-780)   Code execution (with zoom)
0:13-0:21 (780-1260)  AI chat hero (with zoom)
0:21-0:24 (1260-1440) Full workspace
0:24-0:28 (1440-1680) Layout dance
0:28-0:30 (1680-1800) Exit animation → loop
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
RECORDINGS_DIR = PUBLIC_DIR / "recordings"
SFX_DIR = PUBLIC_DIR / "sfx"
BRANDING_DIR = PUBLIC_DIR / "branding" / "wordmark"
OUT_DIR = PROJECT_DIR / "out"

# Video config
WIDTH = 1660
HEIGHT = 1080
FPS = 60
DURATION = 30  # seconds
TOTAL_FRAMES = FPS * DURATION

# Brand colors
BG_COLOR = "0x0A0A0A"

def ensure_dirs():
    OUT_DIR.mkdir(exist_ok=True)

def run_ffmpeg(args, desc="Processing"):
    """Run ffmpeg with progress output"""
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "warning", "-stats"] + args
    print(f"  {desc}...")
    result = subprocess.run(cmd, capture_output=False)
    if result.returncode != 0:
        print(f"  Error in {desc}")
        return False
    return True

def create_logo_video(output_path, duration_frames=130):
    """Create logo reveal video with fade in/out"""
    logo_path = BRANDING_DIR / "niotebook-wordmark-dark.png"
    duration = duration_frames / FPS

    # Create logo video with fade in (0.5s), hold, fade out (0.5s)
    filter_complex = (
        f"color=c={BG_COLOR}:s={WIDTH}x{HEIGHT}:d={duration}:r={FPS}[bg];"
        f"[0:v]scale=-1:{HEIGHT//2},format=rgba[logo];"
        f"[logo]fade=t=in:st=0:d=0.5,fade=t=out:st={duration-0.5}:d=0.5[logofade];"
        f"[bg][logofade]overlay=(W-w)/2:(H-h)/2:format=auto"
    )

    args = [
        "-loop", "1",
        "-i", str(logo_path),
        "-filter_complex", filter_complex,
        "-t", str(duration),
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        str(output_path)
    ]
    return run_ffmpeg(args, "Creating logo reveal")

def process_video_segment(input_path, output_path, speed=1.0, start_time=0, duration=None,
                          slide_from=None, zoom_config=None):
    """Process a video segment with speed adjustment and optional effects"""

    filters = []

    # Speed adjustment
    if speed != 1.0:
        filters.append(f"setpts={1/speed}*PTS")

    # Scale to output size
    filters.append(f"scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=decrease")
    filters.append(f"pad={WIDTH}:{HEIGHT}:(ow-iw)/2:(oh-ih)/2:color={BG_COLOR}")

    # FPS standardization
    filters.append(f"fps={FPS}")

    filter_str = ",".join(filters) if filters else "null"

    args = ["-i", str(input_path)]

    if start_time > 0:
        args = ["-ss", str(start_time)] + args

    args += [
        "-vf", filter_str,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-an",  # No audio for now
        "-pix_fmt", "yuv420p"
    ]

    if duration:
        args += ["-t", str(duration)]

    args.append(str(output_path))

    return run_ffmpeg(args, f"Processing {input_path.name}")

def create_black_screen(output_path, duration_frames):
    """Create a black screen video"""
    duration = duration_frames / FPS
    args = [
        "-f", "lavfi",
        "-i", f"color=c={BG_COLOR}:s={WIDTH}x{HEIGHT}:d={duration}:r={FPS}",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        str(output_path)
    ]
    return run_ffmpeg(args, "Creating black screen")

def concat_videos(input_files, output_path):
    """Concatenate multiple video files"""
    # Create concat list file
    list_file = output_path.parent / "concat_list.txt"
    with open(list_file, 'w') as f:
        for input_file in input_files:
            f.write(f"file '{input_file}'\n")

    args = [
        "-f", "concat",
        "-safe", "0",
        "-i", str(list_file),
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        str(output_path)
    ]
    result = run_ffmpeg(args, "Concatenating segments")

    # Cleanup
    list_file.unlink()
    return result

def create_audio_mix(output_path, duration):
    """Create mixed audio track with all SFX"""

    # Audio events: (frame, sfx_file, volume)
    audio_events = [
        (25, "ping.wav", 0.7),
        (108, "whoosh.wav", 0.4),
        (260, "click.wav", 0.6),
        (380, "click.wav", 0.6),
        (700, "success.wav", 0.5),
        (850, "typing.wav", 0.3),
        (880, "typing.wav", 0.3),
        (920, "typing.wav", 0.3),
        (960, "typing.wav", 0.3),
        (1150, "success.wav", 0.4),
        (1480, "click.wav", 0.5),
        (1540, "click.wav", 0.5),
        (1600, "click.wav", 0.5),
        (1720, "ping.wav", 0.5),
    ]

    args = []
    filter_parts = []
    audio_inputs = []

    # Add all SFX inputs
    for i, (frame, sfx, volume) in enumerate(audio_events):
        sfx_path = SFX_DIR / sfx
        args += ["-i", str(sfx_path)]
        delay_ms = int(frame / FPS * 1000)
        filter_parts.append(f"[{i}:a]adelay={delay_ms}|{delay_ms},volume={volume}[a{i}]")
        audio_inputs.append(f"[a{i}]")

    # Mix all SFX
    mix_inputs = "".join(audio_inputs)
    filter_parts.append(f"{mix_inputs}amix=inputs={len(audio_events)}:dropout_transition=2,apad=whole_dur={duration}[mixed]")

    filter_complex = ";".join(filter_parts)

    args = args + [
        "-filter_complex", filter_complex,
        "-map", "[mixed]",
        "-c:a", "aac",
        "-b:a", "192k",
        "-t", str(duration),
        str(output_path)
    ]

    return run_ffmpeg(args, "Creating audio mix")

def add_audio_layers(video_path, audio_path, output_path):
    """Combine video with pre-mixed audio"""
    args = [
        "-i", str(video_path),
        "-i", str(audio_path),
        "-map", "0:v",
        "-map", "1:a",
        "-c:v", "copy",
        "-c:a", "copy",
        str(output_path)
    ]
    return run_ffmpeg(args, "Combining video and audio")

def main():
    print("🎬 niotebook Demo Video Renderer")
    print("=" * 50)

    ensure_dirs()

    # Create temp directory for intermediate files
    temp_dir = Path(tempfile.mkdtemp(prefix="niotebook_render_"))
    print(f"Using temp directory: {temp_dir}")

    try:
        segments = []

        # Scene 1: Logo Reveal (0-2.17s = 130 frames)
        print("\n[1/9] Logo Reveal")
        logo_out = temp_dir / "01_logo.mp4"
        create_logo_video(logo_out, duration_frames=130)
        segments.append(logo_out)

        # Scene 2: Workspace Entry (1.8-4.2s = 144 frames at 1.5x speed)
        print("\n[2/9] Workspace Entry")
        scene2_out = temp_dir / "02_workspace.mp4"
        # At 1.5x speed, 144 output frames need 216 input frames = 3.6s source
        process_video_segment(
            RECORDINGS_DIR / "1-pane-video.mp4",
            scene2_out,
            speed=1.5,
            start_time=1.0,  # Skip first second
            duration=144/FPS  # Output duration
        )
        segments.append(scene2_out)

        # Scene 3: Layout 1→2 (4-6s = 120 frames at 2x speed)
        print("\n[3/9] Layout 1→2 Transition")
        scene3_out = temp_dir / "03_layout12.mp4"
        process_video_segment(
            RECORDINGS_DIR / "layout-1to2.mp4",
            scene3_out,
            speed=2.0,
            duration=120/FPS
        )
        segments.append(scene3_out)

        # Scene 4: Layout 2→3 (6-9s = 180 frames at 2x speed)
        print("\n[4/9] Layout 2→3 Transition")
        scene4_out = temp_dir / "04_layout23.mp4"
        process_video_segment(
            RECORDINGS_DIR / "layout-2to3.mp4",
            scene4_out,
            speed=2.0,
            duration=180/FPS
        )
        segments.append(scene4_out)

        # Scene 5: Code Execution (9-13s = 240 frames at 1.5x speed)
        print("\n[5/9] Code Execution")
        scene5_out = temp_dir / "05_code.mp4"
        process_video_segment(
            RECORDINGS_DIR / "code-execution.mp4",
            scene5_out,
            speed=1.5,
            duration=240/FPS
        )
        segments.append(scene5_out)

        # Scene 6: AI Chat Hero (13-21s = 480 frames at 2.5x speed)
        print("\n[6/9] AI Chat Hero Moment")
        scene6_out = temp_dir / "06_aichat.mp4"
        process_video_segment(
            RECORDINGS_DIR / "ai-chat.mp4",
            scene6_out,
            speed=2.5,
            duration=480/FPS
        )
        segments.append(scene6_out)

        # Scene 7: Full Workspace (21-24s = 180 frames at 1.5x speed)
        print("\n[7/9] Full Workspace Glory")
        scene7_out = temp_dir / "07_fullworkspace.mp4"
        process_video_segment(
            RECORDINGS_DIR / "full-workspace.mp4",
            scene7_out,
            speed=1.5,
            duration=180/FPS
        )
        segments.append(scene7_out)

        # Scene 8: Layout Dance (24-28s = 240 frames at 2x speed)
        print("\n[8/9] Layout Dance")
        scene8_out = temp_dir / "08_layoutdance.mp4"
        process_video_segment(
            RECORDINGS_DIR / "layout-dance.mp4",
            scene8_out,
            speed=2.0,
            duration=240/FPS
        )
        segments.append(scene8_out)

        # Scene 9: Black screen for loop (28.5-30s = 90 frames)
        print("\n[9/9] Exit to Loop")
        scene9_out = temp_dir / "09_black.mp4"
        create_black_screen(scene9_out, duration_frames=90)
        segments.append(scene9_out)

        # Concatenate all segments
        print("\n📼 Concatenating all segments...")
        video_only = temp_dir / "video_only.mp4"
        concat_videos(segments, video_only)

        # Get video duration
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "csv=p=0", str(video_only)],
            capture_output=True, text=True
        )
        video_duration = float(result.stdout.strip())
        print(f"  Video duration: {video_duration:.2f}s")

        # Create audio mix
        print("\n🔊 Creating audio mix...")
        audio_mix = temp_dir / "audio_mix.m4a"
        create_audio_mix(audio_mix, video_duration)

        # Combine video and audio
        print("\n🎬 Combining video and audio...")
        final_output = OUT_DIR / "niotebook-demo.mp4"
        add_audio_layers(video_only, audio_mix, final_output)

        # Get final file info
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries",
             "format=duration,size", "-of", "csv=p=0", str(final_output)],
            capture_output=True, text=True
        )

        print("\n" + "=" * 50)
        print("✅ Render complete!")
        print(f"📁 Output: {final_output}")
        if result.returncode == 0:
            parts = result.stdout.strip().split(',')
            if len(parts) >= 2:
                duration = float(parts[0])
                size_mb = int(parts[1]) / (1024 * 1024)
                print(f"⏱️  Duration: {duration:.2f}s")
                print(f"💾 Size: {size_mb:.1f} MB")

    finally:
        # Cleanup temp files
        print(f"\n🧹 Cleaning up temp files...")
        shutil.rmtree(temp_dir)

if __name__ == "__main__":
    main()
