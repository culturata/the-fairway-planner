"use client";

import { useState } from "react";

export enum ScoringFormat {
  STROKE_PLAY = "STROKE_PLAY",
  STABLEFORD = "STABLEFORD",
  MODIFIED_STABLEFORD = "MODIFIED_STABLEFORD",
  MATCH_PLAY = "MATCH_PLAY",
  SCRAMBLE = "SCRAMBLE",
  BEST_BALL = "BEST_BALL",
}

interface ScoringFormatOption {
  format: ScoringFormat;
  name: string;
  description: string;
  icon: string;
}

const SCORING_FORMATS: ScoringFormatOption[] = [
  {
    format: ScoringFormat.STROKE_PLAY,
    name: "Stroke Play",
    description:
      "Traditional golf scoring - lowest score wins. Net scores calculated by subtracting handicap from gross scores.",
    icon: "⛳",
  },
  {
    format: ScoringFormat.STABLEFORD,
    name: "Stableford",
    description:
      "Points-based system where higher scores are better. Eagle=4, Birdie=3, Par=2, Bogey=1.",
    icon: "📊",
  },
  {
    format: ScoringFormat.MODIFIED_STABLEFORD,
    name: "Modified Stableford",
    description:
      "Custom points system. Typically: Eagle=5, Birdie=2, Par=0, Bogey=-1, Double=-3.",
    icon: "📈",
  },
  {
    format: ScoringFormat.MATCH_PLAY,
    name: "Match Play",
    description:
      "Head-to-head competition where you win/lose/tie each hole. Match is won when opponent cannot catch up.",
    icon: "🤝",
  },
  {
    format: ScoringFormat.SCRAMBLE,
    name: "Scramble",
    description:
      "Team format where all players hit from the best shot. Team records one score per hole.",
    icon: "👥",
  },
  {
    format: ScoringFormat.BEST_BALL,
    name: "Best Ball",
    description:
      "Each player plays their own ball. Team score on each hole is the lowest net score among members.",
    icon: "🏌️",
  },
];

interface ScoringFormatSelectorProps {
  selectedFormat: ScoringFormat;
  onSelectFormat: (format: ScoringFormat) => void;
}

export default function ScoringFormatSelector({
  selectedFormat,
  onSelectFormat,
}: ScoringFormatSelectorProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium">Scoring Format</label>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showDetails ? "Hide Details" : "Show Details"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SCORING_FORMATS.map((option) => {
          const isSelected = selectedFormat === option.format;

          return (
            <button
              key={option.format}
              type="button"
              onClick={() => onSelectFormat(option.format)}
              className={`text-left p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{option.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{option.name}</h3>
                    {isSelected && (
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  {showDetails && (
                    <p className="text-sm text-gray-600 mt-1">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedFormat === ScoringFormat.MATCH_PLAY && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Match Play requires pairing players for head-to-head
            competition. You&apos;ll configure pairings when creating tee groups.
          </p>
        </div>
      )}

      {(selectedFormat === ScoringFormat.SCRAMBLE ||
        selectedFormat === ScoringFormat.BEST_BALL) && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Team formats require setting up teams before the
            round. Each team will have one shared scorecard.
          </p>
        </div>
      )}
    </div>
  );
}
