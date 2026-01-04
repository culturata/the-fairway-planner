"use client";

interface Tee {
  id: string;
  name: string;
  gender?: string;
  courseRating?: number;
  slopeRating?: number;
  totalYardage?: number;
  par: number;
}

interface TeeSelectorProps {
  tees: Tee[];
  selectedTeeId?: string | null;
  onSelectTee: (teeId: string | null) => void;
  required?: boolean;
}

export default function TeeSelector({
  tees,
  selectedTeeId,
  onSelectTee,
  required = false,
}: TeeSelectorProps) {
  if (tees.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No tee data available for this course
      </div>
    );
  }

  const getTeeColor = (name: string): string => {
    const normalized = name.toLowerCase();
    if (normalized.includes("black") || normalized.includes("tips"))
      return "bg-gray-900 text-white";
    if (normalized.includes("blue")) return "bg-blue-600 text-white";
    if (normalized.includes("white")) return "bg-gray-100 text-gray-900 border";
    if (normalized.includes("gold") || normalized.includes("yellow"))
      return "bg-yellow-400 text-gray-900";
    if (normalized.includes("red")) return "bg-red-600 text-white";
    if (normalized.includes("green")) return "bg-green-600 text-white";
    return "bg-gray-300 text-gray-900";
  };

  const getGenderLabel = (gender?: string): string => {
    if (!gender) return "";
    if (gender === "M") return "Men's";
    if (gender === "F") return "Women's";
    if (gender === "A") return "All";
    return "";
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Select Tees {required && <span className="text-red-600">*</span>}
      </label>

      <div className="space-y-2">
        {tees.map((tee) => {
          const isSelected = selectedTeeId === tee.id;

          return (
            <button
              key={tee.id}
              type="button"
              onClick={() => onSelectTee(tee.id)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getTeeColor(
                      tee.name
                    )}`}
                  >
                    {tee.name}
                  </span>
                  {tee.gender && (
                    <span className="text-sm text-gray-600">
                      {getGenderLabel(tee.gender)}
                    </span>
                  )}
                </div>
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

              <div className="grid grid-cols-3 gap-4 text-sm">
                {tee.courseRating && (
                  <div>
                    <div className="text-gray-500">Rating</div>
                    <div className="font-semibold">{tee.courseRating}</div>
                  </div>
                )}
                {tee.slopeRating && (
                  <div>
                    <div className="text-gray-500">Slope</div>
                    <div className="font-semibold">{tee.slopeRating}</div>
                  </div>
                )}
                {tee.totalYardage && (
                  <div>
                    <div className="text-gray-500">Yardage</div>
                    <div className="font-semibold">
                      {tee.totalYardage.toLocaleString()}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-gray-500">Par</div>
                  <div className="font-semibold">{tee.par}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {!required && selectedTeeId && (
        <button
          type="button"
          onClick={() => onSelectTee(null)}
          className="mt-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Clear selection
        </button>
      )}
    </div>
  );
}
