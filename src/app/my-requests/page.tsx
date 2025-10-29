"use client";

import { useEffect, useState } from "react";
import BackgroundImage from "@/components/BackgroundImage";
import MatchCard from "@/components/MatchCard";
import ConfirmModal from "@/components/ConfirmModal";

interface MatchItem {
  id: string;
  clubName: string;
  ageLabel: string | null;
  year: number | null;
  date: string | null;
  kickoffTime: string | null;
  kickoffFlexible: boolean;
  homeAway: "HOME" | "AWAY" | "FLEX";
  notes: string | null;
  playTime: string | null;
  strengthLabel: string | null;
  address: string | null;
  logoUrl: string | null;
}

export default function MyRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestedOffers, setRequestedOffers] = useState<MatchItem[]>([]);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [offerIdToWithdraw, setOfferIdToWithdraw] = useState<string | null>(
    null,
  );

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchRequestedOffers(), fetchSavedIds()]);
    } catch (e: any) {
      setError(e?.message ?? "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }

  async function fetchRequestedOffers() {
    const req = await fetch("/api/requests");
    if (!req.ok)
      throw new Error("Angefragte Angebote konnten nicht geladen werden");
    const reqData = await req.json();
    const ids = reqData.requestedIds || [];
    setRequestedIds(new Set(ids));

    if (ids.length === 0) {
      setRequestedOffers([]);
      return;
    }

    const offers = await fetch(`/api/offer?ids=${ids.join(",")}`);
    if (!offers.ok)
      throw new Error("Angebotsdaten konnten nicht geladen werden");
    const offersData = await offers.json();
    setRequestedOffers(offersData.items || []);
  }

  async function fetchSavedIds() {
    const saved = await fetch("/api/saved-offers");
    if (!saved.ok) return;
    const savedData = await saved.json();
    setSavedIds(new Set(savedData.savedIds || []));
  }

  async function handleToggleSaved(offerId: string) {
    const isSaved = savedIds.has(offerId);
    try {
      const res = await fetch("/api/saved-offers", {
        method: isSaved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });

      if (res.ok) {
        setSavedIds((prev) => {
          const newSet = new Set(prev);
          if (isSaved) {
            newSet.delete(offerId);
          } else {
            newSet.add(offerId);
          }
          return newSet;
        });
      }
    } catch (e: any) {
      console.error("Toggle saved failed:", e);
    }
  }

  async function handleWithdrawRequest() {
    if (!offerIdToWithdraw) return;

    try {
      const res = await fetch("/api/requests/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId: offerIdToWithdraw }),
      });

      if (res.ok) {
        setRequestedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(offerIdToWithdraw);
          return newSet;
        });
        setRequestedOffers((prev) =>
          prev.filter((o) => o.id !== offerIdToWithdraw),
        );
        setOfferIdToWithdraw(null);
      }
    } catch (e: any) {
      console.error("Withdraw request failed:", e);
    }
  }

  return (
    <main className="relative min-h-screen pt-16">
      <BackgroundImage />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
          <span>📤</span>
          <span>Meine Anfragen</span>
        </h1>

        {/* Content */}
        {loading ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="text-white/80">Lade...</div>
          </div>
        ) : error ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="text-red-300">{error}</div>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-white/20 rounded-xl text-white hover:bg-white/30"
            >
              Erneut versuchen
            </button>
          </div>
        ) : requestedOffers.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4 text-blue-500">📤</div>
            <div className="text-white/90 font-medium mb-2">
              Noch keine Anfragen verschickt
            </div>
            <div className="text-white/60 text-sm">
              Sende deine erste Anfrage auf der "Suchen"-Seite oder über deine
              "Merkliste"
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {requestedOffers.map((offer) => (
              <div key={offer.id} className="glass-card overflow-hidden">
                <MatchCard
                  {...offer}
                  ageLabel={offer.ageLabel || "—"}
                  isSaved={savedIds.has(offer.id)}
                  onSaveClick={() => handleToggleSaved(offer.id)}
                  onWithdrawClick={() => {
                    setOfferIdToWithdraw(offer.id);
                    setWithdrawModalOpen(true);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdraw Confirmation Modal */}
      <ConfirmModal
        open={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        onConfirm={handleWithdrawRequest}
        title="Anfrage zurückziehen?"
        message="Möchtest du die Anfrage wirklich zurückziehen? Der Anbieter wird darüber per E-Mail, Nachricht und Benachrichtigung informiert."
        confirmText="Ja"
        cancelText="Nein"
      />
    </main>
  );
}
