import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, ShieldCheck, Sparkles, User, Bot } from 'lucide-react';
import { ChatMessage } from '../types';
import { CHAT_KNOWLEDGE_BASE } from '../data/mockData';

export const LiveChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'support',
      text: 'Dia duit! Welcome to OCI Sports GAA Support. How can we help you gear up for your next club or county clash?',
      time: 'Just now',
      quickReplies: [
        'Best glove for wet rain?',
        'How to measure hand size?',
        'Club bulk 20% off code',
        'How do I care for my gloves?'
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const content = textToSend || inputText;
    if (!content.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: content.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    // Simulate smart GAA gear response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const lower = content.toLowerCase();
      let replyText = CHAT_KNOWLEDGE_BASE['default'];

      if (lower.includes('wet') || lower.includes('rain') || lower.includes('weather') || lower.includes('water')) {
        replyText = CHAT_KNOWLEDGE_BASE['wet'];
      } else if (lower.includes('size') || lower.includes('measure') || lower.includes('fit') || lower.includes('hand')) {
        replyText = CHAT_KNOWLEDGE_BASE['size'];
      } else if (lower.includes('club') || lower.includes('bulk') || lower.includes('discount') || lower.includes('code') || lower.includes('team')) {
        replyText = CHAT_KNOWLEDGE_BASE['club'];
      } else if (lower.includes('deliver') || lower.includes('shipping') || lower.includes('dispatch') || lower.includes('dpd') || lower.includes('post')) {
        replyText = CHAT_KNOWLEDGE_BASE['delivery'];
      } else if (lower.includes('wash') || lower.includes('care') || lower.includes('clean') || lower.includes('dry')) {
        replyText = CHAT_KNOWLEDGE_BASE['care'];
      } else if (lower.includes('contact') || lower.includes('phone') || lower.includes('email')) {
        replyText = CHAT_KNOWLEDGE_BASE['contact'];
      }

      const botMsg: ChatMessage = {
        id: `support-${Date.now()}`,
        sender: 'support',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickReplies: ['Check Sizing Calculator', 'View Apex Gold Gloves', 'Track My Order']
      };

      setMessages((prev) => [...prev, botMsg]);
    }, 850);
  };

  return (
    <aside aria-label="Support Assistant" className="fixed bottom-5 right-5 z-40">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          id="open-live-chat-btn"
          onClick={() => setIsOpen(true)}
          className="relative p-3.5 sm:p-4 rounded-full bg-gradient-to-r from-[#d4af37] via-[#f5df88] to-[#d4af37] text-black shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer group border-2 border-black"
          aria-label="Open Live Chat Support"
        >
          <MessageSquare className="w-6 h-6 text-black" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-black" />
          <span className="hidden sm:inline-block ml-2 font-black text-xs uppercase tracking-wider pr-1">
            GAA Gear Help
          </span>
        </button>
      )}

      {/* Expanded Chat Box */}
      {isOpen && (
        <div
          id="live-chat-panel"
          className="w-[92vw] sm:w-96 h-[500px] max-h-[80vh] bg-[#111114] border border-zinc-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 text-white"
        >
          {/* Header */}
          <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-zinc-800 to-black border border-[#d4af37] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#d4af37]" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-black" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5 font-['Outfit']">
                  <span>OCI Gear Specialist</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.2 rounded">
                    Live
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400">Irish GAA Sizing & Tech Support</div>
              </div>
            </div>

            <button
              id="close-live-chat-btn"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#09090b]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-end gap-1.5 max-w-[85%]">
                  {msg.sender === 'support' && (
                    <div className="w-6 h-6 rounded-full bg-zinc-800 border border-[#d4af37]/40 flex items-center justify-center shrink-0 mb-1 text-[#d4af37]">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#d4af37] text-black font-semibold rounded-br-none'
                        : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>

                <span className="text-[10px] text-zinc-500 mt-1 px-1">{msg.time}</span>

                {/* Quick Reply Pills */}
                {msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.quickReplies.map((qr, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(qr)}
                        className="text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-[#d4af37] hover:text-black text-zinc-300 border border-zinc-800 transition-colors"
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                <div className="w-2 h-2 rounded-full bg-[#d4af37] animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-[#d4af37] animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-[#d4af37] animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] text-zinc-500 ml-1">OCI Gear Tech is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask about sizing, grip, wet pitch..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white focus:border-[#d4af37] outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-[#d4af37] text-black hover:bg-[#f5df88] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </aside>
  );
};
