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
    platformFeesEarned: 0,
    isPremiumDonor: false,
    transactions: [],
  });

  // UI state
  const [loadingData, setLoadingData] = useState(true);
  const [selectedCharity, setSelectedCharity] = useState<Charity | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [simulatingSwipe, setSimulatingSwipe] = useState(false);
  const [swipeSuccessMsg, setSwipeSuccessMsg] = useState("");

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Private Wealth Calculator State
  const [estMonthlySwipes, setEstMonthlySwipes] = useState(40);

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
          platformFeesEarned: 0,
          isPremiumDonor: false,
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
  const handleConfirmRoundUp = async (increment: number, isPremium: boolean) => {
    if (!selectedCharity) return;

    const res = await fetch("/api/investec/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activeCharityId: selectedCharity.id,
        roundUpIncrement: increment,
        isPremiumDonor: isPremium,
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

  // Filter charities based on search query and selected tag
  const filteredCharities = charities.filter((charity) => {
    const matchesSearch = charity.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          charity.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag ? charity.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  // Calculate estimated impact and tax deduction for private banking client
  const roundUpIncrement = appConfig.roundUpIncrement || 5;
  const averageDonationPerSwipe = roundUpIncrement / 2;
  const estimatedMonthlyDonation = estMonthlySwipes * averageDonationPerSwipe;
  const estimatedPlatformFee = estimatedMonthlyDonation * 0.015;
  const estimatedAnnualDonation = estimatedMonthlyDonation * 12;
  const estimatedTaxRebate = estimatedAnnualDonation * 0.45; // South African HNW 45% marginal tax rate deduction

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
    <>
      {/* Refined Investec Navbar */}
      <nav className="navbar">
        <div className="navbar-logo">
          Investec <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--color-accent-gold)", marginLeft: "0.5rem", fontWeight: 500 }}>Wealth & Giving</span>
        </div>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <span className="overline" style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontWeight: 400 }}>
            {user.username}
          </span>
          <button
            type="button"
            className="btn-logout"
            onClick={handleLogout}
            style={{ 
              padding: "0.45rem 1rem", 
              fontSize: "0.72rem", 
              background: "transparent", 
              border: "1.5px solid var(--color-accent-gold)", 
              color: "var(--color-accent-gold)"
            }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="page-container" style={{ padding: "3rem 1.5rem", alignItems: "flex-start", minHeight: "calc(100vh - 72px)" }}>
        {/* Elastic Canvas Dot System */}
        <DotField />

        {/* Main Responsive Grid Dashboard */}
        <div
          className="dashboard-wrapper animate-fade-in"
          style={{
            width: "100%",
            maxWidth: "900px",
            margin: "0 auto",
            zIndex: 10,
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "2rem",
          }}
        >
          {/* Top Header Card */}
          <div className="dashboard-container" style={{ maxWidth: "100%", padding: "2rem", gap: "1.25rem" }}>
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
                <span className="overline">Client Portal</span>
                <h1 style={{ fontSize: "1.8rem", textAlign: "left", margin: 0 }}>
                  Giving is lekker
                </h1>
              </div>
              <div>
                <span
                  style={{
                    padding: "0.4rem 0.8rem",
                    background: appConfig.isPremiumDonor ? "rgba(201, 168, 76, 0.08)" : "var(--color-background-off)",
                    color: "var(--color-accent-gold)",
                    border: "1px solid var(--color-border-strong)",
                    fontSize: "0.72rem",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    borderRadius: "2px"
                  }}
                >
                  {appConfig.isPremiumDonor ? "✨ Premium (SARS Tax-Match)" : "Standard Tier"}
                </span>
              </div>
            </div>

            <hr style={{ border: "0", borderTop: "1px solid var(--color-border)" }} />

            {/* Account Metadata Row for Private Wealth demographic */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span className="overline" style={{ fontSize: "0.68rem" }}>Linked Transaction Account</span>
                <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>Investec Private Cash (•••• 1720)</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span className="overline" style={{ fontSize: "0.68rem" }}>SARS Section 18A Status</span>
                <span style={{ color: appConfig.isPremiumDonor ? "var(--color-accent-gold)" : "var(--color-text-secondary)", fontWeight: 600 }}>
                  {appConfig.isPremiumDonor ? "Auto-Collation Active (45% Marginal Rebate)" : "Inactive (Subscribe to Auto-Tax)"}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span className="overline" style={{ fontSize: "0.68rem" }}>Platform Convenience Fee</span>
                <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
                  R{appConfig.platformFeesEarned.toFixed(2)} generated (1.5% micro-fee)
                </span>
              </div>
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
                      <span style={{ fontSize: "0.88rem", fontWeight: 500, color: "var(--color-text-primary)" }}>
                        {activeCharity.name}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                        Rounding up to nearest <strong>R{appConfig.roundUpIncrement}</strong>
                      </span>
                    </div>
                    <span
                      style={{
                        padding: "0.3rem 0.6rem",
                        background: "rgba(201, 168, 76, 0.08)",
                        color: "var(--color-accent-gold)",
                        borderRadius: "2px",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        border: "1px solid var(--color-border-strong)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em"
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
                        style={{ fontSize: "0.75rem", color: "var(--color-accent-gold)", fontWeight: 500, textAlign: "center" }}
                      >
                        {swipeSuccessMsg}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ padding: "1rem", textAlign: "center", background: "var(--color-background-off)", borderRadius: "2px" }}>
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                    No active round-up rules linked yet. Select a charity below to activate!
                  </p>
                </div>
              )}

              <hr style={{ border: "0", borderTop: "1px solid var(--color-border)" }} />

              <div className="stat-block">
                <span className="stat-number">R{appConfig.totalDonated.toFixed(2)}</span>
                <span className="stat-label">Accumulated Donations</span>
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
           {/* HNW Micro-Giving Impact & Tax Estimator */}
        <div className="dashboard-container" style={{ maxWidth: "100%", padding: "2rem", gap: "1rem", marginTop: "0.5rem" }}>
          <div>
            <span className="overline">Tax Efficiency</span>
            <h2 style={{ fontSize: "1.3rem", margin: 0 }}>
              Private Wealth Impact & Tax Estimator
            </h2>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", margin: "0" }}>
            HNW individuals in South Africa can deduct donations of up to 10% of their taxable income under Section 18A. Slide the controls below to estimate your tax-deductible micro-giving profile.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem", marginTop: "0.5rem" }} className="desktop-stats-grid">
            {/* Slider controls */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", justifyContent: "center" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>Estimated Card Swipes / Month</span>
                <span style={{ color: "var(--color-accent-gold)", fontWeight: 600, fontFamily: "var(--font-heading)", fontSize: "1.1rem" }}>{estMonthlySwipes} swipes</span>
              </div>
              <input
                type="range"
                min="10"
                max="120"
                step="5"
                value={estMonthlySwipes}
                onChange={(e) => setEstMonthlySwipes(Number(e.target.value))}
                style={{
                  width: "100%",
                  accentColor: "var(--color-accent-gold)",
                  cursor: "pointer",
                }}
              />
              <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                Based on average South African private banking card swipe frequency.
              </span>
            </div>

            {/* Calculations display */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "var(--color-background-off)", border: "1px solid var(--color-border)", padding: "1.25rem 1.5rem", borderRadius: "2px" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "0.68rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 500, letterSpacing: "0.04em" }}>Est. Monthly Donation</span>
                <span style={{ fontSize: "1.4rem", fontWeight: 400, color: "var(--color-text-primary)", fontFamily: "var(--font-heading)", marginTop: "0.15rem" }}>R{estimatedMonthlyDonation.toFixed(2)}</span>
                <span style={{ fontSize: "0.68rem", color: "var(--color-text-secondary)", marginTop: "0.15rem" }}>Avg R{averageDonationPerSwipe.toFixed(2)} round-up</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "0.68rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 500, letterSpacing: "0.04em" }}>Est. Annual SARS Credit</span>
                <span style={{ fontSize: "1.4rem", fontWeight: 400, color: "var(--color-accent-gold)", fontFamily: "var(--font-heading)", marginTop: "0.15rem" }}>R{estimatedTaxRebate.toFixed(2)}</span>
                <span style={{ fontSize: "0.68rem", color: "var(--color-text-secondary)", marginTop: "0.15rem" }}>At 45% marginal tax rate</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gridColumn: "span 2", borderTop: "1px solid var(--color-border)", paddingTop: "0.75rem", marginTop: "0.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Simulated Platform Fee Revenue (1.5%)</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--color-text-primary)" }}>R{estimatedPlatformFee.toFixed(2)}/mo</span>
                </div>
              </div>
            </div>
          </div>
        </div>       </div>

        {/* Charity Feed Title */}
        <div style={{ marginTop: "2rem", width: "100%" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 500, color: "var(--color-primary)", letterSpacing: "-0.01em", fontFamily: "var(--font-heading)" }}>
            Select a Charity to Support
          </h2>
          <p style={{ fontSize: "0.88rem", color: "var(--color-text-secondary)", marginBottom: "1.25rem", fontWeight: 300 }}>
            Setup a programmable banking transaction round-up rule for your chosen cause.
          </p>

          {/* Search bar and tag filters */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input
              type="text"
              placeholder="Search by charity name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.8rem 1rem",
                background: "var(--color-background)",
                border: "1px solid var(--color-border)",
                borderRadius: "2px",
                color: "var(--color-text-primary)",
                fontSize: "0.88rem",
                outline: "none",
                transition: "all 0.15s ease-in-out",
              }}
            />

            {/* Tag Filter Row */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", paddingBottom: "0.25rem" }}>
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                style={{
                  padding: "0.45rem 1rem",
                  borderRadius: "2px",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  background: selectedTag === null ? "var(--color-primary)" : "var(--color-background)",
                  color: selectedTag === null ? "#ffffff" : "var(--color-text-primary)",
                  border: "1px solid " + (selectedTag === null ? "var(--color-primary)" : "var(--color-border)"),
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  transition: "all 0.15s ease-in-out",
                }}
              >
                All causes
              </button>
              {["kids", "disability", "environment", "animals"].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  style={{
                    padding: "0.45rem 1rem",
                    borderRadius: "2px",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    background: selectedTag === tag ? "var(--color-primary)" : "var(--color-background)",
                    color: selectedTag === tag ? "#ffffff" : "var(--color-text-primary)",
                    border: "1px solid " + (selectedTag === tag ? "var(--color-primary)" : "var(--color-border)"),
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    transition: "all 0.15s ease-in-out",
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Charities Grid layout */}
        <div className="charity-grid">
          {filteredCharities.length > 0 ? (
            filteredCharities.map((charity) => (
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
                        background: "var(--color-primary)",
                        color: "var(--color-accent-gold)",
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        padding: "0.35rem 0.7rem",
                        borderRadius: "2px",
                        border: "1px solid var(--color-border-strong)",
                        letterSpacing: "0.05em",
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
                          tag === "kids" ? "kids" : tag === "disability" ? "disability" : tag === "environment" ? "environment" : tag === "animals" ? "animals" : "default-tag"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: "span 2", textAlign: "center", padding: "3rem", background: "var(--color-background)", borderRadius: "2px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-subtle)" }}>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", fontWeight: 300, marginBottom: "1rem" }}>No charities found matching your search filters.</p>
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setSelectedTag(null); }}
                style={{
                  padding: "0.6rem 1.2rem",
                  background: "var(--color-primary)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "2px",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
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
    </>
  );
}
