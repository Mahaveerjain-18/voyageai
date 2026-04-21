"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { sendChatMessage, ChatMessage } from "@/lib/api";

interface TripChatAgentProps {
  tripContext?: {
    origin: string;
    destination: string;
    startDate: string;
    endDate: string;
    travelers: number;
    preferences: string;
    totalBudget: number;
  };
}

export function TripChatAgent({ tripContext }: TripChatAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hey! 👋 I'm your AI travel buddy. Tell me where you're dreaming of going, what kind of vibe you're looking for, or just ask me anything about travel — I'm here to help you plan something amazing!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [animatingIdx, setAnimatingIdx] = useState<number | null>(null);
  const [animatedText, setAnimatedText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pulse, setPulse] = useState(true);
  const [isBreaking, setIsBreaking] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Disable pulse after first open
  useEffect(() => {
    if (isOpen) setPulse(false);
  }, [isOpen]);

  const toggleFab = () => {
    if (isBreaking) return;
    setIsBreaking(true);
    setTimeout(() => setIsOpen((prev) => !prev), 300);
    setTimeout(() => setIsBreaking(false), 600);
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, animatedText, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Character-by-character typing animation
  useEffect(() => {
    if (animatingIdx === null) return;
    const fullText = messages[animatingIdx]?.content || "";
    if (animatedText.length >= fullText.length) {
      setAnimatingIdx(null);
      setAnimatedText("");
      return;
    }

    const speed = fullText[animatedText.length] === "\n" ? 30 : 8 + Math.random() * 12;

    const timer = setTimeout(() => {
      setAnimatedText(fullText.slice(0, animatedText.length + 1));
    }, speed);

    return () => clearTimeout(timer);
  }, [animatingIdx, animatedText, messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    try {
      const response = await sendChatMessage(updatedMessages, tripContext);
      const aiContent = response.content || "Sorry, I didn't catch that. Could you try asking again?";

      const newMessages = [...updatedMessages, { role: "assistant" as const, content: aiContent }];
      setMessages(newMessages);
      setAnimatingIdx(newMessages.length - 1);
      setAnimatedText("");
      setIsTyping(false);
    } catch (err) {
      setIsTyping(false);
      const errMessages = [
        ...updatedMessages,
        {
          role: "assistant" as const,
          content: "Hmm, something went wrong on my end. Try asking again — I promise I'm usually more reliable than this! 😅",
        },
      ];
      setMessages(errMessages);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickChips = [
    "🏖️ Beach vacation under $1500",
    "🗾 Best time to visit Japan?",
    "🍕 Hidden gems in Europe",
    "👨‍👩‍👧 Family-friendly trips",
    "💰 How to budget my trip?",
  ];

  const handleChipClick = (text: string) => {
    // Remove emoji prefix for cleaner message
    const clean = text.replace(/^[^\w]*/, "").trim();
    setInput(clean);
    // Use a timeout to allow state to update before sending
    setTimeout(() => {
      const userMsg: ChatMessage = { role: "user", content: clean };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setIsTyping(true);

      sendChatMessage(updatedMessages, tripContext)
        .then((response) => {
          const aiContent = response.content || "Let me think about that...";
          const newMsgs = [...updatedMessages, { role: "assistant" as const, content: aiContent }];
          setMessages(newMsgs);
          setAnimatingIdx(newMsgs.length - 1);
          setAnimatedText("");
          setIsTyping(false);
        })
        .catch(() => {
          setIsTyping(false);
          setMessages([
            ...updatedMessages,
            { role: "assistant", content: "Sorry, hit a snag. Try again!" },
          ]);
        });
    }, 50);
  };

  // Determine display text for a message (animated or full)
  const getDisplayText = (msg: ChatMessage, idx: number) => {
    if (idx === animatingIdx) return animatedText;
    return msg.content;
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 10000, display: "flex", alignItems: "center" }}>
        {/* Ask Agent Tooltip */}
        <div className={`fab-tooltip ${showTooltip && !isOpen ? "visible" : ""}`}>
          Ask Agent
          <div className="fab-tooltip-triangle" />
        </div>

        <button
          onClick={toggleFab}
          className={`fab-container ${pulse ? "chat-btn-pulse" : ""} ${isBreaking ? "breaking" : ""}`}
          style={{ position: "relative", bottom: "auto", right: "auto" }}
        >
          <svg viewBox="0 0 100 100" className="fab-svg">
            <polygon className="shard shard-1" points="25,0 75,0 50,50" />
            <polygon className="shard shard-2" points="75,0 100,50 50,50" />
            <polygon className="shard shard-3" points="100,50 75,100 50,50" />
            <polygon className="shard shard-4" points="75,100 25,100 50,50" />
            <polygon className="shard shard-5" points="25,100 0,50 50,50" />
            <polygon className="shard shard-6" points="0,50 25,0 50,50" />
          </svg>

          <div
            className="fab-icon-wrapper"
            style={{
              opacity: isBreaking ? 0 : 1,
              transform: isBreaking ? "scale(0.5) rotate(-45deg)" : "scale(1) rotate(0deg)",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {isOpen ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" />
              </svg>
            )}
          </div>
        </button>
      </div>

      {/* Chat Panel */}
      {isOpen && (
        <div className="chat-panel">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-avatar">
              <span>✨</span>
            </div>
            <div>
              <p className="chat-title">VoyageAI Assistant</p>
              <p className="chat-status">
                <span className="chat-status-dot" />
                Online · Powered by Gemini
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="chat-close-btn"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-msg ${msg.role === "user" ? "chat-msg-user" : "chat-msg-ai"}`}
              >
                {msg.role === "assistant" && (
                  <div className="chat-msg-avatar-small">✨</div>
                )}
                <div
                  className={`chat-bubble ${msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}`}
                >
                  {getDisplayText(msg, i)}
                  {i === animatingIdx && (
                    <span className="chat-cursor">▊</span>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="chat-msg chat-msg-ai">
                <div className="chat-msg-avatar-small">✨</div>
                <div className="chat-bubble chat-bubble-ai chat-typing-bubble">
                  <span className="typing-dot" style={{ animationDelay: "0s" }} />
                  <span className="typing-dot" style={{ animationDelay: "0.15s" }} />
                  <span className="typing-dot" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
            )}

            {/* Quick suggestion chips (only at start) */}
            {messages.length <= 1 && !isTyping && (
              <div className="chat-chips">
                {quickChips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleChipClick(chip)}
                    className="chat-chip"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="chat-input-bar">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me about travel..."
              disabled={isTyping || animatingIdx !== null}
              className="chat-input"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping || animatingIdx !== null}
              className="chat-send-btn"
              style={{
                background:
                  input.trim() && !isTyping
                    ? "#ffffff"
                    : "rgba(255,255,255,0.04)",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={input.trim() && !isTyping ? "#0a0a0a" : "#555"}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        /* ─── Panel ─── */
        .chat-panel {
          position: fixed;
          bottom: 100px;
          right: 28px;
          width: 420px;
          max-height: 72vh;
          background: #0c0c0c;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 22px;
          display: flex;
          flex-direction: column;
          z-index: 10000;
          overflow: hidden;
          box-shadow:
            0 24px 80px rgba(0, 0, 0, 0.7),
            0 0 1px rgba(255, 255, 255, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          animation: chatSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes chatSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* ─── Header ─── */
        .chat-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.015);
        }

        .chat-avatar {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          background: #ffffff;
          color: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.15rem;
          flex-shrink: 0;
        }

        .chat-title {
          font-family: var(--font-sans);
          font-size: 0.92rem;
          font-weight: 600;
          color: #fff;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .chat-status {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          color: #e5e5e5;
          margin: 2px 0 0;
          display: flex;
          align-items: center;
          gap: 5px;
          letter-spacing: 0.02em;
        }

        .chat-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #e5e5e5;
          display: inline-block;
          animation: statusPulse 2s infinite;
        }

        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .chat-close-btn {
          margin-left: auto;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.2s;
        }
        .chat-close-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }

        /* ─── Messages Area ─── */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 18px 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 280px;
          max-height: calc(72vh - 140px);
        }

        .chat-messages::-webkit-scrollbar {
          width: 4px;
        }
        .chat-messages::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
        }

        .chat-msg {
          display: flex;
          gap: 8px;
          animation: msgIn 0.3s ease;
        }

        @keyframes msgIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .chat-msg-user {
          justify-content: flex-end;
        }

        .chat-msg-ai {
          justify-content: flex-start;
          align-items: flex-start;
        }

        .chat-msg-avatar-small {
          width: 26px;
          height: 26px;
          border-radius: 9px;
          background: #ffffff;
          color: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .chat-bubble {
          max-width: 80%;
          padding: 11px 15px;
          font-size: 0.86rem;
          line-height: 1.55;
          font-family: var(--font-sans);
          white-space: pre-wrap;
          word-break: break-word;
        }

        .chat-bubble-user {
          background: #ffffff;
          color: #0a0a0a;
          border-radius: 18px 18px 4px 18px;
          font-weight: 500;
        }

        .chat-bubble-ai {
          background: rgba(255, 255, 255, 0.04);
          color: #e4e4e7;
          border-radius: 4px 18px 18px 18px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          font-weight: 400;
        }

        .chat-cursor {
          display: inline;
          animation: blink 0.7s step-end infinite;
          color: #ffffff;
          margin-left: 1px;
          font-size: 0.8em;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        /* ─── Typing Dots ─── */
        .chat-typing-bubble {
          display: flex;
          gap: 5px;
          align-items: center;
          padding: 14px 18px;
        }

        .typing-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.55);
          animation: bounce 1.3s infinite;
          display: inline-block;
        }

        @keyframes bounce {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.35;
          }
          30% {
            transform: translateY(-7px);
            opacity: 1;
          }
        }

        /* ─── Quick Chips ─── */
        .chat-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 6px;
          padding-left: 34px;
        }

        .chat-chip {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          padding: 8px 14px;
          font-size: 0.74rem;
          color: #ffffff;
          cursor: pointer;
          font-family: var(--font-sans);
          transition: all 0.2s;
          white-space: nowrap;
        }
        .chat-chip:hover {
          background: rgba(255, 255, 255, 0.14);
          border-color: rgba(255, 255, 255, 0.35);
          transform: translateY(-1px);
        }

        /* ─── Input Bar ─── */
        .chat-input-bar {
          padding: 12px 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          gap: 10px;
          align-items: center;
          background: rgba(255, 255, 255, 0.015);
        }

        .chat-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 14px;
          padding: 12px 16px;
          font-size: 0.86rem;
          color: #fff;
          font-family: var(--font-sans);
          outline: none;
          transition: border-color 0.2s;
        }
        .chat-input:focus {
          border-color: rgba(255, 255, 255, 0.35);
        }
        .chat-input::placeholder {
          color: rgba(255, 255, 255, 0.2);
        }
        .chat-input:disabled {
          opacity: 0.5;
        }

        .chat-send-btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .chat-send-btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        /* ─── Hexagon FAB styles ─── */
        .fab-container {
          width: 64px;
          height: 64px;
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }

        .fab-svg {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: visible;
          filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.4));
        }

        .shard {
          fill: #161616;
          stroke: #ffffff;
          stroke-width: 1.5;
          stroke-linejoin: miter;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
          transform-origin: 50px 50px;
        }

        .fab-container:hover .shard {
          fill: #1c1c1c;
          stroke: #ffffff;
        }

        .fab-container.breaking .shard-1 { transform: translate(0, -30px) rotate(15deg) scale(0.6); opacity: 0; }
        .fab-container.breaking .shard-2 { transform: translate(30px, -15px) rotate(30deg) scale(0.6); opacity: 0; }
        .fab-container.breaking .shard-3 { transform: translate(30px, 30px) rotate(15deg) scale(0.6); opacity: 0; }
        .fab-container.breaking .shard-4 { transform: translate(0, 30px) rotate(-15deg) scale(0.6); opacity: 0; }
        .fab-container.breaking .shard-5 { transform: translate(-30px, 15px) rotate(-30deg) scale(0.6); opacity: 0; }
        .fab-container.breaking .shard-6 { transform: translate(-30px, -15px) rotate(-15deg) scale(0.6); opacity: 0; }

        .fab-icon-wrapper {
          position: relative;
          z-index: 2;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ─── Ask Agent Tooltip ─── */
        .fab-tooltip {
          background: #ffffff;
          color: #0a0a0a;
          padding: 8px 14px;
          border-radius: 8px;
          font-family: var(--font-sans);
          font-size: 0.85rem;
          font-weight: 600;
          margin-right: 16px;
          opacity: 0;
          transform: translateX(10px);
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
          position: relative;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .fab-tooltip.visible {
          opacity: 1;
          transform: translateX(0);
        }

        .fab-tooltip-triangle {
          position: absolute;
          right: -5px;
          top: 50%;
          transform: translateY(-50%);
          width: 0; 
          height: 0; 
          border-top: 6px solid transparent;
          border-bottom: 6px solid transparent;
          border-left: 6px solid #ffffff;
        }

        .chat-btn-pulse {
          animation: floatPulse 3s infinite;
        }

        @keyframes floatPulse {
          0% { filter: drop-shadow(0 0 12px rgba(255,255,255,0.2)); transform: translateY(0); }
          50% { filter: drop-shadow(0 0 24px rgba(255,255,255,0.5)); transform: translateY(-4px); }
          100% { filter: drop-shadow(0 0 12px rgba(255,255,255,0.2)); transform: translateY(0); }
        }

        /* ─── Mobile ─── */
        @media (max-width: 480px) {
          .chat-panel {
            width: calc(100vw - 24px);
            right: 12px;
            bottom: 88px;
            max-height: 75vh;
          }
        }
      `}</style>
    </>
  );
}
