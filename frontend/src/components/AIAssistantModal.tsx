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

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  if (!isOpen) return null;

  const handleSendQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: queryText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(async () => {
      const response = await processUserQuery(queryText, products);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: response.text,
        recommendedProducts: response.products,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 500);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendQuery(input);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end p-2 sm:p-4 transition-opacity">
      <div className="bg-white w-full max-w-md h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 text-white p-4 flex justify-between items-center shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
              ✨
            </div>
            <div>
              <h3 className="font-bold text-sm">SmartMarket AI Assistant</h3>
              <p className="text-[11px] text-indigo-200">Online & Ready to Help</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-white hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Message Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl shadow-2xs ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 border border-gray-200/80 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>

              {/* Recommended Items */}
              {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                <div className="mt-2 space-y-2 w-full max-w-[88%]">
                  {msg.recommendedProducts.map((prod) => (
                    <div 
                      key={prod.id} 
                      className="bg-white border border-indigo-100/80 p-2.5 rounded-xl shadow-xs flex justify-between items-center gap-3 hover:border-indigo-300 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {((prod as any).image_url || (prod as any).image) && (
                          <img 
                            src={(prod as any).image_url || (prod as any).image} 
                            alt={(prod as any).title || (prod as any).name} 
                            className="w-10 h-10 object-contain rounded-lg bg-gray-50 border p-1"
                          />
                        )}
                        <div className="truncate">
                          <p className="font-bold text-gray-900 text-xs truncate">
                            {(prod as any).title || (prod as any).name}
                          </p>
                          <p className="text-indigo-600 font-extrabold text-xs">
                            {prod.price} ETB
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => onAddToCart(prod)}
                        className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition shrink-0 shadow-xs"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-indigo-600 text-[11px] font-medium italic bg-indigo-50/50 p-2 rounded-xl w-fit">
              <span className="animate-pulse">✨</span> Thinking...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-2 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto no-scrollbar">
          {['Best Deals', 'Under 3000 ETB', 'Electronics'].map((chip) => (
            <button
              key={chip}
              onClick={() => handleSendQuery(chip)}
              className="text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition border border-indigo-100"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Form Input */}
        <form onSubmit={handleFormSubmit} className="p-3 bg-white border-t border-gray-200 flex gap-2">
          <input
            type="text"
            placeholder="Ask about products or deals..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 border border-gray-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none transition bg-gray-50 focus:bg-white"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};