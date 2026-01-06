// =============================================================================
// ElevenLabs Real-Time Transcript Component
// =============================================================================
// Uses @elevenlabs/react SDK onMessage callback for real-time updates
// Displays chat bubbles with auto-scroll
// =============================================================================

'use client';

import { useConversation, type Role } from '@elevenlabs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@anam-ai/js-sdk';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  isFinal: boolean;
}

interface TranscriptProps {
  signedUrl?: string;
  agentId?: string;
  agentName?: string;
  agentAvatar?: string;
  onConversationEnd?: (messages: Message[]) => void;
  className?: string;
  enableAvatar?: boolean; // Enable Anam avatar integration
}

// -----------------------------------------------------------------------------
// Chat Bubble Component
// -----------------------------------------------------------------------------

function ChatBubble({ 
  message, 
  agentName = 'Nova',
  agentAvatar = '🤖'
}: { 
  message: Message; 
  agentName?: string;
  agentAvatar?: string;
}) {
  const isAgent = message.role === 'agent';
  
  return (
    <div className={`flex gap-3 ${isAgent ? 'justify-start' : 'justify-end'}`}>
      {/* Agent Avatar */}
      {isAgent && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-lg">
          {agentAvatar}
        </div>
      )}
      
      {/* Message Bubble */}
      <div className={`max-w-[75%] ${isAgent ? 'order-2' : 'order-1'}`}>
        {/* Header */}
        <div className={`flex items-center gap-2 mb-1 ${isAgent ? '' : 'justify-end'}`}>
          <span className="text-xs font-medium text-gray-600">
            {isAgent ? agentName : 'You'}
          </span>
          <span className="text-xs text-gray-400">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        {/* Bubble */}
        <div
          className={`
            px-4 py-2.5 rounded-2xl text-sm leading-relaxed
            ${isAgent 
              ? 'bg-gray-100 text-gray-800 rounded-tl-sm' 
              : 'bg-blue-600 text-white rounded-tr-sm'
            }
            ${!message.isFinal ? 'opacity-70' : ''}
          `}
        >
          {message.content}
          {!message.isFinal && (
            <span className="inline-block ml-1 animate-pulse">...</span>
          )}
        </div>
      </div>
      
      {/* User Avatar */}
      {!isAgent && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
          👤
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Status Indicator Component
// -----------------------------------------------------------------------------

function StatusIndicator({ 
  status, 
  isSpeaking 
}: { 
  status: string; 
  isSpeaking: boolean;
}) {
  const getStatusInfo = () => {
    if (status === 'disconnected') {
      return { text: 'Disconnected', color: 'bg-gray-400', pulse: false };
    }
    if (status === 'connecting') {
      return { text: 'Connecting...', color: 'bg-yellow-400', pulse: true };
    }
    if (isSpeaking) {
      return { text: 'Nova is speaking', color: 'bg-green-400', pulse: true };
    }
    return { text: 'Listening...', color: 'bg-blue-400', pulse: true };
  };
  
  const { text, color, pulse } = getStatusInfo();
  
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full">
      <div className={`w-2 h-2 rounded-full ${color} ${pulse ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-gray-600">{text}</span>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Transcript Component
// -----------------------------------------------------------------------------

export function ElevenLabsTranscript({
  signedUrl,
  agentId,
  agentName = 'Nova',
  agentAvatar = '🤖',
  onConversationEnd,
  className = '',
  enableAvatar = false,
}: TranscriptProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [avatarReady, setAvatarReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]); // Keep a ref to avoid stale closure
  const videoRef = useRef<HTMLVideoElement>(null);
  const anamClientRef = useRef<any>(null);
  const audioInputStreamRef = useRef<any>(null);
  
  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  // Initialize Anam avatar
  const initializeAvatar = useCallback(async () => {
    if (!enableAvatar || !videoRef.current) return;
    
    try {
      console.log('Initializing Anam avatar...');
      
      // Get Anam session token from our API
      const response = await fetch('/api/anam-session');
      if (!response.ok) {
        const error = await response.json();
        console.warn('Anam avatar disabled:', error.error);
        throw new Error(error.error || 'Failed to get Anam session token');
      }
      
      const { sessionToken } = await response.json();
      
      // Create Anam client in standard mode (not audio passthrough for now)
      // TODO: Implement audio passthrough once SDK issues are resolved
      const anamClient = createClient(sessionToken);
      
      // Stream avatar to video element (pass ID string, not element object)
      await anamClient.streamToVideoElement('elevenlabs-anam-video');
      
      anamClientRef.current = anamClient;
      // audioInputStreamRef.current = audioInputStream; // Not used in standard mode
      setAvatarReady(true);
      
      console.log('Anam avatar initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Anam avatar:', error);
      // Continue without avatar
      setAvatarReady(false);
    }
  }, [enableAvatar]);
  
  // Initialize avatar on component mount
  useEffect(() => {
    if (enableAvatar) {
      initializeAvatar();
    }
  }, [enableAvatar, initializeAvatar]);
  
  // ElevenLabs conversation hook
  const conversation = useConversation({
    onMessage: (payload) => {
      const role: 'user' | 'agent' = payload.source === 'ai' ? 'agent' : 'user';
      const message = payload.message;
      
      setMessages(prev => {
        let updatedMessages: Message[];
        
        // Check if we're updating a tentative message
        const lastMessage = prev[prev.length - 1];
        
        if (lastMessage && lastMessage.role === role && !lastMessage.isFinal) {
          // Update the tentative message
          updatedMessages = [
            ...prev.slice(0, -1),
            { ...lastMessage, content: message, isFinal: true }
          ];
        } else {
          // Split message by newlines to create separate bubbles
          const lines = message.split('\n').filter(line => line.trim() !== '');
          
          // If it's a single line, add as one message
          if (lines.length <= 1) {
            updatedMessages = [
              ...prev,
              {
                id: `${Date.now()}-${Math.random()}`,
                role,
                content: message,
                timestamp: new Date(),
                isFinal: true,
              }
            ];
          } else {
            // Multiple lines - create separate bubbles
            const timestamp = new Date();
            const newBubbles = lines.map((line, index) => ({
              id: `${Date.now()}-${Math.random()}-${index}`,
              role,
              content: line,
              timestamp: new Date(timestamp.getTime() + index * 100),
              isFinal: true,
            }));
            
            updatedMessages = [...prev, ...newBubbles];
          }
        }
        
        // Update the ref with the latest messages
        messagesRef.current = updatedMessages;
        return updatedMessages;
      });
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
    },
    onDisconnect: () => {
      console.log('Disconnected. Messages:', messagesRef.current.length);
      setIsStarted(false);
      if (onConversationEnd) {
        onConversationEnd(messagesRef.current);
      }
    },
  });
  
  // Start conversation
  const handleStart = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Use signedUrl if provided, otherwise use agentId
      if (signedUrl) {
        await conversation.startSession({ signedUrl });
      } else if (agentId) {
        await conversation.startSession({ 
          agentId,
          connectionType: 'webrtc' as any // Type workaround for SDK
        });
      } else {
        throw new Error('Either signedUrl or agentId is required');
      }
      
      setIsStarted(true);
      setMessages([]);
      messagesRef.current = [];
    } catch (error) {
      console.error('Failed to start conversation:', error);
      alert('Please allow microphone access to start the conversation.');
    }
  }, [conversation, agentId, signedUrl]);
  
  // Stop conversation
  const handleStop = useCallback(async () => {
    console.log('Manually ending conversation. Messages:', messagesRef.current.length);
    await conversation.endSession();
    setIsStarted(false);
    if (onConversationEnd) {
      onConversationEnd(messagesRef.current);
    }
  }, [conversation, onConversationEnd]);
  
  return (
    <div className={`flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          {!enableAvatar && (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">
              {agentAvatar}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-800">{agentName}</h3>
            <StatusIndicator 
              status={conversation.status} 
              isSpeaking={conversation.isSpeaking} 
            />
            {enableAvatar && avatarReady && (
              <span className="text-xs text-green-600">✓ Avatar ready</span>
            )}
          </div>
        </div>
        
        {/* Control Button */}
        {!isStarted ? (
          <button
            onClick={handleStart}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
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
      
      {/* Main Content Area */}
      <div className={`flex-1 flex ${enableAvatar ? 'flex-row' : 'flex-col'} overflow-hidden`}>
        {/* Avatar Video (if enabled) */}
        {enableAvatar && (
          <div className="w-1/2 bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
            <video
              id="elevenlabs-anam-video"
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover rounded-lg"
              style={{ transform: 'scaleX(-1)' }} // Mirror the video for natural appearance
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
        )}
        
        {/* Messages */}
        <div className={`${enableAvatar ? 'w-1/2' : 'w-full'} flex-1 overflow-y-auto p-4 space-y-4`}>
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
        
        {messages.map((message) => (
          <ChatBubble 
            key={message.id} 
            message={message} 
            agentName={agentName}
            agentAvatar={agentAvatar}
          />
        ))}
        
        <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Footer */}
      {isStarted && (
        <div className="px-4 py-3 border-t bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            {conversation.isSpeaking 
              ? `${agentName} is speaking... 🔊` 
              : 'Listening to you... 🎤'
            }
          </p>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Alternative: Standalone Chat Bubbles (No ElevenLabs SDK)
// Use this if you just need to display a transcript from your database
// -----------------------------------------------------------------------------

export function TranscriptViewer({ 
  messages,
  agentName = 'Nova',
  className = ''
}: { 
  messages: Array<{ role: 'user' | 'agent'; content: string; timestamp?: Date }>;
  agentName?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {messages.map((msg, index) => (
        <ChatBubble
          key={index}
          message={{
            id: String(index),
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp || new Date(),
            isFinal: true,
          }}
          agentName={agentName}
        />
      ))}
    </div>
  );
}

export default ElevenLabsTranscript;

