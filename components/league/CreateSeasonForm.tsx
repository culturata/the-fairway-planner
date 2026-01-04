"use client";

import { useState } from "react";
import { LeaguePointsSystem } from "@/lib/league/points";

interface CreateSeasonFormProps {
  eventId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateSeasonForm({
  eventId,
  onSuccess,
  onCancel,
}: CreateSeasonFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    pointsSystem: LeaguePointsSystem.POSITION_BASED,
    minRounds: 0,
    countBestRounds: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/seasons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          status: "ACTIVE",
          config: {
            pointsSystem: formData.pointsSystem,
            minRounds: formData.minRounds || undefined,
            countBestRounds: formData.countBestRounds || undefined,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create season");
      }

      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Season Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Spring 2024, Season 1"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700"
          >
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            value={formData.startDate}
            onChange={(e) =>
              setFormData({ ...formData, startDate: e.target.value })
            }
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700"
          >
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            value={formData.endDate}
            onChange={(e) =>
              setFormData({ ...formData, endDate: e.target.value })
            }
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="pointsSystem"
          className="block text-sm font-medium text-gray-700"
        >
          Points System
        </label>
        <select
          id="pointsSystem"
          value={formData.pointsSystem}
          onChange={(e) =>
            setFormData({
              ...formData,
              pointsSystem: e.target.value as LeaguePointsSystem,
            })
          }
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value={LeaguePointsSystem.POSITION_BASED}>
            Position Based (1st=10pts, 2nd=9pts, etc.)
          </option>
          <option value={LeaguePointsSystem.STABLEFORD}>
            Stableford Points
          </option>
          <option value={LeaguePointsSystem.STROKE_DIFF}>
            Stroke Difference from Par
          </option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="minRounds"
            className="block text-sm font-medium text-gray-700"
          >
            Minimum Rounds (Optional)
          </label>
          <input
            type="number"
            id="minRounds"
            value={formData.minRounds}
            onChange={(e) =>
              setFormData({ ...formData, minRounds: parseInt(e.target.value) || 0 })
            }
            min="0"
            placeholder="0 = no minimum"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Minimum rounds required to be eligible for standings
          </p>
        </div>

        <div>
          <label
            htmlFor="countBestRounds"
            className="block text-sm font-medium text-gray-700"
          >
            Count Best Rounds (Optional)
          </label>
          <input
            type="number"
            id="countBestRounds"
            value={formData.countBestRounds}
            onChange={(e) =>
              setFormData({
                ...formData,
                countBestRounds: parseInt(e.target.value) || 0,
              })
            }
            min="0"
            placeholder="0 = count all"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Only count best X rounds for standings
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating..." : "Create Season"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
