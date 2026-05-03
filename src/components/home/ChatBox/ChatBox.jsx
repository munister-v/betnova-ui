import { useContext, useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { AppContext } from "../../../context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { SocketIOClient, connectWebSocket, emitSocketEvent, onSocketEvent, offSocketEvent } from "@/lib/websocket";

import { ReactComponent as MSG } from "../../../assets/images/Frame (31).svg";
import { ReactComponent as CANDLE_ICON } from "../../../assets/images/Frame (32).svg";
import { ReactComponent as ARROW_DOWN } from "../../../assets/images/Frame (33).svg";
import { ReactComponent as COLLAPSE } from "../../../assets/images/Frame (34).svg";
import { ReactComponent as CROSS } from "../../../assets/images/Frame (35).svg";
import { ReactComponent as SETTINGS } from "../../../assets/images/Frame (36).svg";
import EMOJI from "../../../assets/images/IMAGE (43).png";
import RANK_ICON from "../../../assets/images/rank-icon-gold.png";
import CryptoFuturesCoins from "../../Common/CryptoFuturesCoins/CryptoFuturesCoins";
import CardMessage from "./CardMessage";
import {
  ImagePart,
  MessageInput,
  StyledChatBoxContainer,
  StyledIconSection,
  SwitchContainer,
} from "./styles";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

const ChatBox = ({ isChatBox, setIsChatBox }) => {
  const { pathname } = useLocation();
  const { isTabletScreen, isChatBoxCollapsed, updateChatBoxCollapsed } = useContext(AppContext);
  const { user } = useAuth();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [activeButton, setActiveButton] = useState("chat");
  const messagesEndRef = useRef(null);

  // Load history on mount
  useEffect(() => {
    fetch(`${BACKEND}/api/chat/history?limit=50`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.messages)) {
          setMessages(json.messages.reverse());
        }
      })
      .catch(() => {});
  }, []);

  // Socket.IO listeners
  useEffect(() => {
    connectWebSocket().catch(() => {});

    const handleMessage = (msg) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.find((m) => m.id === msg.id)) return prev;
        const next = [...prev, msg];
        return next.slice(-100); // keep last 100
      });
    };

    const handleOnline = ({ count }) => setOnlineCount(count);
    const handleError = ({ error }) => console.warn("Chat error:", error);

    onSocketEvent("chat:message", handleMessage);
    onSocketEvent("chat:online", handleOnline);
    onSocketEvent("chat:error", handleError);

    return () => {
      offSocketEvent("chat:message", handleMessage);
      offSocketEvent("chat:online", handleOnline);
      offSocketEvent("chat:error", handleError);
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleButtonClick = (button) => setActiveButton(button);
  const handleCollapse = () => updateChatBoxCollapsed(!isChatBoxCollapsed);

  const handleSend = () => {
    if (!message.trim()) return;
    if (!user?.isAuthenticated) {
      alert("Please log in to chat.");
      return;
    }
    emitSocketEvent("chat:send", { content: message.trim() });
    setMessage("");
  };

  const handleInputKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  const renderUsername = (msg) => msg.users?.username || "Anonymous";
  const renderAvatar = (msg) => msg.users?.avatar_url || RANK_ICON;

  return (
    <>
      {isChatBox ? (
        <StyledChatBoxContainer
          isTabletScreen={isTabletScreen}
          style={{
            padding: pathname.includes("/sports") ? "0px 16px 64px" : "0px 16px 16px",
            width: isChatBoxCollapsed ? "248px" : "340px",
          }}
        >
          <div className="top-actions-container">
            <div className="chat-trades">
              <div
                className={`btn-chatbox ${activeButton === "chat" ? "active-btn" : ""}`}
                onClick={() => handleButtonClick("chat")}
              >
                <MSG />
                Chat
                {onlineCount > 0 && (
                  <span style={{ fontSize: "11px", color: "#4ade80", marginLeft: "4px" }}>
                    {onlineCount} online
                  </span>
                )}
              </div>
              <div
                className={`btn-chatbox ${activeButton === "trades" ? "active-btn" : ""}`}
                style={{ cursor: "pointer" }}
                onClick={() => handleButtonClick("trades")}
              >
                <CANDLE_ICON className="switch-icon" />
                Trades
                <ARROW_DOWN className="arrow-icon" />
              </div>
            </div>

            <SwitchContainer>
              <div className="container-buttons">
                <COLLAPSE
                  className={`collapse-icon ${isChatBoxCollapsed ? "collapsed" : ""}`}
                  onClick={handleCollapse}
                />
                <CROSS className="cross-icon" onClick={() => setIsChatBox(false)} />
              </div>
            </SwitchContainer>
          </div>

          {activeButton === "chat" ? (
            <>
              {messages.length === 0 ? (
                <ImagePart>
                  <p>No Messages Yet</p>
                </ImagePart>
              ) : (
                <div className="chat-messages" style={{ overflowY: "auto", maxHeight: "400px" }}>
                  {messages.map((msg, index) => (
                    <CardMessage
                      key={msg.id || index}
                      rankIcon={renderAvatar(msg)}
                      playerName={renderUsername(msg)}
                      messageText={msg.content}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}

              <MessageInput
                type="text"
                placeholder={user?.isAuthenticated ? "Type a message..." : "Log in to chat"}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleInputKeyPress}
                disabled={!user?.isAuthenticated}
              />

              <StyledIconSection>
                <div className="icons">
                  <img src={EMOJI} alt="emoji" className="emoji" />
                  <SETTINGS className="settings" />
                  <p>Rules</p>
                </div>
                <div className="info">
                  <p className="info-value">{message.length}/500</p>
                  <button
                    onClick={handleSend}
                    className="send-button"
                    disabled={!message.trim() || !user?.isAuthenticated}
                  >
                    Send
                  </button>
                </div>
              </StyledIconSection>
            </>
          ) : (
            <div className="container-bets">
              <div className="section-title" style={{ marginBottom: "21px" }}>
                My Active Bets
              </div>
              <div className="active-bets" style={{ padding: "0px 0px 10px" }}>
                <CANDLE_ICON />
                <div className="text">No Bets Yet</div>
              </div>
              <div style={{ paddingTop: "25px" }}>
                <div className="section-title" style={{ marginBottom: "10px" }}>
                  Market Prices
                </div>
                <CryptoFuturesCoins />
              </div>
            </div>
          )}
        </StyledChatBoxContainer>
      ) : null}
    </>
  );
};

export default ChatBox;
