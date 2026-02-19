/**
 * Experience Slider Component
 * ==========================
 * Range slider for experience level (0-10 years)
 * Visual feedback with level labels
 */

import { useState } from "react";

interface ExperienceSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const ExperienceSlider = ({ value, onChange }: ExperienceSliderProps) => {
  // Calculate level label
  const getLevelLabel = (years: number): string => {
    if (years === 0) return "Complete Beginner";
    if (years <= 1) return "Beginner";
    if (years <= 3) return "Intermediate";
    if (years <= 5) return "Advanced";
    return "Expert";
  };

  // Marks for the slider
  const marks = [
    { value: 0, label: "Beginner" },
    { value: 5, label: "Intermediate" },
    { value: 10, label: "Expert" }
  ];

  return (
    <div className="slider-container space-y-6">
      {/* Current Level Display */}
      <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-sm text-gray-600 mb-1">Current Level</div>
        <div className="text-2xl font-bold text-gray-900">
          {getLevelLabel(value)}
        </div>
        <div className="text-sm text-teal-600 font-medium mt-1">
          {value} {value === 1 ? 'year' : 'years'} experience
        </div>
      </div>

      {/* Slider */}
      <div className="relative px-2">
        <input
          type="range"
          min={0}
          max={10}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
          style={{
            background: `linear-gradient(to right, #0d9488 0%, #0d9488 ${(value / 10) * 100}%, #e5e7eb ${(value / 10) * 100}%, #e5e7eb 100%)`
          }}
        />

        {/* Marks */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {marks.map(mark => (
            <span key={mark.value}>{mark.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExperienceSlider;
