#!/usr/bin/env python3
"""
Video Landmark & Gesture Extractor for Golden Master Testing

Gen87.X3 | Phase: HUNT (H) | Port 0 (Lidless Legion)

Extracts MediaPipe hand landmarks AND gesture classifications from video files
and saves as JSONL for deterministic golden master testing.

Usage:
    python extract-video-landmarks.py input.mp4 output.jsonl

Requirements:
    pip install mediapipe opencv-python

@source HFO_DETERMINISTIC_HARNESS_SPECS: "lock per-frame landmark traces from short MP4s"
@source MediaPipe GestureRecognizer: https://developers.google.com/mediapipe/solutions/vision/gesture_recognizer
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
    """Landmarks for a single frame with gesture classification."""
    frame_number: int
    timestamp_ms: float
    hand_detected: bool
    handedness: Optional[str]  # "Left" or "Right"
    landmarks: Optional[list[dict]]  # 21 landmarks or None
    gesture: Optional[str]  # "Open_Palm", "Pointing_Up", "Victory", etc.
    gesture_confidence: Optional[float]  # 0.0-1.0


def extract_landmarks(video_path: str) -> list[FrameLandmarks]:
    """Extract hand landmarks AND gestures from video file."""
    import cv2
    import mediapipe as mp
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    
    # Download gesture recognizer model if needed (includes landmarks + gestures)
    import urllib.request
    import os
    
    model_path = "gesture_recognizer.task"
    if not os.path.exists(model_path):
        print("Downloading gesture recognizer model...")
        url = "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task"
        urllib.request.urlretrieve(url, model_path)
        print("Model downloaded.")
    
    results = []
    
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    print(f"Video: {video_path}")
    print(f"FPS: {fps}, Total frames: {frame_count}")
    
    # Create gesture recognizer (gives landmarks + gesture classification)
    base_options = python.BaseOptions(model_asset_path=model_path)
    options = vision.GestureRecognizerOptions(
        base_options=base_options,
        num_hands=1,
        min_hand_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    with vision.GestureRecognizer.create_from_options(options) as recognizer:
        frame_number = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Create MediaPipe image
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            
            # Process with MediaPipe GestureRecognizer
            result = recognizer.recognize(mp_image)
            
            timestamp_ms = (frame_number / fps) * 1000
            
            if result.hand_landmarks and len(result.hand_landmarks) > 0:
                hand_landmarks = result.hand_landmarks[0]
                handedness = "Right"  # Default
                gesture = "None"
                gesture_confidence = 0.0
                
                if result.handedness:
                    handedness = result.handedness[0][0].category_name
                
                # Extract gesture classification
                if result.gestures and len(result.gestures) > 0:
                    top_gesture = result.gestures[0][0]
                    gesture = top_gesture.category_name
                    gesture_confidence = top_gesture.score
                
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
                    landmarks=landmarks,
                    gesture=gesture,
                    gesture_confidence=gesture_confidence
                ))
            else:
                results.append(FrameLandmarks(
                    frame_number=frame_number,
                    timestamp_ms=timestamp_ms,
                    hand_detected=False,
                    handedness=None,
                    landmarks=None,
                    gesture=None,
                    gesture_confidence=None
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
                "landmarks": frame.landmarks,
                "gesture": frame.gesture,
                "gestureConfidence": frame.gesture_confidence
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
    
    # Count gestures
    gesture_counts = {}
    for f in landmarks:
        if f.gesture:
            gesture_counts[f.gesture] = gesture_counts.get(f.gesture, 0) + 1
    
    print(f"\nSummary:")
    print(f"  Total frames: {len(landmarks)}")
    print(f"  Frames with hand: {detected_frames}")
    print(f"  Detection rate: {detected_frames / len(landmarks) * 100:.1f}%")
    print(f"  Gesture counts:")
    for gesture, count in sorted(gesture_counts.items(), key=lambda x: -x[1]):
        print(f"    {gesture}: {count}")


if __name__ == "__main__":
    main()
