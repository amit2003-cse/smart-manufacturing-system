import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Bot, User, Sparkles, MessageCircle, HelpCircle } from 'lucide-react';
import './Chatbot.scss';

const EXAMPLE_QUERIES = [
  { text: "Troubleshoot Cable Drawing Machine", icon: "⚙️" },
  { text: "Annealing Machine safety steps", icon: "🔥" },
  { text: "Extrusion parameter settings", icon: "🏭" },
  { text: "Bunching Machine maintenance", icon: "📋" },
];

const API_URL = window.location.hostname === 'localhost' 
  ? "http://localhost:10000" 
  : "https://smart-manufacturing-system.onrender.com";

const Chatbot = () => {
  const navigate = useNavigate();
  
  // Initialize messages from Session Storage or empty array
  const [messages, setMessages] = useState(() => {
    const savedMessages = sessionStorage.getItem('ai_chat_history');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Save messages to Session Storage whenever they change
  useEffect(() => {
    sessionStorage.setItem('ai_chat_history', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (query) => {
    if (!query.trim() || isLoading) return;

    const userMsg = { role: 'user', content: query, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      let targetUrl = `${API_URL}/chat`;
      let res;

      try {
        res = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: query,
            chat_history: messages.slice(-6).map(m => ({
              role: m.role === 'user' ? 'user' : 'assistant',
              content: m.content
            })),
            top_k: 5,
          }),
        });
      } catch (localErr) {
        // If localhost fails, fallback to Render URL
        if (window.location.hostname === 'localhost') {
            console.warn("Local backend not found, falling back to Render...");
            targetUrl = "https://smart-manufacturing-system.onrender.com/chat";
            res = await fetch(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: query,
                    chat_history: messages.slice(-6).map(m => ({
                        role: m.role === 'user' ? 'user' : 'assistant',
                        content: m.content
                    })),
                    top_k: 5,
                }),
            });
        } else {
            throw localErr;
        }
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      const botMsg = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
        model: data.model,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Unable to connect to the assistant. Please make sure the server is running. (${err.message})`,
        isError: true,
        timestamp: new Date(),
      }]);
    }

    setIsLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleExampleClick = (query) => {
    sendMessage(query);
  };

  const formatAnswer = (text) => {
    // Bold
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Bullet points
    formatted = formatted.replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>');
    if (formatted.includes('<li>')) {
      formatted = formatted.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
    }
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
  };

  return (
    <div className="chatbot-page">

      {/* Header */}
      <div className="chatbot-header">
        <button className="btn btn-secondary back-btn" onClick={() => navigate('/home')}>
          <ArrowLeft size={18} />
          <span>Back to Home</span>
        </button>
        <div className="header-center">
          <Bot size={22} />
          <div>
            <h2>Voltaic Cable AI Knowledge Base</h2>
            <span className="header-status">Machine Guidance and Troubleshooting Context</span>
          </div>
        </div>
      </div>

      {/* Chat Body */}
      <div className="chatbot-body">

        {/* Welcome / Empty State */}
        {messages.length === 0 && (
          <div className="welcome-state">
            <div className="welcome-icon-container">
              <Sparkles size={40} className="welcome-sparkle" />
            </div>
            <h2>Plant Machine Assistant</h2>
            <p style={{ maxWidth: '600px', margin: '0 auto 20px' }}>
              I am trained to help with troubleshooting and operational guidance for 
              <strong> Cable Drawing, Annealing, Bunching, Extrusion, Coiling, and Packaging </strong> machines.
            </p>

            <div className="help-tips" style={{ gridTemplateColumns: '1fr', maxWidth: '500px', margin: '0 auto 24px' }}>
              <div className="tip-item">
                <HelpCircle size={16} />
                <span>Always prioritize safety before taking any mechanical action.</span>
              </div>
              <div className="tip-item">
                <MessageCircle size={16} />
                <span>Please identify the machine type for accurate step-by-step guidance.</span>
              </div>
            </div>

            <h4 className="examples-title">Troubleshoot by Machine:</h4>
            <div className="example-queries">
              {EXAMPLE_QUERIES.map((q, i) => (
                <button
                  key={i}
                  className="example-chip"
                  onClick={() => handleExampleClick(q.text)}
                >
                  <span className="chip-icon">{q.icon}</span>
                  {q.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`message-bubble ${msg.isError ? 'error' : ''}`}>
              <div
                className="message-text"
                dangerouslySetInnerHTML={{ __html: formatAnswer(msg.content) }}
              />
              {msg.sources && msg.sources.length > 0 && (
                <div className="message-sources">
                  <span className="sources-label">Sources:</span>
                  {msg.sources.map((s, j) => (
                    <span key={j} className="source-badge">
                      {s.module} &middot; {s.docType}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="chat-message assistant">
            <div className="message-avatar">
              <Bot size={16} />
            </div>
            <div className="message-bubble">
              <div className="typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chatbot-input-area">
        <div className="input-row">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question here..."
            rows={1}
            disabled={isLoading}
          />
          <button
            className="send-button"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
          >
            <Send size={18} />
          </button>
        </div>
        <p className="input-hint">
          Press <kbd>Enter</kbd> to send &middot; <kbd>Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
};

export default Chatbot;
