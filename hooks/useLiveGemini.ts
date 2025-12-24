import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ChatMessage, ConnectionState } from '../types';
import { createPcmBlob, decode, decodeAudioData } from '../utils/audio-utils';

const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';
const SYSTEM_INSTRUCTION = `You are "TechFlow Support", a professional, empathetic, and efficient technical support agent for a SaaS platform. 
Your goal is to help the user with their technical issues regarding the TechFlow dashboard, billing, or API integrations.
Keep your responses concise and conversational, suitable for a voice call. 
If you don't know the answer, politely offer to escalate the ticket.
Start by introducing yourself briefly.`;

export const useLiveGemini = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [volume, setVolume] = useState<number>(0); // For visualizer

  // Audio Contexts and Nodes
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Playback Timing
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Session
  const sessionRef = useRef<Promise<any> | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);

  // Transcription Buffers
  const currentInputTransRef = useRef<string>('');
  const currentOutputTransRef = useRef<string>('');

  const cleanupAudio = useCallback(() => {
    // Stop all playing sources
    audioSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) { /* ignore */ }
    });
    audioSourcesRef.current.clear();

    // Disconnect and close input
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputSourceRef.current) {
      inputSourceRef.current.disconnect();
      inputSourceRef.current = null;
    }
    if (inputAudioContextRef.current?.state !== 'closed') {
      inputAudioContextRef.current?.close();
    }
    inputAudioContextRef.current = null;

    // Close output
    if (outputAudioContextRef.current?.state !== 'closed') {
      outputAudioContextRef.current?.close();
    }
    outputAudioContextRef.current = null;
    
    setVolume(0);
  }, []);

  const disconnect = useCallback(async () => {
    if (sessionRef.current) {
      try {
        const session = await sessionRef.current;
        session.close();
      } catch (e) {
        console.error("Error closing session:", e);
      }
    }
    sessionRef.current = null;
    cleanupAudio();
    setConnectionState(ConnectionState.DISCONNECTED);
  }, [cleanupAudio]);

  const connect = useCallback(async () => {
    try {
      setConnectionState(ConnectionState.CONNECTING);

      // 1. Setup Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // 2. Setup Audio Analysis (Visualizer)
      analyserRef.current = outputAudioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      outputGainRef.current = outputAudioContextRef.current.createGain();
      outputGainRef.current.connect(analyserRef.current);
      analyserRef.current.connect(outputAudioContextRef.current.destination);

      // 3. Setup Mic Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      inputSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);

      // 4. Initialize Gemini Client
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const config = {
        model: MODEL_NAME,
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Session Opened");
            setConnectionState(ConnectionState.CONNECTED);
            
            // Connect audio pipeline only after session opens
            if (inputSourceRef.current && processorRef.current && inputAudioContextRef.current) {
                inputSourceRef.current.connect(processorRef.current);
                processorRef.current.connect(inputAudioContextRef.current.destination);
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcription
            if (message.serverContent?.outputTranscription) {
              currentOutputTransRef.current += message.serverContent.outputTranscription.text;
            } else if (message.serverContent?.inputTranscription) {
              currentInputTransRef.current += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              const userText = currentInputTransRef.current;
              const modelText = currentOutputTransRef.current;
              
              if (userText) {
                setMessages(prev => [...prev, {
                  id: Date.now().toString() + '-user',
                  role: 'user',
                  text: userText,
                  timestamp: new Date(),
                  isComplete: true
                }]);
              }
              if (modelText) {
                 setMessages(prev => [...prev, {
                  id: Date.now().toString() + '-model',
                  role: 'model',
                  text: modelText,
                  timestamp: new Date(),
                  isComplete: true
                }]);
              }
              
              currentInputTransRef.current = '';
              currentOutputTransRef.current = '';
            }

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current && outputGainRef.current) {
              const ctx = outputAudioContextRef.current;
              const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputGainRef.current);
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              
              audioSourcesRef.current.add(source);
              source.onended = () => audioSourcesRef.current.delete(source);
            }

            // Handle Interruptions
            if (message.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(s => s.stop());
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              currentOutputTransRef.current = ''; // Clear partial text on interrupt
            }
          },
          onerror: (e: any) => {
            console.error("Gemini Live Error", e);
            setConnectionState(ConnectionState.ERROR);
            disconnect();
          },
          onclose: () => {
            console.log("Gemini Live Session Closed");
            if (connectionState === ConnectionState.CONNECTED) {
                setConnectionState(ConnectionState.DISCONNECTED);
            }
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: SYSTEM_INSTRUCTION,
          inputAudioTranscription: { model: 'gemini-2.5-flash-latest' },
          outputAudioTranscription: { model: 'gemini-2.5-flash-latest' },
        }
      };

      // 5. Connect
      sessionRef.current = ai.live.connect(config);
      
      // 6. Setup Audio Processing Callback
      if (processorRef.current) {
        processorRef.current.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const blob = createPcmBlob(inputData);
            
            // Calculate volume for local visualizer
            let sum = 0;
            for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
            const rms = Math.sqrt(sum / inputData.length);
            setVolume(Math.min(1, rms * 5)); // Boost generic volume for visual

            if (sessionRef.current) {
                sessionRef.current.then(session => {
                    session.sendRealtimeInput({ media: blob });
                });
            }
        };
      }

    } catch (error) {
      console.error("Connection failed:", error);
      setConnectionState(ConnectionState.ERROR);
      cleanupAudio();
    }
  }, [disconnect, cleanupAudio, connectionState]);

  // Visualizer loop for output audio
  useEffect(() => {
      let rafId: number;
      const updateVolume = () => {
          if (analyserRef.current && connectionState === ConnectionState.CONNECTED) {
              const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
              analyserRef.current.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                  sum += dataArray[i];
              }
              const average = sum / dataArray.length;
              // Mix input volume and output volume for a responsive UI
              setVolume(prev => Math.max(prev, average / 128));
          }
          rafId = requestAnimationFrame(updateVolume);
      };
      updateVolume();
      return () => cancelAnimationFrame(rafId);
  }, [connectionState]);

  return {
    connect,
    disconnect,
    connectionState,
    messages,
    volume
  };
};