import React from 'react';
import { useLiveGemini } from './hooks/useLiveGemini';
import ControlPanel from './components/ControlPanel';
import ChatLog from './components/ChatLog';
import Visualizer from './components/Visualizer';
import { ConnectionState } from './types';
import { Headset, ShieldCheck, Wifi, WifiOff, LayoutDashboard } from 'lucide-react';

const App: React.FC = () => {
  const { connect, disconnect, connectionState, messages, volume } = useLiveGemini();

  const isConnected = connectionState === ConnectionState.CONNECTED;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row overflow-hidden">
      
      {/* Sidebar / Navigation (Simulated SaaS) */}
      <div className="hidden md:flex flex-col w-64 bg-slate-950 border-r border-slate-800 p-6 gap-8">
        <div className="flex items-center gap-3 text-cyan-400 font-bold text-xl tracking-tight">
          <div className="w-8 h-8 rounded bg-cyan-500/10 flex items-center justify-center">
            <LayoutDashboard size={20} />
          </div>
          TechFlow
        </div>

        <nav className="flex flex-col gap-2">
          {['Dashboard', 'Analytics', 'Users', 'Settings'].map((item) => (
            <div key={item} className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-slate-900 hover:text-cyan-400 rounded-lg cursor-pointer transition-colors text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-slate-700" />
              {item}
            </div>
          ))}
          <div className="flex items-center gap-3 px-3 py-2 text-white bg-slate-800 rounded-lg cursor-pointer transition-colors text-sm font-medium shadow-sm border border-slate-700/50">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
            Support Center
          </div>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-xs font-bold shadow-lg">
              JS
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-200">John Smith</span>
              <span className="text-xs text-slate-500">Enterprise Plan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-[100dvh]">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-100">Live Support</h1>
            <div className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
              isConnected 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            } flex items-center gap-1.5`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              {isConnected ? 'Agent Active' : 'Offline'}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
            <div className="flex items-center gap-2">
              {connectionState === ConnectionState.CONNECTED ? <Wifi size={14} className="text-emerald-500"/> : <WifiOff size={14} />}
              <span>{connectionState}</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-slate-800" />
            <div className="hidden sm:flex items-center gap-1.5">
               <ShieldCheck size={14} className="text-cyan-500" />
               <span>Secure Connection</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
            
            {/* Center Stage: Chat or Voice Interface */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
              
              {/* Background Glow */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                 <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[100px] transition-all duration-1000 ${isConnected ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`} />
              </div>

              {/* Chat Container */}
              <div className="w-full max-w-2xl flex-1 mb-24 md:mb-32 relative z-0">
                  <div className="absolute inset-0 bg-slate-800/20 rounded-2xl border border-slate-800/50 backdrop-blur-sm overflow-hidden">
                     <ChatLog messages={messages} />
                  </div>
              </div>

              {/* Bottom Fixed Control Area */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-900/95 to-transparent z-10 flex flex-col items-center gap-6">
                 
                 {/* Visualizer (Only visible when connected) */}
                 <div className={`transition-all duration-500 ease-out ${isConnected ? 'opacity-100 translate-y-0 h-12' : 'opacity-0 translate-y-4 h-0'}`}>
                    <Visualizer volume={volume} isActive={isConnected} />
                 </div>

                 {/* Main Button */}
                 <ControlPanel 
                   connectionState={connectionState} 
                   onConnect={connect}
                   onDisconnect={disconnect}
                 />

                 <div className="text-center">
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Powered by Gemini 2.5 Native Audio Live API. 
                      Support conversations are transcribed for quality assurance.
                    </p>
                 </div>
              </div>

            </div>
        </main>
      </div>
    </div>
  );
};

export default App;