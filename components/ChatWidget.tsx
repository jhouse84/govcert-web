"use client";

import { useState, useRef, useEffect } from "react";
import { apiRequest } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

type Tab = "chat" | "email" | "upgrade";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [showPulse, setShowPulse] = useState(true);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm the GovCert assistant. I can help with certification eligibility, application questions, and platform features. What can I help you with?",
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    },
  ]);
  const [conversationHistory, setConversationHistory] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Email state
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailStatus, setEmailStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [emailSending, setEmailSending] = useState(false);

  // Upgrade state
  const [upgradeNote, setUpgradeNote] = useState("");
  const [upgradeStatus, setUpgradeStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [upgradeSending, setUpgradeSending] = useState(false);
  const [userTier, setUserTier] = useState<string>("PLATFORM");

  useEffect(() => {
    try {
      const user = localStorage.getItem("user");
      if (user) {
        const parsed = JSON.parse(user);
        setUserTier(parsed.subscriptionTier || "PLATFORM");
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (showPulse) {
      const timer = setTimeout(() => setShowPulse(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showPulse]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const now = () => new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || isTyping) return;

    const userMsg: Message = { role: "user", content: text, timestamp: now() };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    try {
      const data = await apiRequest("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: text, conversationHistory }),
      });
      const botMsg: Message = { role: "assistant", content: data.reply, timestamp: now() };
      setMessages((prev) => [...prev, botMsg]);
      setConversationHistory(data.conversationHistory);
    } catch (err: any) {
      const errMsg: Message = {
        role: "assistant",
        content: "Sorry, something went wrong. Please try again or email our team directly.",
        timestamp: now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const sendEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim() || emailSending) return;
    setEmailSending(true);
    setEmailStatus(null);

    try {
      await apiRequest("/api/chat/email", {
        method: "POST",
        body: JSON.stringify({ subject: emailSubject, message: emailMessage }),
      });
      setEmailStatus({ type: "success", text: "Your message has been sent to your GovCert advisor." });
      setEmailSubject("");
      setEmailMessage("");
    } catch (err: any) {
      setEmailStatus({ type: "error", text: err.message || "Failed to send email. Please try again." });
    } finally {
      setEmailSending(false);
    }
  };

  const requestUpgrade = async () => {
    if (upgradeSending) return;
    setUpgradeSending(true);
    setUpgradeStatus(null);

    try {
      const data = await apiRequest("/api/chat/upgrade", {
        method: "POST",
        body: JSON.stringify({ message: upgradeNote }),
      });
      setUpgradeStatus({ type: "success", text: data.message || "Upgrade request submitted" });
      setUserTier("CONSULTING");
      // Update localStorage
      try {
        const user = localStorage.getItem("user");
        if (user) {
          const parsed = JSON.parse(user);
          parsed.subscriptionTier = "CONSULTING";
          localStorage.setItem("user", JSON.stringify(parsed));
        }
      } catch {}
    } catch (err: any) {
      setUpgradeStatus({ type: "error", text: err.message || "Failed to submit upgrade request." });
    } finally {
      setUpgradeSending(false);
    }
  };

  const pulseKeyframes = `
    @keyframes chatPulse {
      0% { box-shadow: 0 0 0 0 rgba(200, 155, 60, 0.5); }
      70% { box-shadow: 0 0 0 14px rgba(200, 155, 60, 0); }
      100% { box-shadow: 0 0 0 0 rgba(200, 155, 60, 0); }
    }
    @keyframes dotBounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
  `;

  const tabStyle = (tab: Tab): React.CSSProperties => ({
    flex: 1,
    padding: "10px 0",
    fontSize: "13px",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    color: activeTab === tab ? "#C89B3C" : "#8BA0B4",
    background: "none",
    border: "none",
    borderBottom: activeTab === tab ? "2px solid #C89B3C" : "2px solid transparent",
    cursor: "pointer",
    transition: "all 0.2s",
  });

  return (
    <>
      <style>{pulseKeyframes}</style>

      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #C89B3C, #E8B84B)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            zIndex: 1000,
            animation: showPulse ? "chatPulse 2s ease-in-out 3" : "none",
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 380,
            height: 520,
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
            background: "#fff",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "#0B1929",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                color: "#fff",
                fontSize: "16px",
                fontWeight: 600,
                fontFamily: "'Cormorant Garamond', serif",
                letterSpacing: "0.3px",
              }}
            >
              Gov<span style={{ color: "#C89B3C" }}>Cert</span> Assistant
            </span>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "#8BA0B4",
                cursor: "pointer",
                fontSize: "18px",
                padding: "0 2px",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #E0D9C8", background: "#FAFAF7" }}>
            <button onClick={() => setActiveTab("chat")} style={tabStyle("chat")}>AI Chat</button>
            <button onClick={() => setActiveTab("email")} style={tabStyle("email")}>Email Admin</button>
            <button onClick={() => setActiveTab("upgrade")} style={tabStyle("upgrade")}>Upgrade Plan</button>
          </div>

          {/* Content area */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {/* AI Chat Tab */}
            {activeTab === "chat" && (
              <>
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "12px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                        maxWidth: "82%",
                      }}
                    >
                      <div
                        style={{
                          padding: "10px 14px",
                          borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                          background: msg.role === "user" ? "linear-gradient(135deg, #C89B3C, #E8B84B)" : "#F5F1E8",
                          color: msg.role === "user" ? "#fff" : "#0B1929",
                          fontSize: "14px",
                          lineHeight: 1.5,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {msg.content}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#8BA0B4",
                          marginTop: 3,
                          textAlign: msg.role === "user" ? "right" : "left",
                          paddingLeft: msg.role === "user" ? 0 : 4,
                          paddingRight: msg.role === "user" ? 4 : 0,
                        }}
                      >
                        {msg.timestamp}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div style={{ alignSelf: "flex-start", maxWidth: "82%" }}>
                      <div
                        style={{
                          padding: "10px 18px",
                          borderRadius: "14px 14px 14px 4px",
                          background: "#F5F1E8",
                          display: "flex",
                          gap: 4,
                          alignItems: "center",
                        }}
                      >
                        {[0, 1, 2].map((d) => (
                          <span
                            key={d}
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: "#8BA0B4",
                              display: "inline-block",
                              animation: `dotBounce 1.4s infinite ease-in-out both`,
                              animationDelay: `${d * 0.16}s`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div
                  style={{
                    padding: "10px 12px",
                    borderTop: "1px solid #E0D9C8",
                    display: "flex",
                    gap: 8,
                    background: "#FAFAF7",
                  }}
                >
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                    placeholder="Ask a question..."
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: "1px solid #D4CABC",
                      fontSize: "14px",
                      fontFamily: "'DM Sans', sans-serif",
                      outline: "none",
                      background: "#fff",
                    }}
                  />
                  <button
                    onClick={sendChat}
                    disabled={isTyping || !chatInput.trim()}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 8,
                      background: isTyping || !chatInput.trim() ? "#D4CABC" : "linear-gradient(135deg, #C89B3C, #E8B84B)",
                      color: "#fff",
                      border: "none",
                      cursor: isTyping || !chatInput.trim() ? "default" : "pointer",
                      fontSize: "14px",
                      fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Send
                  </button>
                </div>
              </>
            )}

            {/* Email Admin Tab */}
            {activeTab === "email" && (
              <div style={{ flex: 1, padding: "20px 16px", overflowY: "auto" }}>
                <p style={{ fontSize: "14px", color: "#5A7A96", marginBottom: 16, lineHeight: 1.5 }}>
                  Send a message directly to your GovCert advisor for complex questions or personalized help.
                </p>
                {emailStatus && (
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: 8,
                      marginBottom: 14,
                      fontSize: "13px",
                      background: emailStatus.type === "success" ? "#E8F5E9" : "#FFEBEE",
                      color: emailStatus.type === "success" ? "#2E7D32" : "#C62828",
                    }}
                  >
                    {emailStatus.text}
                  </div>
                )}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#0B1929", marginBottom: 6 }}>
                    Subject
                  </label>
                  <input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="e.g. Question about 8(a) eligibility"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #D4CABC",
                      fontSize: "14px",
                      fontFamily: "'DM Sans', sans-serif",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#0B1929", marginBottom: 6 }}>
                    Message
                  </label>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Describe your question or issue in detail..."
                    rows={6}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #D4CABC",
                      fontSize: "14px",
                      fontFamily: "'DM Sans', sans-serif",
                      outline: "none",
                      resize: "vertical",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <button
                  onClick={sendEmail}
                  disabled={emailSending || !emailSubject.trim() || !emailMessage.trim()}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 8,
                    background:
                      emailSending || !emailSubject.trim() || !emailMessage.trim()
                        ? "#D4CABC"
                        : "linear-gradient(135deg, #C89B3C, #E8B84B)",
                    color: "#fff",
                    border: "none",
                    cursor: emailSending || !emailSubject.trim() || !emailMessage.trim() ? "default" : "pointer",
                    fontSize: "14px",
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {emailSending ? "Sending..." : "Send Email →"}
                </button>
              </div>
            )}

            {/* Upgrade Plan Tab */}
            {activeTab === "upgrade" && (
              <div style={{ flex: 1, padding: "20px 16px", overflowY: "auto" }}>
                {userTier === "CONSULTING" ? (
                  <div style={{ textAlign: "center", paddingTop: 30 }}>
                    <div style={{ fontSize: "28px", marginBottom: 12 }}>&#10003;</div>
                    <p style={{ fontSize: "15px", fontWeight: 600, color: "#0B1929", marginBottom: 8 }}>
                      Managed Service Plan
                    </p>
                    <p style={{ fontSize: "14px", color: "#5A7A96", lineHeight: 1.6 }}>
                      You're already on our Managed Service plan. Your advisor will be in touch.
                    </p>
                  </div>
                ) : (
                  <>
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: 600,
                        color: "#0B1929",
                        fontFamily: "'Cormorant Garamond', serif",
                        marginBottom: 8,
                        marginTop: 0,
                      }}
                    >
                      Upgrade to Managed Service
                    </h3>
                    <p style={{ fontSize: "13px", color: "#5A7A96", lineHeight: 1.6, marginBottom: 14 }}>
                      Let a dedicated GovCert advisor handle your entire certification process. You provide the
                      information, we do the rest.
                    </p>
                    <ul style={{ margin: "0 0 16px 0", padding: "0 0 0 18px", fontSize: "13px", color: "#0B1929", lineHeight: 2 }}>
                      <li>Dedicated advisor assigned to your account</li>
                      <li>All narratives drafted and reviewed by experts</li>
                      <li>Full submission package prepared for you</li>
                      <li>Ongoing compliance monitoring</li>
                    </ul>
                    {upgradeStatus && (
                      <div
                        style={{
                          padding: "10px 14px",
                          borderRadius: 8,
                          marginBottom: 14,
                          fontSize: "13px",
                          background: upgradeStatus.type === "success" ? "#E8F5E9" : "#FFEBEE",
                          color: upgradeStatus.type === "success" ? "#2E7D32" : "#C62828",
                        }}
                      >
                        {upgradeStatus.text}
                      </div>
                    )}
                    <div style={{ marginBottom: 14 }}>
                      <label
                        style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#0B1929", marginBottom: 6 }}
                      >
                        Tell us about your needs (optional)
                      </label>
                      <textarea
                        value={upgradeNote}
                        onChange={(e) => setUpgradeNote(e.target.value)}
                        placeholder="e.g. I need help with my 8(a) application..."
                        rows={3}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 8,
                          border: "1px solid #D4CABC",
                          fontSize: "14px",
                          fontFamily: "'DM Sans', sans-serif",
                          outline: "none",
                          resize: "vertical",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                    <button
                      onClick={requestUpgrade}
                      disabled={upgradeSending}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: 8,
                        background: upgradeSending ? "#D4CABC" : "linear-gradient(135deg, #C89B3C, #E8B84B)",
                        color: "#fff",
                        border: "none",
                        cursor: upgradeSending ? "default" : "pointer",
                        fontSize: "14px",
                        fontWeight: 600,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {upgradeSending ? "Submitting..." : "Request Upgrade →"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
