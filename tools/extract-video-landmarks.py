#!/usr/bin/env python3
"""
Video Landmark Extractor for Golden Master Testing

Gen87.X3 | Phase: HUNT (H) | Port 0 (Lidless Legion)

Extracts MediaPipe hand landmarks from video files and saves as JSON
for deterministic golden master testing.

Usage:
    python extract-video-landmarks.py input.mp4 output.jsonl

Requirements:
    pip install mediapipe opencv-python

@source HFO_DETERMINISTIC_HARNESS_SPECS: "lock per-frame landmark traces from short MP4s"
"""

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


def check_dependencies():
    """Check if required dependencies are installed."""
    try:
        import cv2
        import mediapipe
        return True
    except ImportError as e:
        print(f"Missing dependency: {e}")
        print("Install with: pip install mediapipe opencv-python")
        return False


@dataclass
class LandmarkPoint:
    """Normalized landmark point."""
    x: float
    y: float
    z: float
    visibility: float


@dataclass 
class FrameLandmarks:
    """Landmarks for a single frame."""
    frame_number: int
    timestamp_ms: float
    hand_detected: bool
    handedness: Optional[str]  # "Left" or "Right"
    landmarks: Optional[list[dict]]  # 21 landmarks or None


def extract_landmarks(video_path: str) -> list[FrameLandmarks]:
    """Extract hand landmarks from video file."""
    import cv2
    import mediapipe as mp
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    
    # Download model if needed
    import urllib.request
    import os
    
    model_path = "hand_landmarker.task"
    if not os.path.exists(model_path):
        print("Downloading hand landmarker model...")
        url = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
        urllib.request.urlretrieve(url, model_path)
        print("Model downloaded.")
    
    results = []
    
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    print(f"Video: {video_path}")
    print(f"FPS: {fps}, Total frames: {frame_count}")
    
    # Create hand landmarker
    base_options = python.BaseOptions(model_asset_path=model_path)
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=1,
        min_hand_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    with vision.HandLandmarker.create_from_options(options) as landmarker:
        frame_number = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Create MediaPipe image
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            
            # Process with MediaPipe
            result = landmarker.detect(mp_image)
            
            timestamp_ms = (frame_number / fps) * 1000
            
            if result.hand_landmarks and len(result.hand_landmarks) > 0:
                hand_landmarks = result.hand_landmarks[0]
                handedness = "Right"  # Default
                
                if result.handedness:
                    handedness = result.handedness[0][0].category_name
                
                landmarks = []
                for lm in hand_landmarks:
                    landmarks.append({
                        "x": lm.x,
                        "y": lm.y,
                        "z": lm.z,
                        "visibility": 1.0
                    })
                
                results.append(FrameLandmarks(
                    frame_number=frame_number,
                    timestamp_ms=timestamp_ms,
                    hand_detected=True,
                    handedness=handedness,
                    landmarks=landmarks
                ))
            else:
                results.append(FrameLandmarks(
                    frame_number=frame_number,
                    timestamp_ms=timestamp_ms,
                    hand_detected=False,
                    handedness=None,
                    landmarks=None
                ))
            
            frame_number += 1
            
            # Progress indicator
            if frame_number % 30 == 0:
                print(f"  Processed {frame_number}/{frame_count} frames...")
    
    cap.release()
    print(f"  Extraction complete: {len(results)} frames")
    
    return results


def save_landmarks(landmarks: list[FrameLandmarks], output_path: str):
    """Save landmarks to JSONL file (one JSON per line)."""
    with open(output_path, 'w') as f:
        for frame in landmarks:
            record = {
                "frameNumber": frame.frame_number,
                "timestampMs": frame.timestamp_ms,
                "handDetected": frame.hand_detected,
                "handedness": frame.handedness,
                "landmarks": frame.landmarks
            }
            f.write(json.dumps(record) + "\n")
    
    print(f"Saved {len(landmarks)} frames to {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Extract MediaPipe hand landmarks from video for golden master testing"
    )
    parser.add_argument("input", help="Input video file (MP4)")
    parser.add_argument("output", nargs="?", help="Output JSONL file (default: input.landmarks.jsonl)")
    
    args = parser.parse_args()
    
    if not check_dependencies():
        sys.exit(1)
    
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}")
        sys.exit(1)
    
    output_path = args.output or str(input_path.with_suffix('.landmarks.jsonl'))
    
    landmarks = extract_landmarks(str(input_path))
    save_landmarks(landmarks, output_path)
    
    # Print summary
    detected_frames = sum(1 for f in landmarks if f.hand_detected)
    print(f"\nSummary:")
    print(f"  Total frames: {len(landmarks)}")
    print(f"  Frames with hand: {detected_frames}")
    print(f"  Detection rate: {detected_frames / len(landmarks) * 100:.1f}%")


if __name__ == "__main__":
    main()
