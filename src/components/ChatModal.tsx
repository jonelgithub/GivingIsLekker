"use client";

import React, { useState, useEffect, useRef } from "react";
import { Charity } from "@/app/api/charities/route";

interface ChatModalProps {
  charity: Charity | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (increment: number, isPremium: boolean) => Promise<void>;
  currentIncrement: number;
}

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  isTyping?: boolean;
}

export default function ChatModal({
  charity,
  isOpen,
  onClose,
  onConfirm,
  currentIncrement,
}: ChatModalProps) {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedIncrement, setSelectedIncrement] = useState<number>(currentIncrement || 5);
  const [showOptions, setShowOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom of chat automatically
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, showOptions]);

  // Initialize modal state when opened
  useEffect(() => {
    if (!isOpen || !charity) return;

    // Reset to initial intro screen state
    setStep(0);
    setCustomAmount("");
    setValidationError("");
    setIsSubmitting(false);
    setShowOptions(false);
    setMessages([]);
  }, [isOpen, charity]);

  const startChatFlow = () => {
    if (!charity) return;
    setStep(1);
    setMessages([
      {
        id: "msg_1",
        sender: "bot",
        text: `Hi! Thank you for choosing to support "${charity.name}".`,
      },
    ]);

    // Show second message after 800ms
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: "msg_2",
          sender: "bot",
          text: "To activate this, what increment would you like to round your card transactions to? E.g., if you choose R5, a purchase of R42.50 rounds to R45.00, donating R2.50.",
        },
      ]);
      setShowOptions(true);
    }, 800);
  };

  if (!isOpen || !charity) return null;

  const addBotMessageWithDelay = (text: string, delay: number = 800) => {
    // Show typing dots first
    const typingId = "typing_" + Math.random().toString(36).substring(4);
    setMessages((prev) => [...prev, { id: typingId, sender: "bot", text: "", isTyping: true }]);

    setTimeout(() => {
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== typingId)
          .concat({
            id: "msg_" + Math.random().toString(36).substring(4),
            sender: "bot",
            text,
          })
      );
    }, delay);
  };

  const handleSelectIncrement = (value: number) => {
    setSelectedIncrement(value);
    setShowOptions(false);

    // Add user response to chat
    setMessages((prev) => [
      ...prev,
      {
        id: "user_" + Math.random().toString(36).substring(4),
        sender: "user",
        text: `Round up to the nearest R${value}`,
      },
    ]);

    setStep(2);

    // Trigger next bot confirmation after delay
    addBotMessageWithDelay(
      `Perfect! R${value} set. This rule will automatically apply to all transaction round-ups. Each time you tap your Investec card, the rounded difference goes straight to ${charity.name}.`,
      1000
    );
    setTimeout(() => {
      addBotMessageWithDelay(
        "As a private banking client, would you like to activate our Lekker Donor Premium Tier (R19/mo)? This automatically collates all Section 18A tax deduction certificates for your tax returns and matches your carbon offset.",
        500
      );
    }, 1000);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    const value = parseInt(customAmount, 10);
    if (isNaN(value) || value < 1) {
      setValidationError("Please enter a valid amount (minimum R1).");
      return;
    }

    handleSelectIncrement(value);
  };

  const handleConfirmActivation = async (isPremium: boolean) => {
    setIsSubmitting(true);
    setValidationError("");
    
    // Simulating API save delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    try {
      await onConfirm(selectedIncrement, isPremium);
      setStep(3);
      
      // User confirm text in bubble
      setMessages((prev) => [
        ...prev,
        {
          id: "confirm_click",
          sender: "user",
          text: isPremium ? "Yes, Activate with Premium (R19/mo)" : "Yes, Activate Standard Only",
        },
      ]);

      if (isPremium) {
        addBotMessageWithDelay(
          `Magnificent choice! Your Investec programmable banking round-up rules are active at R${selectedIncrement} with Premium benefits enabled (Section 18A Tax Certificates & Carbon Offsets matching). Let's make a grand impact!`,
          800
        );
      } else {
        addBotMessageWithDelay(
          `Fantastic! Your Investec programmable banking round-up rules are active at R${selectedIncrement} (Standard tier). Let's make an impact together!`,
          800
        );
      }
    } catch (err) {
      console.error(err);
      setValidationError("Failed to update config. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="chat-modal-overlay">
      <div className="chat-modal-card">
        {/* Modal Header */}
        <div className="chat-modal-header">
          <div className="charity-meta">
            <span className="charity-badge">Active Connection</span>
            <h4>{charity.name}</h4>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Chat Message Window or Pre-Modal Intro */}
        {step === 0 ? (
          <div className="chat-messages-container" style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1.5rem", justifyContent: "center", alignItems: "center", textAlign: "center", overflowY: "hidden" }}>
            {/* Premium Marketing Image — fixed height to prevent clipping in flex container */}
            <div style={{ width: "100%", height: "170px", borderRadius: "4px", overflow: "hidden", border: "1px solid #E5E5E5", boxShadow: "0 6px 20px rgba(0,0,0,0.05)", flexShrink: 0 }}>
              <img
                src="/images/zebra_marketing.png"
                alt="Zebra Wealth Philanthropy"
                style={{ width: "100%", height: "100%", display: "block", objectFit: "cover", objectPosition: "center" }}
              />
            </div>
            
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.35rem", fontStyle: "italic", lineHeight: 1.5, color: "#000000", margin: "0.5rem 0 0" }}>
              &ldquo;Thank you for wanting to take the first step&hellip; It starts somewhere&rdquo;
            </p>
          </div>
        ) : (
          <div className="chat-messages-container">
            {/* Marketing Image — constrained so it doesn't overflow the chat area */}
            <div style={{ width: "100%", height: "120px", borderRadius: "4px", overflow: "hidden", border: "1px solid #E0E0E0", marginBottom: "0.75rem", flexShrink: 0 }}>
              <img
                src="/images/zebra_marketing.png"
                alt="Zebra Wealth Philanthropy"
                style={{ width: "100%", height: "100%", display: "block", objectFit: "cover", objectPosition: "center" }}
              />
            </div>
            {messages.map((msg) => (
              <div key={msg.id} className={`message-row ${msg.sender}`}>
                <div className="message-bubble">
                  {msg.isTyping ? (
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* Interactive Input options based on current step */}
        <div className="chat-input-panel">
          {step === 0 && (
            <div className="confirmation-panel">
              <div className="confirm-buttons-grid" style={{ gap: "0.75rem" }}>
                <button
                  type="button"
                  className="confirm-btn yes"
                  onClick={startChatFlow}
                  style={{
                    background: "repeating-linear-gradient(-45deg, #000000, #000000 8px, #ffffff 8px, #ffffff 16px)",
                    border: "2px solid #000000",
                    color: "#FFFFFF",
                    position: "relative",
                    overflow: "hidden"
                  }}
                >
                  <span style={{ background: "#000000", color: "#ffffff", padding: "0.4rem 1.2rem", borderRadius: "2px" }}>
                    Continue
                  </span>
                </button>
                <button
                  type="button"
                  className="confirm-btn no"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {step === 1 && showOptions && (
            <div className="options-panel">
              <div className="quick-buttons">
                <button
                  type="button"
                  className="option-btn"
                  onClick={() => handleSelectIncrement(5)}
                >
                  R5 Increment
                </button>
                <button
                  type="button"
                  className="option-btn"
                  onClick={() => handleSelectIncrement(10)}
                >
                  R10 Increment
                </button>
                <button
                  type="button"
                  className="option-btn"
                  onClick={() => handleSelectIncrement(20)}
                >
                  R20 Increment
                </button>
              </div>

              {/* Custom Input */}
              <form onSubmit={handleCustomSubmit} className="custom-input-form">
                <input
                  type="number"
                  placeholder="Enter custom (e.g. 15)"
                  min="1"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="custom-number-input"
                />
                <button type="submit" className="custom-submit-btn">
                  Set
                </button>
              </form>
              {validationError && <p className="validation-error">{validationError}</p>}
            </div>
          )}

          {step === 2 && (
            <div className="confirmation-panel">
              {validationError && <p className="validation-error">{validationError}</p>}
              <div className="confirm-buttons-grid">
                <button
                  type="button"
                  className="confirm-btn yes"
                  onClick={() => handleConfirmActivation(true)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="loading-spinner"></span>
                  ) : (
                    "Activate Premium (R19/mo)"
                  )}
                </button>
                <button
                  type="button"
                  className="confirm-btn yes-standard"
                  onClick={() => handleConfirmActivation(false)}
                  disabled={isSubmitting}
                >
                  Activate Standard Only (Free)
                </button>
                <button
                  type="button"
                  className="confirm-btn no"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="completion-panel">
              <button type="button" className="completion-close-btn" onClick={onClose}>
                Done & View Dashboard
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .chat-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(11, 31, 58, 0.45);
          backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 999;
          padding: 1rem;
        }

        .chat-modal-card {
          width: 100%;
          max-width: 440px;
          height: 520px;
          background: #FFFFFF;
          border: 1px solid #E0E0E0;
          border-radius: 8px; /* Sharp corners for modern HNW aesthetic */
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          animation: modalScale 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;

          /* Zebra stripes top line decoration */
          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            z-index: 10;
            background: repeating-linear-gradient(
              90deg,
              #000000,
              #000000 6px,
              #ffffff 6px,
              #ffffff 12px
            );
          }
        }

        .chat-modal-header {
          padding: 1.35rem 1.5rem 1.25rem 1.5rem;
          border-bottom: 1px solid #E0E0E0;
          background: #000000;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #FFFFFF;

          .charity-meta {
            display: flex;
            flex-direction: column;
            gap: 0.2rem;
            
            .charity-badge {
              font-size: 0.65rem;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: #999999;
            }
            
            h4 {
              font-family: 'Cormorant Garamond', serif;
              font-size: 1.2rem;
              font-weight: 500;
              color: #FFFFFF;
            }
          }

          .close-btn {
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.6);
            font-size: 1.8rem;
            cursor: pointer;
            transition: color 0.15s ease-in-out;
            
            &:hover {
              color: #FFFFFF;
            }
          }
        }

        .chat-messages-container {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: #FAFAFA;
        }

        .message-row {
          display: flex;
          width: 100%;
          
          &.bot {
            justify-content: flex-start;
            
            .message-bubble {
              background: #FFFFFF;
              color: #000000;
              border: 1px solid #E0E0E0;
              border-bottom-left-radius: 4px;
            }
          }
          
          &.user {
            justify-content: flex-end;
            
            .message-bubble {
              background: #000000;
              color: #FFFFFF;
              border: 1px solid #000000;
              border-bottom-right-radius: 4px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            }
          }
        }

        .message-bubble {
          max-width: 85%;
          padding: 0.85rem 1.1rem;
          font-size: 0.88rem;
          line-height: 1.5;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
        }

        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          height: 15px;

          span {
            display: inline-block;
            width: 6px;
            height: 6px;
            background: #000000;
            border-radius: 50%;
            animation: bounce 1.2s infinite ease-in-out;
            
            &:nth-child(2) { animation-delay: 0.2s; }
            &:nth-child(3) { animation-delay: 0.4s; }
          }
        }

        .chat-input-panel {
          padding: 1.25rem 1.5rem;
          border-top: 1px solid #E0E0E0;
          background: #FFFFFF;
        }

        .options-panel {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;

          .quick-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 0.5rem;
          }

          .option-btn {
            background: #FAFAFA;
            border: 1px solid #E0E0E0;
            border-radius: 4px;
            padding: 0.65rem;
            color: #000000;
            font-size: 0.8rem;
            font-weight: 600;
            font-family: 'DM Sans', sans-serif;
            cursor: pointer;
            transition: all 0.15s ease-in-out;
            
            &:hover {
              background: #000000;
              border-color: #000000;
              color: #FFFFFF;
            }
          }

          .custom-input-form {
            display: flex;
            gap: 0.5rem;
            
            .custom-number-input {
              flex: 1;
              background: #FFFFFF;
              border: 1px solid #E0E0E0;
              border-radius: 4px;
              padding: 0.6rem 0.8rem;
              color: #000000;
              font-size: 0.8rem;
              font-family: 'DM Sans', sans-serif;
              
              &:focus {
                outline: none;
                border-color: #000000;
              }
            }
            
            .custom-submit-btn {
              background: #000000;
              color: #FFFFFF;
              border: none;
              border-radius: 4px;
              padding: 0 1.2rem;
              font-size: 0.8rem;
              font-weight: 600;
              font-family: 'DM Sans', sans-serif;
              cursor: pointer;
              transition: background 0.15s;
              
              &:hover {
                background: #222222;
              }
            }
          }
        }

        .confirmation-panel {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;

          .confirm-buttons-grid {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .confirm-btn {
            border-radius: 4px;
            padding: 0.8rem;
            font-size: 0.85rem;
            font-weight: 600;
            font-family: 'DM Sans', sans-serif;
            letter-spacing: 0.04em;
            cursor: pointer;
            transition: all 0.15s ease-in-out;
            display: flex;
            justify-content: center;
            align-items: center;
            border: none;
            
            &.yes {
              background: #000000;
              color: #FFFFFF;
              border: 1.5px solid #000000;
              
              &:hover {
                background: #222222;
                border-color: #222222;
              }
            }

            &.yes-standard {
              background: #FFFFFF;
              color: #000000;
              border: 1.5px solid #000000;
              
              &:hover {
                background: #FAFAFA;
                color: #000000;
              }
            }
            
            &.no {
              background: transparent;
              border: 1.5px solid #E0E0E0;
              color: #555555;
              
              &:hover {
                background: #FAFAFA;
                border-color: #000000;
                color: #000000;
              }
            }
          }
        }

        .completion-panel {
          .completion-close-btn {
            width: 100%;
            background: #000000;
            border: 1.5px solid #000000;
            border-radius: 4px;
            padding: 0.8rem;
            color: #FFFFFF;
            font-size: 0.88rem;
            font-weight: 600;
            font-family: 'DM Sans', sans-serif;
            letter-spacing: 0.05em;
            cursor: pointer;
            transition: all 0.15s ease-in-out;
            
            &:hover {
              background: #222222;
              border-color: #222222;
            }
          }
        }

        .validation-error {
          color: #e51d28;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }

        @keyframes modalScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
