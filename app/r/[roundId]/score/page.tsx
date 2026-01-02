"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ScoreEntryPage() {
  const params = useParams();
  const router = useRouter();
  const roundId = params.roundId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scorecard, setScorecard] = useState<any>(null);
  const [scores, setScores] = useState<(number | null)[]>(Array(18).fill(null));

  useEffect(() => {
    // Fetch round and user's scorecard
    fetch(`/api/rounds/${roundId}`)
      .then((res) => res.json())
      .then(async (data) => {
        const round = data.round;

        // Get current user's scorecard
        const userResponse = await fetch("/api/me/bootstrap", {
          method: "POST",
        });
        const userData = await userResponse.json();

        const userScorecard = round.scorecards.find(
          (s: any) => s.tripMember.userProfile.clerkUserId === userData.profile.clerkUserId
        );

        if (userScorecard) {
          setScorecard(userScorecard);

          // Initialize scores from existing hole scores
          const newScores = Array(18).fill(null);
          userScorecard.holeScores.forEach((hs: any) => {
            newScores[hs.holeNumber - 1] = hs.strokes;
          });
          setScores(newScores);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [roundId]);

  const handleScoreChange = (hole: number, value: string) => {
    const newScores = [...scores];
    const numValue = value === "" ? null : parseInt(value);
    newScores[hole] = numValue;
    setScores(newScores);
  };

  const handleSave = async () => {
    if (!scorecard) return;

    setSaving(true);
    try {
      const holesData = scores.map((strokes, index) => ({
        holeNumber: index + 1,
        strokes,
      }));

      await fetch(`/api/scorecards/${scorecard.id}/holes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: holesData }),
      });

      router.push(`/r/${roundId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to save scores");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!scorecard) return;

    if (!confirm("Are you sure you want to submit your scorecard? You can still edit it until the organizer locks it.")) {
      return;
    }

    setSaving(true);
    try {
      // Save scores first
      const holesData = scores.map((strokes, index) => ({
        holeNumber: index + 1,
        strokes,
      }));

      await fetch(`/api/scorecards/${scorecard.id}/holes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: holesData }),
      });

      // Submit scorecard
      await fetch(`/api/scorecards/${scorecard.id}/submit`, {
        method: "POST",
      });

      router.push(`/r/${roundId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to submit scorecard");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!scorecard) {
    return <div className="p-8">Scorecard not found</div>;
  }

  const isLocked = scorecard.status === "LOCKED";
  const total = scores.reduce((sum, s) => sum + (s || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link
          href={`/r/${roundId}`}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Round
        </Link>

        <div className="bg-white shadow rounded-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Enter Score</h1>
            <div className="text-right">
              <div className="text-sm text-gray-600">Status</div>
              <div className="font-semibold">{scorecard.status}</div>
            </div>
          </div>

          {isLocked && (
            <div className="bg-yellow-50 text-yellow-800 p-4 rounded mb-6">
              This scorecard is locked and cannot be edited.
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
            {scores.map((score, index) => (
              <div key={index} className="flex flex-col">
                <label className="text-sm font-medium mb-1 text-center">
                  Hole {index + 1}
                </label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={score === null ? "" : score}
                  onChange={(e) => handleScoreChange(index, e.target.value)}
                  disabled={isLocked}
                  className="w-full px-3 py-2 border rounded text-center focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
            ))}
          </div>

          <div className="border-t pt-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold">{total || 0}</span>
            </div>
            {scorecard.grossTotal && (
              <div className="flex justify-between items-center mt-2">
                <span>Gross Total</span>
                <span className="font-semibold">{scorecard.grossTotal}</span>
              </div>
            )}
            {scorecard.netTotal !== null && (
              <div className="flex justify-between items-center">
                <span>Net Total</span>
                <span className="font-semibold">{scorecard.netTotal}</span>
              </div>
            )}
          </div>

          {!isLocked && (
            <div className="flex space-x-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? "Submitting..." : "Save & Submit"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
