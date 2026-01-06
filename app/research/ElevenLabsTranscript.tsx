// =============================================================================
// ElevenLabs Real-Time Transcript Component
// =============================================================================
// Uses @elevenlabs/react SDK onMessage callback for real-time updates
// Displays chat bubbles with auto-scroll
// =============================================================================

'use client';

import { useConversation, type Role } from '@elevenlabs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

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
}: TranscriptProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  // ElevenLabs conversation hook
  const conversation = useConversation({
    onMessage: ({ message, source }: { message: string; source: Role }) => {
      const role = source === 'ai' ? 'agent' : 'user';
      
      setMessages(prev => {
        // Check if we're updating a tentative message
        const lastMessage = prev[prev.length - 1];
        
        if (lastMessage && lastMessage.role === role && !lastMessage.isFinal) {
          // Update the tentative message
          return [
            ...prev.slice(0, -1),
            { ...lastMessage, content: message, isFinal: true }
          ];
        }
        
        // Split message by newlines to create separate bubbles
        const lines = message.split('\n').filter(line => line.trim() !== '');
        
        // If it's a single line, add as one message
        if (lines.length <= 1) {
          return [
            ...prev,
            {
              id: `${Date.now()}-${Math.random()}`,
              role,
              content: message,
              timestamp: new Date(),
              isFinal: true,
            }
          ];
        }
        
        // Multiple lines - create separate bubbles
        const timestamp = new Date();
        const newMessages = lines.map((line, index) => ({
          id: `${Date.now()}-${Math.random()}-${index}`,
          role,
          content: line,
          timestamp: new Date(timestamp.getTime() + index * 100), // Slight timestamp offset
          isFinal: true,
        }));
        
        return [...prev, ...newMessages];
      });
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
    },
    onDisconnect: () => {
      setIsStarted(false);
      if (onConversationEnd) {
        onConversationEnd(messages);
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
        await conversation.startSession({ agentId });
      } else {
        throw new Error('Either signedUrl or agentId is required');
      }
      
      setIsStarted(true);
      setMessages([]);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      alert('Please allow microphone access to start the conversation.');
    }
  }, [conversation, agentId, signedUrl]);
  
  // Stop conversation
  const handleStop = useCallback(async () => {
    await conversation.endSession();
    setIsStarted(false);
    if (onConversationEnd) {
      onConversationEnd(messages);
    }
  }, [conversation, messages, onConversationEnd]);
  
  return (
    <div className={`flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">
            {agentAvatar}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{agentName}</h3>
            <StatusIndicator 
              status={conversation.status} 
              isSpeaking={conversation.isSpeaking} 
            />
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
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

