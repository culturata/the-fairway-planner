"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function PaymentsPage() {
  const params = useParams();
  const tripId = params.tripId as string;

  const [loading, setLoading] = useState(true);
  const [costItems, setCostItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetch(`/api/trips/${tripId}/cost-items`)
      .then((res) => res.json())
      .then((data) => {
        setCostItems(data.costItems || []);
        setLoading(false);
      });
  }, [tripId]);

  const handleCheckout = async () => {
    if (selectedItems.size === 0) {
      alert("Please select at least one item to pay");
      return;
    }

    setProcessingPayment(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          costItemIds: Array.from(selectedItems),
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to start checkout");
      setProcessingPayment(false);
    }
  };

  const toggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  const totalAmount = costItems
    .filter((item) => selectedItems.has(item.id))
    .reduce((sum, item) => sum + item.amountCents, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link
          href={`/t/${tripId}`}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Trip
        </Link>

        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-2xl font-bold mb-6">Trip Payments</h1>

          {costItems.length === 0 ? (
            <p className="text-gray-500">No payment items available</p>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {costItems.map((item) => {
                  const userPayment = item.payments.find((p: any) => p.status === "PAID");
                  const isPaid = !!userPayment;

                  return (
                    <div
                      key={item.id}
                      className={`border rounded-lg p-4 ${
                        isPaid ? "bg-green-50 border-green-300" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {!isPaid && (
                            <input
                              type="checkbox"
                              checked={selectedItems.has(item.id)}
                              onChange={() => toggleItem(item.id)}
                              className="mt-1"
                            />
                          )}
                          <div>
                            <h3 className="font-semibold">
                              {item.name}
                              {item.required && (
                                <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                  Required
                                </span>
                              )}
                            </h3>
                            <p className="text-2xl font-bold mt-1">
                              ${(item.amountCents / 100).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        {isPaid && (
                          <span className="bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold">
                            PAID
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedItems.size > 0 && (
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold">
                      ${(totalAmount / 100).toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={processingPayment}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
                  >
                    {processingPayment
                      ? "Processing..."
                      : `Pay $${(totalAmount / 100).toFixed(2)}`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
