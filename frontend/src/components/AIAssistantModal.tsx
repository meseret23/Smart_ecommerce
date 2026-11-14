
import React, { useState, useRef, useEffect } from 'react';
import { processUserQuery } from '../services/aiService';
import type { ChatMessage, Product } from '../services/aiService';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  products,
  onAddToCart,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Salam! I am your SmartMarket AI Assistant. Ask me anything about our products, recommendations, or deals!',
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({
        behavior: 'smooth',
      });
    }
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSendQuery = async (queryText: string) => {
    const trimmedQuery = queryText.trim();

    if (!trimmedQuery || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: trimmedQuery,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await processUserQuery(trimmedQuery, products);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: response.text,
        recommendedProducts: response.products,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error('AI assistant error:', error);

      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Sorry, I could not process your request. Please try again.',
      };

      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleSendQuery(input);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 p-0 sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex flex-col w-full max-w-md h-full bg-white sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200/70"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="SmartMarket AI Assistant"
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-800 via-indigo-700 to-violet-700 px-5 py-5 text-white">
          <div className="absolute -right-10 -top-12 w-40 h-40 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-lg">
                <span className="text-2xl">✦</span>
              </div>

              <div>
                <h3 className="font-bold text-base tracking-tight">
                  SmartMarket AI
                </h3>

                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <p className="text-xs text-indigo-100">
                    Online · Ready to assist
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close assistant"
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all duration-200 hover:rotate-90"
            >
              ✕
            </button>
          </div>

          <p className="relative text-xs text-indigo-100/90 mt-4 leading-relaxed">
            Discover products, compare prices, and find the best deals with AI.
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 bg-slate-50/80">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[88%] px-4 py-3 text-[13px] leading-relaxed shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-2xl rounded-br-md'
                    : 'bg-white text-slate-700 border border-slate-200/80 rounded-2xl rounded-bl-md'
                }`}
              >
                {msg.text}
              </div>

              {/* Recommended Products */}
              {msg.recommendedProducts &&
                msg.recommendedProducts.length > 0 && (
                  <div className="mt-3 space-y-2.5 w-full max-w-[95%]">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 px-1">
                      Recommended for you
                    </p>

                    {msg.recommendedProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="group bg-white border border-slate-200 rounded-2xl p-3 flex items-center gap-3 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200"
                      >
                        <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                          {(prod as any).image_url ||
                          (prod as any).image ? (
                            <img
                              src={
                                (prod as any).image_url ||
                                (prod as any).image
                              }
                              alt={
                                (prod as any).title ||
                                (prod as any).name ||
                                'Product'
                              }
                              className="w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <span className="text-2xl">📦</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {(prod as any).title || (prod as any).name}
                          </p>

                          <p className="text-sm font-extrabold text-indigo-700 mt-1">
                            {Number(prod.price).toLocaleString()} ETB
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => onAddToCart(prod)}
                          className="shrink-0 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[11px] font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all duration-200"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 bg-white border border-indigo-100 rounded-2xl rounded-bl-md px-4 py-3 w-fit shadow-sm">
              <span className="text-indigo-600 text-sm">✦</span>

              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>

              <span className="text-xs text-slate-500">
                Thinking...
              </span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggestions */}
        <div className="px-4 py-3 bg-white border-t border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Try asking
          </p>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {['Best Deals', 'Under 3000 ETB', 'Electronics'].map((chip) => (
              <button
                key={chip}
                type="button"
                disabled={isTyping}
                onClick={() => void handleSendQuery(chip)}
                className="shrink-0 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3.5 py-2 rounded-full transition-all duration-200 hover:border-indigo-200 disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <form
          onSubmit={handleFormSubmit}
          className="p-4 bg-white border-t border-slate-100"
        >
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all duration-200">
            <input
              type="text"
              placeholder="Ask me anything about products..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              aria-label="Send message"
              className="w-10 h-10 shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-md shadow-indigo-200 transition-all duration-200 active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </div>

          <p className="text-center text-[10px] text-slate-400 mt-2.5">
            Powered by SmartMarket AI
          </p>
        </form>
      </div>
    </div>
  );
};

export default AIAssistantModal;
