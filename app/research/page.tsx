'use client';

import { useState, useCallback } from 'react';
import { ElevenLabsTranscript } from './ElevenLabsTranscript';

interface ResearchPageProps {
  searchParams: {
    source?: string;
    campaign?: string;
    ref?: string;
  };
}

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  isFinal: boolean;
}

type ViewState = 'consent' | 'conversation' | 'complete';

// -----------------------------------------------------------------------------
// Consent Screen
// -----------------------------------------------------------------------------

function ConsentScreen({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="max-w-xl mx-auto text-center space-y-6">
      <div className="text-6xl">🎙️</div>
      
      <h1 className="text-3xl font-bold text-gray-800">
        Help Shape the Future of Product Transparency
      </h1>
      
      <p className="text-lg text-gray-600">
        We're building digital product passports for Europe.
        Before we build, we want to hear from you.
      </p>
      
      <div className="flex justify-center gap-6 text-sm text-gray-500 py-4">
        <span className="flex items-center gap-1">⏱️ 3 minutes</span>
        <span className="flex items-center gap-1">❓ 5 questions</span>
        <span className="flex items-center gap-1">🎁 Get the report</span>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 text-left">
        <p className="font-medium mb-2">Before you start:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Your responses will be used for research into product transparency</li>
          <li>Responses are anonymized and aggregated for analysis</li>
          <li>Your email (optional) is used only to send you the research results</li>
          <li>You can end the conversation at any time</li>
          <li>Data is stored securely in the EU</li>
        </ul>
      </div>
      
      <button
        onClick={onAccept}
        className="px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
      >
        I Agree — Start Conversation →
      </button>
      
      <p className="text-xs text-gray-400">
        A research project by Tabulas in collaboration with Howest and Thomas More
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Completion Screen
// -----------------------------------------------------------------------------

function CompletionScreen({ messageCount }: { messageCount: number }) {
  return (
    <div className="max-w-xl mx-auto text-center space-y-6">
      <div className="text-6xl">✅</div>
      
      <h1 className="text-3xl font-bold text-gray-800">
        Thank You!
      </h1>
      
      <p className="text-lg text-gray-600">
        Your responses have been recorded. We'll send you the research report
        when it's ready.
      </p>
      
      <div className="bg-green-50 rounded-lg p-4 text-green-800">
        <p className="font-medium">
          {messageCount} messages recorded in this conversation
        </p>
      </div>
      
      <div className="pt-4">
        <a 
          href="https://tabulas.eu"
          className="text-blue-600 hover:underline"
        >
          Learn more about Tabulas →
        </a>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Page Component
// -----------------------------------------------------------------------------

export default function ResearchPage({ searchParams }: ResearchPageProps) {
  const { source, campaign, ref } = searchParams;
  const [view, setView] = useState<ViewState>('consent');
  const [messageCount, setMessageCount] = useState(0);
  const [signedUrl, setSignedUrl] = useState<string>('');
  
  // Handle consent acceptance - get signed URL
  const handleAccept = useCallback(async () => {
    try {
      // Build URL with tracking params
      const params = new URLSearchParams();
      if (source) params.set('source', source);
      if (campaign) params.set('campaign', campaign);
      if (ref) params.set('ref', ref);

      // Get signed URL from our API
      const response = await fetch(
        `/api/elevenlabs-signed-url?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to get conversation URL');
      }

      const { signedUrl: url } = await response.json();
      setSignedUrl(url);
      setView('conversation');
    } catch (error) {
      console.error('Failed to get signed URL:', error);
      alert('Failed to start conversation. Please try again.');
    }
  }, [source, campaign, ref]);
  
  // Handle conversation end - save to database
  const handleConversationEnd = useCallback(async (messages: Message[]) => {
    setMessageCount(messages.length);
    setView('complete');
    
    // Optional: Send transcript to your API for additional processing
    try {
      await fetch('/api/research/save-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp.toISOString(),
          })),
          source: source || 'direct',
          campaign,
          ref,
        }),
      });
    } catch (error) {
      console.error('Failed to save transcript:', error);
      // Don't block user experience on error
    }
  }, [source, campaign, ref]);
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      {view === 'consent' && (
        <ConsentScreen onAccept={handleAccept} />
      )}
      
      {view === 'conversation' && (
        <div className="w-full max-w-lg">
          <ElevenLabsTranscript
            signedUrl={signedUrl}
            agentName="Nova"
            agentAvatar="🎙️"
            onConversationEnd={handleConversationEnd}
            className="h-[600px]"
          />
          
          <p className="text-center text-xs text-gray-400 mt-4">
            Having trouble? Make sure your microphone is enabled.
          </p>
        </div>
      )}
      
      {view === 'complete' && (
        <CompletionScreen messageCount={messageCount} />
      )}
    </main>
  );
}

