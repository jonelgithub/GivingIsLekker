"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import DotField from "@/components/DotField";
import ChatModal from "@/components/ChatModal";
import { Charity } from "../api/charities/route";
import { AppConfig } from "@/utils/configStore";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();

  // Active configurations
  const [charities, setCharities] = useState<Charity[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig>({
    activeCharityId: null,
    roundUpIncrement: 5,
    totalDonated: 0,
    transactions: [],
  });

  // UI state
  const [loadingData, setLoadingData] = useState(true);
  const [selectedCharity, setSelectedCharity] = useState<Charity | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [simulatingSwipe, setSimulatingSwipe] = useState(false);
  const [swipeSuccessMsg, setSwipeSuccessMsg] = useState("");

  // Guard routing redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  // Load backend data (Charities list & active rules config)
  const fetchData = async () => {
    try {
      const [charitiesRes, configRes] = await Promise.all([
        fetch("/api/charities"),
        fetch("/api/investec/config"),
      ]);

      if (charitiesRes.ok && configRes.ok) {
        const charitiesData = await charitiesRes.json();
        const configData = await configRes.json();
        setCharities(charitiesData.data || []);
        setAppConfig(configData.data || {
          activeCharityId: null,
          roundUpIncrement: 5,
          totalDonated: 0,
          transactions: [],
        });
      }
    } catch (err) {
      console.error("Failed to load dashboard statistics:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Open chat modal for specific charity selection
  const handleCharitySelect = (charity: Charity) => {
    setSelectedCharity(charity);
    setIsChatOpen(true);
  };

  // Save new configuration from ChatModal setup
  const handleConfirmRoundUp = async (increment: number) => {
    if (!selectedCharity) return;

    const res = await fetch("/api/investec/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activeCharityId: selectedCharity.id,
        roundUpIncrement: increment,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to save configuration rules.");
    }

    const updated = await res.json();
    setAppConfig(updated.data);
  };

  // Simulates a swipe transaction on Investec card using Webhook trigger endpoint
  const handleSimulateSwipe = async () => {
    if (simulatingSwipe) return;
    setSimulatingSwipe(true);
    setSwipeSuccessMsg("");

    // Generate random mock transaction data
    const merchants = [
      "Woolworths Cape Town",
      "Uber SA",
      "Checkers Hyper",
      "Vida e Caffe",
      "Shell Select",
      "Takealot Online",
    ];
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    const amount = Number((Math.random() * 85 + 5).toFixed(2)); // R5.00 to R90.00

    try {
      console.log(`[Simulating Swipe] tap: R${amount} at ${merchant}`);
      const res = await fetch("/api/investec/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          merchant,
          accountId: "892019481720", // Mock transaction account ID
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSwipeSuccessMsg(data.message || "Processed card transaction.");
        
        // Refresh local dashboard states
        await fetchData();
      } else {
        const errData = await res.json();
        console.error("Webhook processing error:", errData.error);
      }
    } catch (err) {
      console.error("Failed to trigger mock card swipe webhook:", err);
    } finally {
      setSimulatingSwipe(false);
      // Auto-clear message after 4s
      setTimeout(() => setSwipeSuccessMsg(""), 4000);
    }
  };

  // Active charity lookup helper
  const activeCharity = charities.find((c) => c.id === appConfig.activeCharityId);

  // Render loader while validating auth state
  if (authLoading || !user || loadingData) {
    return (
      <div className="page-container">
        <div className="submit-btn" style={{ padding: "1.5rem 2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <span className="loading-spinner"></span>
          <span style={{ fontSize: "0.95rem", fontWeight: 600, fontFamily: "sans-serif" }}>
            Connecting Programmable Banking...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: "2rem 1rem", alignItems: "flex-start" }}>
      {/* Elastic Canvas Dot System */}
      <DotField />

      {/* Main Responsive Grid Dashboard */}
      <div
        className="dashboard-wrapper animate-fade-in"
        style={{
          width: "100%",
          maxWidth: "800px",
          margin: "0 auto",
          zIndex: 10,
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "1.5rem",
        }}
      >
        {/* Top Header Card */}
        <div className="dashboard-container" style={{ maxWidth: "100%", padding: "2rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <h1 className="welcome-title" style={{ fontSize: "1.5rem", textAlign: "left", marginBottom: "0.2rem" }}>
                Giving is lekker
              </h1>
              <p className="subtitle" style={{ fontSize: "0.85rem", textAlign: "left" }}>
                Active Session: {user.username}
              </p>
            </div>
            <button
              type="button"
              className="btn-logout"
              onClick={handleLogout}
              style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Mid Stats Row (Double columns on desktop, single on mobile) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "1.5rem",
          }}
          className="desktop-stats-grid"
        >
          {/* Active Round-up Rule & Total Saved */}
          <div className="dashboard-container" style={{ maxWidth: "100%", padding: "1.5rem 2rem", gap: "1.25rem" }}>
            <h4 style={{ fontSize: "0.8rem", color: "#646873", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Active Configuration
            </h4>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {activeCharity ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#ffffff" }}>
                        {activeCharity.name}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#a0a5b0" }}>
                        Rounding up to nearest <strong>R{appConfig.roundUpIncrement}</strong>
                      </span>
                    </div>
                    <span
                      style={{
                        padding: "0.3rem 0.6rem",
                        background: "rgba(16, 185, 129, 0.1)",
                        color: "#10b981",
                        borderRadius: "8px",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        border: "1px solid rgba(16, 185, 129, 0.15)",
                      }}
                    >
                      Active
                    </span>
                  </div>

                  {/* Simulator tap mechanism */}
                  <div className="swipe-simulator-box">
                    <span className="simulator-title">Investec Card Swipe Simulator</span>
                    <button
                      type="button"
                      className="swipe-btn"
                      onClick={handleSimulateSwipe}
                      disabled={simulatingSwipe}
                    >
                      {simulatingSwipe ? <span className="loading-spinner"></span> : "💳 Tap Card (Trigger Webhook)"}
                    </button>
                    {swipeSuccessMsg && (
                      <p
                        className="pulsing"
                        style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 600, textAlign: "center" }}
                      >
                        {swipeSuccessMsg}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ padding: "1rem", textAlign: "center", background: "rgba(255, 255, 255, 0.02)", borderRadius: "12px" }}>
                  <p style={{ fontSize: "0.85rem", color: "#a0a5b0" }}>
                    No active round-up rules linked yet. Select a charity below to activate!
                  </p>
                </div>
              )}

              <hr style={{ border: "0", borderTop: "1px solid rgba(255,255,255,0.05)" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#a0a5b0" }}>Accumulated Donations</span>
                <span style={{ fontSize: "1.6rem", fontWeight: 900, color: "#10b981" }}>
                  R{appConfig.totalDonated.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Scrolling swipe logs */}
          <div className="dashboard-container" style={{ maxWidth: "100%", padding: "1.5rem 2rem", gap: "1rem" }}>
            <h4 style={{ fontSize: "0.8rem", color: "#646873", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Live Swipe Ledger
            </h4>
            
            <div className="ledger-container">
              {appConfig.transactions.length > 0 ? (
                appConfig.transactions.map((tx) => (
                  <div key={tx.id} className="ledger-item">
                    <div className="tx-desc">
                      <span className="merchant-name">{tx.description}</span>
                      <span className="tx-date">
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - to {tx.charityName.split(" ")[0]}
                      </span>
                    </div>
                    <div className="tx-values">
                      <span className="donation-amount">+R{tx.donation.toFixed(2)}</span>
                      <span className="original-amount">Swipe: R{tx.amount.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ height: "120px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <p style={{ fontSize: "0.8rem", color: "#646873" }}>
                    Waiting for programmable banking webhook swipes...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charity Feed Title */}
        <div style={{ marginTop: "0.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
            Select a Charity to Support
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#a0a5b0" }}>
            Setup a programmable banking transaction round-up rule for your chosen cause.
          </p>
        </div>

        {/* Charities Grid layout */}
        <div className="charity-grid">
          {charities.map((charity) => (
            <div
              key={charity.id}
              className="charity-card"
              onClick={() => handleCharitySelect(charity)}
            >
              {/* High-quality cover photo */}
              <div
                className="card-image"
                style={{ backgroundImage: `url(${charity.image})` }}
              >
                {appConfig.activeCharityId === charity.id && (
                  <div
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      background: "#007a4a",
                      color: "#ffffff",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      padding: "0.3rem 0.6rem",
                      borderRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    Active Selection
                  </div>
                )}
              </div>

              {/* White bottom info card element */}
              <div className="charity-card-info">
                <h3>{charity.name}</h3>
                
                {/* Categorization tag rows */}
                <div className="tags-row">
                  {charity.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`charity-tag ${
                        tag === "kids" ? "kids" : tag === "disability" ? "disability" : tag === "environment" ? "environment" : "default-tag"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic chat modal */}
      <ChatModal
        charity={selectedCharity}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onConfirm={handleConfirmRoundUp}
        currentIncrement={appConfig.roundUpIncrement}
      />

      <style jsx global>{`
        @media (min-width: 768px) {
          .desktop-stats-grid {
            grid-template-columns: 1.2fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
