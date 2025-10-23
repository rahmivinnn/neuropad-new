import React from "react";

interface CircularProgressProps {
  progress: number; // 0-100
  color?: string;
  size?: number;
  strokeWidth?: number;
  showCheckmark?: boolean;
}

export default function CircularProgress({
  progress,
  color = "#FDD835",
  size = 120,
  strokeWidth = 12,
  showCheckmark = false,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="circular-progress relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E5E5"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      
      {/* Progress text */}
      <div className="circular-progress-text neuropad-text-primary">
        {progress}%
      </div>
      
      {/* Checkmark for completed goals */}
      {showCheckmark && progress >= 75 && (
        <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full neuropad-primary flex items-center justify-center">
          <svg width="16" height="16" fill="white">
            <path d="M5 10l3 3 7-7" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </div>
  );
}
