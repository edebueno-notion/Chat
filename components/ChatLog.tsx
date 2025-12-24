import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { User, Bot } from 'lucide-react';

interface ChatLogProps {
  messages: ChatMessage[];
}

const ChatLog: React.FC<ChatLogProps> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60">
        <Bot size={48} className="mb-4 text-slate-600" />
        <p className="text-sm">No conversation yet.</p>
        <p className="text-xs">Start a call to chat with TechFlow Support.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto scrollbar-hide">
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        return (
          <div
            key={msg.id}
            className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`
              flex gap-3 max-w-[85%] 
              ${isUser ? 'flex-row-reverse' : 'flex-row'}
            `}>
              <div className={`
                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                ${isUser ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-cyan-400'}
              `}>
                {isUser ? <User size={14} /> : <Bot size={14} />}
              </div>
              
              <div className={`
                flex flex-col
                ${isUser ? 'items-end' : 'items-start'}
              `}>
                <div className={`
                  py-2 px-4 rounded-2xl text-sm leading-relaxed
                  ${isUser 
                    ? 'bg-cyan-600 text-white rounded-tr-sm' 
                    : 'bg-slate-700 text-slate-200 rounded-tl-sm'
                  }
                `}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatLog;