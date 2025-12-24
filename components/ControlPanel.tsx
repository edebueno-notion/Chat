import React from 'react';
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from 'lucide-react';
import { ConnectionState } from '../types';

interface ControlPanelProps {
  connectionState: ConnectionState;
  onConnect: () => void;
  onDisconnect: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ connectionState, onConnect, onDisconnect }) => {
  const isConnecting = connectionState === ConnectionState.CONNECTING;
  const isConnected = connectionState === ConnectionState.CONNECTED;

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        <button
          onClick={onDisconnect}
          className="group relative flex items-center justify-center h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          title="End Call"
        >
          <PhoneOff size={24} />
          <span className="absolute -bottom-8 text-xs text-red-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            End Call
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={onConnect}
        disabled={isConnecting}
        className={`
          group relative flex items-center justify-center h-16 w-16 rounded-full 
          shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all
          focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900
          ${isConnecting 
            ? 'bg-slate-700 cursor-not-allowed' 
            : 'bg-cyan-500 hover:bg-cyan-400 hover:scale-110 active:scale-95 text-white'
          }
        `}
        title="Start Support Call"
      >
        {isConnecting ? (
          <Loader2 size={28} className="animate-spin text-cyan-300" />
        ) : (
          <>
            <Phone size={28} className="fill-current" />
            <span className="absolute inset-0 rounded-full animate-ping bg-cyan-400 opacity-20 pointer-events-none"></span>
          </>
        )}
      </button>
      <div className="text-slate-400 text-sm font-medium">
        {isConnecting ? 'Connecting to Agent...' : 'Tap to Speak with Support'}
      </div>
    </div>
  );
};

export default ControlPanel;