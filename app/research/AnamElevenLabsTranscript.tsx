// =============================================================================
// Anam + ElevenLabs Integrated Transcript Component
// =============================================================================
// Uses direct WebSocket connection to ElevenLabs for audio chunk access
// Integrates with Anam avatar for real-time lip-sync
// Based on: https://docs.anam.ai/third-party-integrations/elevenlabs
// =============================================================================

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@anam-ai/js-sdk';
import { ElevenLabsWebSocketClient, type ElevenLabsCallbacks } from '@/lib/elevenlabs-websocket';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

interface TranscriptProps {
  agentId: string;
  agentName?: string;
  onConversationEnd?: (messages: Message[]) => void;
  className?: string;
}

// -----------------------------------------------------------------------------
// Chat Bubble Component
// -----------------------------------------------------------------------------

function ChatBubble({ 
  message, 
  agentName = 'Nova',
}: { 
  message: Message; 
  agentName?: string;
}) {
  const isAgent = message.role === 'agent';
  
  return (
    <div className={`flex gap-3 ${isAgent ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[75%]`}>
        <div className={`flex items-center gap-2 mb-1 ${isAgent ? '' : 'justify-end'}`}>
          <span className="text-xs font-medium text-gray-600">
            {isAgent ? agentName : 'You'}
          </span>
          <span className="text-xs text-gray-400">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <div
          className={`
            px-4 py-2.5 rounded-2xl text-sm leading-relaxed
            ${isAgent 
              ? 'bg-gray-100 text-gray-800 rounded-tl-sm' 
              : 'bg-blue-600 text-white rounded-tr-sm'
            }
          `}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export function AnamElevenLabsTranscript({
  agentId,
  agentName = 'Nova',
  onConversationEnd,
  className = '',
}: TranscriptProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [avatarReady, setAvatarReady] = useState(false);
  const [status, setStatus] = useState<string>('disconnected');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  
  const anamClientRef = useRef<any>(null);
  const audioInputStreamRef = useRef<any>(null);
  const elevenLabsClientRef = useRef<ElevenLabsWebSocketClient | null>(null);
  
  // Auto-scroll to top (since messages are reversed)
  useEffect(() => {
    if (messages.length > 0) {
      // Scroll to top to show newest message
      const container = messagesEndRef.current?.parentElement;
      if (container) {
        container.scrollTop = 0;
      }
    }
  }, [messages]);
  
  // Cleanup on unmount to prevent Anam concurrency limit errors
  useEffect(() => {
    return () => {
      if (anamClientRef.current) {
        try {
          anamClientRef.current.stopStreaming();
          console.log('🧹 Cleaned up Anam session on unmount');
        } catch (err) {
          console.warn('Error cleaning up Anam session:', err);
        }
      }
      if (elevenLabsClientRef.current) {
        try {
          elevenLabsClientRef.current.disconnect();
          console.log('🧹 Cleaned up ElevenLabs connection on unmount');
        } catch (err) {
          console.warn('Error cleaning up ElevenLabs:', err);
        }
      }
    };
  }, []);
  
  // Initialize Anam avatar
  const initializeAvatar = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      console.log('Initializing Anam avatar...');
      
      // Get Anam session token
      const response = await fetch('/api/anam-session');
      if (!response.ok) {
        throw new Error('Failed to get Anam session token');
      }
      
      const { sessionToken } = await response.json();
      
      // Create Anam client with audio passthrough
      const anamClient = createClient(sessionToken, {
        disableInputAudio: true, // ElevenLabs handles microphone
      });
      
      // Stream to video element (pass ID string, not element object)
      await anamClient.streamToVideoElement('anam-avatar-video');
      
      // Create audio input stream for lip-sync
      const audioInputStream = anamClient.createAgentAudioInputStream({
        encoding: 'pcm_s16le',
        sampleRate: 16000,
        channels: 1,
      });
      
      anamClientRef.current = anamClient;
      audioInputStreamRef.current = audioInputStream;
      setAvatarReady(true);
      
      console.log('✅ Anam avatar ready');
    } catch (error: any) {
      console.error('Failed to initialize Anam:', error);
      
      // Check for concurrency limit error
      if (error?.message?.includes('Concurrency limit') || error?.statusCode === 429) {
        console.error('⚠️ CONCURRENCY LIMIT: Close other Anam sessions (e.g., /anam-simple-test.html) and try again');
        alert('❌ Anam concurrency limit reached!\n\nPlease:\n1. Close other tabs with Anam avatars\n2. Refresh this page\n3. Try again\n\nNote: Free tier allows only 1 active session at a time.');
      }
      
      setAvatarReady(false);
    }
  }, []);
  
  // Start conversation
  const handleStart = useCallback(async () => {
    try {
      setStatus('connecting');
      
      // Initialize avatar first
      await initializeAvatar();
      
      // Set up ElevenLabs callbacks
      const callbacks: ElevenLabsCallbacks = {
        onReady: () => {
          console.log('✅ ElevenLabs ready');
          setStatus('connected');
          setIsStarted(true);
        },
        
        onAudio: (base64Audio) => {
          // Forward audio to Anam for lip-sync
          if (audioInputStreamRef.current) {
            audioInputStreamRef.current.sendAudioChunk(base64Audio);
          }
        },
        
        onUserTranscript: (text) => {
          const newMessage: Message = {
            id: `${Date.now()}-user`,
            role: 'user',
            content: text,
            timestamp: new Date(),
          };
          setMessages(prev => {
            const updated = [...prev, newMessage];
            messagesRef.current = updated;
            return updated;
          });
        },
        
        onAgentResponse: (text) => {
          // Split by lines for multiple bubbles
          const lines = text.split('\n').filter(line => line.trim() !== '');
          
          const newMessages: Message[] = lines.map((line, index) => ({
            id: `${Date.now()}-agent-${index}`,
            role: 'agent',
            content: line,
            timestamp: new Date(Date.now() + index * 100),
          }));
          
          setMessages(prev => {
            const updated = [...prev, ...newMessages];
            messagesRef.current = updated;
            return updated;
          });
          
          // Signal end of audio sequence to Anam
          if (audioInputStreamRef.current) {
            audioInputStreamRef.current.endSequence();
          }
        },
        
        onInterrupt: () => {
          // Handle user interruption
          if (audioInputStreamRef.current) {
            audioInputStreamRef.current.endSequence();
          }
        },
        
        onDisconnect: () => {
          setStatus('disconnected');
          setIsStarted(false);
          if (onConversationEnd) {
            onConversationEnd(messagesRef.current);
          }
        },
        
        onError: (error) => {
          console.error('ElevenLabs error:', error);
          setStatus('error');
        },
      };
      
      // Connect to ElevenLabs
      const client = new ElevenLabsWebSocketClient(agentId, callbacks);
      await client.connect();
      elevenLabsClientRef.current = client;
      
    } catch (error) {
      console.error('Failed to start:', error);
      alert('Failed to start conversation. Please check microphone permissions.');
      setStatus('disconnected');
    }
  }, [agentId, onConversationEnd, initializeAvatar]);
  
  // Stop conversation
  const handleStop = useCallback(() => {
    if (elevenLabsClientRef.current) {
      elevenLabsClientRef.current.disconnect();
      elevenLabsClientRef.current = null;
    }
    setIsStarted(false);
    if (onConversationEnd) {
      onConversationEnd(messagesRef.current);
    }
  }, [onConversationEnd]);
  
  return (
    <div className={`flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-semibold text-gray-800">{agentName}</h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                status === 'connected' ? 'bg-green-400 animate-pulse' :
                status === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                'bg-gray-400'
              }`} />
              <span className="text-xs text-gray-600">
                {status === 'connected' ? 'Connected' :
                 status === 'connecting' ? 'Connecting...' :
                 'Disconnected'}
              </span>
              {avatarReady && <span className="text-xs text-green-600 ml-2">✓ Avatar ready</span>}
            </div>
          </div>
        </div>
        
        {/* Control Button */}
        {!isStarted ? (
          <button
            onClick={handleStart}
            disabled={status === 'connecting'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm disabled:opacity-50"
          >
            Start Conversation
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium text-sm"
          >
            End
          </button>
        )}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Avatar Video - Sticky at Top */}
        <div className="sticky top-0 z-10 h-64 bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4 relative border-b-2 border-gray-700">
          <video
            id="anam-avatar-video"
            ref={videoRef}
            autoPlay
            playsInline
            className="h-full object-contain rounded-lg"
            style={{ transform: 'scaleX(-1)' }}
          />
          {!avatarReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
              <div className="text-white text-center">
                <div className="animate-spin text-4xl mb-2">🔄</div>
                <p>Loading avatar...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Messages - Scrollable Below Avatar (Newest First) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 flex flex-col-reverse">
          {/* Messages render in reverse order - newest at top */}
          {messages.map((message) => (
            <ChatBubble 
              key={message.id} 
              message={message} 
              agentName={agentName}
            />
          ))}
          
          {/* Empty state messages */}
          {messages.length === 0 && !isStarted && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="text-4xl mb-2">🎙️</div>
              <p>Click "Start Conversation" to begin</p>
            </div>
          )}
          
          {messages.length === 0 && isStarted && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="animate-pulse text-2xl mb-2">🎧</div>
              <p>Waiting for {agentName}...</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      {isStarted && (
        <div className="px-4 py-3 border-t bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            Speaking with {agentName} 🎤
          </p>
        </div>
      )}
    </div>
  );
}

export default AnamElevenLabsTranscript;

