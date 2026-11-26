import { StyleSheet } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { isVisibleLandmark, type PoseFrame, type PoseLandmark } from './exercise-counter';

export function fitPoseToPreview(pose: PoseFrame, previewAspect: number): PoseFrame {
  // The Android preview fills the view and crops the dimension that overflows.
  const scaleX = Math.max(1, pose.aspectRatio / previewAspect);
  const scaleY = Math.max(1, previewAspect / pose.aspectRatio);
  return {
    ...pose,
    aspectRatio: previewAspect,
    landmarks: pose.landmarks.map((point) => ({ ...point,
      x: (point.x - 0.5) * scaleX + 0.5,
      y: (point.y - 0.5) * scaleY + 0.5,
    })),
  };
}

const connections = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24],
  [23, 24], [23, 25], [25, 27], [27, 29], [27, 31], [24, 26], [26, 28], [28, 30], [28, 32],
] as const;

export function PoseSkeleton({ landmarks }: { landmarks: PoseLandmark[] }) {
  if (landmarks.length === 0) return null;

  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%"
      viewBox="0 0 100 100" preserveAspectRatio="none" accessible={false}>
      {connections.map(([start, end]) => {
        const a = landmarks[start];
        const b = landmarks[end];
        if (!isVisibleLandmark(a) || !isVisibleLandmark(b)) return null;
        return <Line key={`${start}-${end}`} x1={a.x * 100} y1={a.y * 100} x2={b.x * 100} y2={b.y * 100}
          stroke="#7DF8C3" strokeWidth={0.75} strokeLinecap="round" />;
      })}
      {landmarks.map((point, index) => (index === 0 || index >= 11) && isVisibleLandmark(point)
        ? <Circle key={index} cx={point.x * 100} cy={point.y * 100} r={0.65} fill="#FFFFFF" />
        : null)}
    </Svg>
  );
}
