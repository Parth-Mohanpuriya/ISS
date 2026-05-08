import { useState, useEffect, useRef } from 'react';

/**
 * Chatbot Component
 * Floating AI chatbot widget using Hugging Face Inference API
 * Only answers questions using current dashboard data
 */
const Chatbot = ({ darkMode, issData, astronauts, articles }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    // Load messages from localStorage on mount
    const saved = localStorage.getItem('chatbot_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save messages to localStorage (keep last 30)
  useEffect(() => {
    const toSave = messages.slice(-30);
    localStorage.setItem('chatbot_messages', JSON.stringify(toSave));
  }, [messages]);

  /**
   * Build dynamic dashboard context string from current data
   */
  const buildDashboardContext = () => {
    let context = '=== DASHBOARD DATA ===\n\n';

    // ISS Data
    if (issData) {
      context += `ISS CURRENT POSITION:\n`;
      context += `- Latitude: ${issData.latitude?.toFixed(4) || 'N/A'}\n`;
      context += `- Longitude: ${issData.longitude?.toFixed(4) || 'N/A'}\n`;
      context += `- Speed: ${issData.speed ? Math.round(issData.speed) + ' km/h' : 'N/A'}\n`;
      context += `- Last Updated: ${issData.timestamp ? new Date(issData.timestamp).toLocaleString() : 'N/A'}\n\n`;
    }

    // Astronauts Data
    if (astronauts && astronauts.people) {
      context += `ASTRONAUTS IN SPACE: ${astronauts.number}\n`;
      context += `Names:\n`;
      astronauts.people.forEach((p) => {
        context += `- ${p.name} (${p.craft})\n`;
      });
      context += '\n';
    }

    // News Headlines
    if (articles && articles.length > 0) {
      context += `LATEST NEWS HEADLINES:\n`;
      articles.slice(0, 10).forEach((a, i) => {
        context += `${i + 1}. "${a.title}" - ${a.source?.name || 'Unknown'} (${new Date(a.publishedAt).toLocaleDateString()})\n`;
        if (a.description) {
          context += `   Summary: ${a.description.slice(0, 100)}...\n`;
        }
      });
    }

    return context;
  };

  /**
   * Send message to Hugging Face API using the new router endpoint
   * Uses OpenAI-compatible chat completions format
   */
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const token = import.meta.env.VITE_AI_TOKEN;

      if (!token || token === 'your_huggingface_token_here') {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: '⚠️ Please set your VITE_AI_TOKEN in the .env file to enable the AI chatbot.',
          },
        ]);
        setIsTyping(false);
        return;
      }

      const dashboardContext = buildDashboardContext();

      // System prompt that restricts answers to dashboard data only
      const systemPrompt = `You are a dashboard assistant. Only answer using the provided dashboard data. If information is unavailable, say: 'I can only answer using current dashboard information.'

${dashboardContext}`;

      // Use the new HF router endpoint with OpenAI-compatible chat format
      const response = await fetch(
        'https://router.huggingface.co/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'meta-llama/Llama-3.1-8B-Instruct:novita',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage.content },
            ],
            max_tokens: 300,
            temperature: 0.3,
          }),
        }
      );

      const data = await response.json();

      let reply = 'Sorry, I could not generate a response.';

      // Parse OpenAI-compatible response format
      if (data.choices && data.choices[0]?.message?.content) {
        reply = data.choices[0].message.content.trim();
      } else if (data.error) {
        reply = `⚠️ API Error: ${data.error}`;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '❌ Failed to connect to AI. Please try again.' },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Clear chat history
  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('chatbot_messages');
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        id="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isOpen
            ? 'bg-red-500 hover:bg-red-600 rotate-90'
            : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:shadow-indigo-500/40'
        }`}
      >
        <span className="text-white text-2xl">{isOpen ? '✕' : '🤖'}</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`chat-window fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl border overflow-hidden flex flex-col ${
            darkMode
              ? 'bg-gray-900 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
          style={{ height: '480px' }}
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <div>
                <h3 className="font-semibold text-sm">Dashboard Assistant</h3>
                <p className="text-xs text-indigo-100">Ask about ISS, news, astronauts</p>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="text-xs px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Messages Area */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${
            darkMode ? 'bg-gray-900' : 'bg-gray-50'
          }`}>
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <p className="text-4xl mb-3">🛰️</p>
                <p className="text-sm font-medium">Hi! Ask me about the dashboard.</p>
                <p className="text-xs mt-1">ISS location, speed, astronauts, or news</p>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-sm'
                      : darkMode
                        ? 'bg-gray-800 text-gray-200 rounded-bl-sm border border-gray-700'
                        : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200 shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className={`px-4 py-3 rounded-2xl rounded-bl-sm ${
                  darkMode
                    ? 'bg-gray-800 border border-gray-700'
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}>
                  <div className="flex gap-1.5">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className={`p-3 border-t ${
            darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
          }`}>
            <div className="flex gap-2">
              <input
                id="chatbot-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about dashboard data..."
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
                disabled={isTyping}
              />
              <button
                id="chatbot-send"
                onClick={sendMessage}
                disabled={isTyping || !input.trim()}
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
