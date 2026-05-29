"use client";

import React, { useState, useEffect, useRef } from "react";
import { Charity } from "@/app/api/charities/route";

interface ChatModalProps {
  charity: Charity | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (increment: number) => Promise<void>;
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
      1200
    );
    setTimeout(() => {
      addBotMessageWithDelay("Are you ready to link this rule and start giving?", 600);
    }, 1200);
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

  const handleConfirmActivation = async () => {
    setIsSubmitting(true);
    
    // Simulating API save delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    try {
      await onConfirm(selectedIncrement);
      setStep(3);
      
      // User confirm text in bubble
      setMessages((prev) => [
        ...prev,
        {
          id: "confirm_click",
          sender: "user",
          text: "Yes, activate round-ups!",
        },
      ]);

      addBotMessageWithDelay(
        `🎉 Fantastic! Your Investec programmable banking round-up rules are now active at R${selectedIncrement}. Let's make an impact together!`,
        800
      );
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
                  onClick={handleConfirmActivation}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="loading-spinner"></span>
                  ) : (
                    "Yes, Activate Round-Ups"
                  )}
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
          background: rgba(0, 0, 0, 0.7);
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
          background: #111115;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: modalScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .chat-modal-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          justify-content: space-between;
          align-items: center;

          .charity-meta {
            display: flex;
            flex-direction: column;
            gap: 0.2rem;
            
            .charity-badge {
              font-size: 0.65rem;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #007a4a;
            }
            
            h4 {
              font-size: 0.95rem;
              font-weight: 700;
              color: #ffffff;
            }
          }

          .close-btn {
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.4);
            font-size: 1.8rem;
            cursor: pointer;
            transition: color 0.2s;
            
            &:hover {
              color: #ffffff;
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
          background: rgba(255, 255, 255, 0.01);
        }

        .message-row {
          display: flex;
          width: 100%;
          
          &.bot {
            justify-content: flex-start;
            
            .message-bubble {
              background: rgba(255, 255, 255, 0.04);
              color: #e2e8f0;
              border-bottom-left-radius: 4px;
              border: 1px solid rgba(255, 255, 255, 0.04);
            }
          }
          
          &.user {
            justify-content: flex-end;
            
            .message-bubble {
              background: #007a4a;
              color: #ffffff;
              border-bottom-right-radius: 4px;
              box-shadow: 0 4px 12px rgba(0, 122, 74, 0.25);
            }
          }
        }

        .message-bubble {
          max-width: 85%;
          padding: 0.85rem 1.1rem;
          font-size: 0.88rem;
          line-height: 1.45;
          border-radius: 16px;
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
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            animation: bounce 1.2s infinite ease-in-out;
            
            &:nth-child(2) { animation-delay: 0.2s; }
            &:nth-child(3) { animation-delay: 0.4s; }
          }
        }

        .chat-input-panel {
          padding: 1.25rem 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          background: #0e0e11;
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
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 10px;
            padding: 0.6rem;
            color: #ffffff;
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            
            &:hover {
              background: #007a4a;
              border-color: #007a4a;
            }
          }

          .custom-input-form {
            display: flex;
            gap: 0.5rem;
            
            .custom-number-input {
              flex: 1;
              background: rgba(255, 255, 255, 0.03);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 10px;
              padding: 0.6rem 0.8rem;
              color: #ffffff;
              font-size: 0.8rem;
              
              &:focus {
                outline: none;
                border-color: rgba(0, 122, 74, 0.5);
              }
            }
            
            .custom-submit-btn {
              background: #ffffff;
              color: #000000;
              border: none;
              border-radius: 10px;
              padding: 0 1.2rem;
              font-size: 0.8rem;
              font-weight: 700;
              cursor: pointer;
              transition: opacity 0.2s;
              
              &:hover {
                opacity: 0.9;
              }
            }
          }
        }

        .confirmation-panel {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;

          .confirm-buttons-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 0.75rem;
          }

          .confirm-btn {
            border-radius: 12px;
            padding: 0.8rem;
            font-size: 0.85rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            justify-content: center;
            align-items: center;
            
            &.yes {
              background: #007a4a;
              color: #ffffff;
              border: none;
              box-shadow: 0 4px 12px rgba(0, 122, 74, 0.2);
              
              &:hover {
                background: #00663d;
                transform: translateY(-1px);
              }
            }
            
            &.no {
              background: transparent;
              border: 1px solid rgba(255, 255, 255, 0.1);
              color: #a0a5b0;
              
              &:hover {
                background: rgba(255, 255, 255, 0.03);
              }
            }
          }
        }

        .completion-panel {
          .completion-close-btn {
            width: 100%;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            padding: 0.8rem;
            color: #ffffff;
            font-size: 0.88rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
            
            &:hover {
              background: rgba(255, 255, 255, 0.15);
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
