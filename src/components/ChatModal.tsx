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
  const [step, setStep] = useState<1 | 2 | 3>(1);
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

  // Initialize chat when opened
  useEffect(() => {
    if (!isOpen || !charity) return;

    // Reset state
    setStep(1);
    setCustomAmount("");
    setValidationError("");
    setIsSubmitting(false);
    setShowOptions(false);

    // Initial bot message sequence
    setMessages([
      {
        id: "msg_1",
        sender: "bot",
        text: `Hi! Thank you for choosing to support "${charity.name}".`,
      },
    ]);

    // Show second message after 800ms
    const timer1 = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: "msg_2",
          sender: "bot",
          text: "To activate this, what increment would you like to round your card transactions to? E.g., if you choose R5, a purchase of R42.50 rounds to R45.00, donating R2.50.",
        },
      ]);
      setShowOptions(true);
    }, 1000);

    return () => {
      clearTimeout(timer1);
    };
  }, [isOpen, charity]);

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

        {/* Chat Message Window */}
        <div className="chat-messages-container">
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

        {/* Interactive Input options based on current step */}
        <div className="chat-input-panel">
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
          border: 1px solid #E0DDD6;
          border-top: 3px solid #C9A84C;
          border-radius: 16px;
          box-shadow: 0 20px 50px rgba(11, 31, 58, 0.12);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: modalScale 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .chat-modal-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #E0DDD6;
          background: #0B1F3A;
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
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: #C9A84C;
            }
            
            h4 {
              font-family: 'DM Sans', sans-serif;
              font-size: 1.05rem;
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
              color: #C9A84C;
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
          background: #F5F4F0;
        }

        .message-row {
          display: flex;
          width: 100%;
          
          &.bot {
            justify-content: flex-start;
            
            .message-bubble {
              background: #FFFFFF;
              color: #0B1F3A;
              border: 1px solid #E0DDD6;
              border-bottom-left-radius: 4px;
            }
          }
          
          &.user {
            justify-content: flex-end;
            
            .message-bubble {
              background: #0B1F3A;
              color: #FFFFFF;
              border: 1px solid #0B1F3A;
              border-bottom-right-radius: 4px;
              box-shadow: 0 4px 12px rgba(11, 31, 58, 0.08);
            }
          }
        }

        .message-bubble {
          max-width: 85%;
          padding: 0.85rem 1.1rem;
          font-size: 0.88rem;
          line-height: 1.5;
          border-radius: 12px;
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
            background: #C9A84C;
            border-radius: 50%;
            animation: bounce 1.2s infinite ease-in-out;
            
            &:nth-child(2) { animation-delay: 0.2s; }
            &:nth-child(3) { animation-delay: 0.4s; }
          }
        }

        .chat-input-panel {
          padding: 1.25rem 1.5rem;
          border-top: 1px solid #E0DDD6;
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
            background: #F5F4F0;
            border: 1px solid #E0DDD6;
            border-radius: 8px;
            padding: 0.6rem;
            color: #0B1F3A;
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease-in-out;
            
            &:hover {
              background: #0B1F3A;
              border-color: #0B1F3A;
              color: #FFFFFF;
            }
          }

          .custom-input-form {
            display: flex;
            gap: 0.5rem;
            
            .custom-number-input {
              flex: 1;
              background: #FFFFFF;
              border: 1px solid #E0DDD6;
              border-radius: 8px;
              padding: 0.6rem 0.8rem;
              color: #0B1F3A;
              font-size: 0.8rem;
              
              &:focus {
                outline: none;
                border-color: #C9A84C;
              }
            }
            
            .custom-submit-btn {
              background: #0B1F3A;
              color: #FFFFFF;
              border: none;
              border-radius: 8px;
              padding: 0 1.2rem;
              font-size: 0.8rem;
              font-weight: 500;
              cursor: pointer;
              transition: opacity 0.15s;
              
              &:hover {
                background: #1A2E4A;
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
            border-radius: 8px;
            padding: 0.8rem;
            font-size: 0.85rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease-in-out;
            display: flex;
            justify-content: center;
            align-items: center;
            border: none;
            
            &.yes {
              background: #C9A84C;
              color: #0B1F3A;
              border: 1.5px solid #C9A84C;
              
              &:hover {
                background: #E8D5A3;
                border-color: #E8D5A3;
              }
            }

            &.yes-standard {
              background: #0B1F3A;
              color: #FFFFFF;
              border: 1.5px solid #0B1F3A;
              
              &:hover {
                background: #1A2E4A;
                border-color: #1A2E4A;
              }
            }
            
            &.no {
              background: transparent;
              border: 1.5px solid #E0DDD6;
              color: #6B7B8D;
              
              &:hover {
                background: #F5F4F0;
                border-color: #C9A84C;
                color: #C9A84C;
              }
            }
          }
        }

        .completion-panel {
          .completion-close-btn {
            width: 100%;
            background: #0B1F3A;
            border: 1.5px solid #0B1F3A;
            border-radius: 8px;
            padding: 0.8rem;
            color: #FFFFFF;
            font-size: 0.88rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease-in-out;
            
            &:hover {
              background: #1A2E4A;
              border-color: #1A2E4A;
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
