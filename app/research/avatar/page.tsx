// =============================================================================
// Avatar Integration Test Page
// =============================================================================
// Test page for Anam + ElevenLabs direct WebSocket integration
// URL: /research/avatar
// =============================================================================

'use client';

import { useState, useCallback } from 'react';
import { AnamElevenLabsTranscript } from '../AnamElevenLabsTranscript';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export default function AvatarTestPage() {
  const [showTranscript, setShowTranscript] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  
  const handleConversationEnd = useCallback((messages: Message[]) => {
    console.log('Conversation ended with', messages.length, 'messages');
    setMessageCount(messages.length);
    setShowTranscript(false);
  }, []);
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-4">
      {/* Test Banner */}
      <div className="fixed top-0 left-0 right-0 bg-purple-600 text-white text-center py-2 text-sm font-medium z-50">
        🧪 Avatar Integration Test Page - Direct WebSocket Implementation
      </div>
      
      <div className="max-w-6xl mx-auto pt-16">
        {!showTranscript ? (
          <div className="max-w-xl mx-auto text-center space-y-6">
            <div className="text-6xl mb-4">🤖</div>
            
            <h1 className="text-3xl font-bold text-gray-800">
              Test Anam Avatar Integration
            </h1>
            
            <p className="text-lg text-gray-600">
              This page tests the direct WebSocket integration between
              ElevenLabs and Anam for real-time avatar lip-sync.
            </p>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-left text-sm">
              <p className="font-semibold mb-2">What's Different:</p>
              <ul className="space-y-1 text-gray-700">
                <li>✅ Direct WebSocket API (not React SDK)</li>
                <li>✅ Raw audio chunks for avatar lip-sync</li>
                <li>✅ Real-time transcript alongside avatar</li>
                <li>✅ Based on Anam's official integration guide</li>
              </ul>
            </div>
            
            {messageCount > 0 && (
              <div className="bg-green-50 rounded-lg p-4 text-green-800">
                <p className="font-medium">
                  Last conversation: {messageCount} messages recorded
                </p>
              </div>
            )}
            
            <button
              onClick={() => setShowTranscript(true)}
              className="px-8 py-4 bg-purple-600 text-white rounded-xl text-lg font-semibold hover:bg-purple-700 transition shadow-lg hover:shadow-xl"
            >
              Start Test Conversation →
            </button>
            
            <div className="pt-4">
              <a 
                href="/research"
                className="text-purple-600 hover:underline text-sm"
              >
                ← Back to regular research page
              </a>
            </div>
          </div>
        ) : (
          <div>
            <AnamElevenLabsTranscript
              agentId={process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || ''}
              agentName="Nova"
              onConversationEnd={handleConversationEnd}
              className="h-[700px]"
            />
            
            <div className="text-center mt-4 space-y-2">
              <p className="text-sm text-gray-500">
                Testing direct WebSocket integration
              </p>
              <button
                onClick={() => {
                  setShowTranscript(false);
                }}
                className="text-purple-600 hover:underline text-sm"
              >
                Exit test
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

