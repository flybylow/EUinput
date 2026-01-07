'use client';

import { useState, useCallback, useEffect } from 'react';
import { AnamElevenLabsTranscript } from './AnamElevenLabsTranscript';
import { DevTools } from './dev-tools';

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

type ViewState = 'consent' | 'conversation' | 'email' | 'complete';

// -----------------------------------------------------------------------------
// Consent Screen
// -----------------------------------------------------------------------------

function ConsentScreen({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="max-w-xl mx-auto text-center space-y-6">
      <div className="text-6xl">🎙️</div>
      
      <div>
        <p className="text-sm text-gray-500 mb-2">shape the future of</p>
        <h1 className="text-5xl font-bold text-gray-900">
          Product Transparency
        </h1>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 text-left">
        <p className="leading-relaxed">
          Your responses are anonymized and used for product transparency research. 
          You can end the conversation anytime. Data is stored securely in the EU.
        </p>
      </div>
      
      <button
        onClick={onAccept}
        className="px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
      >
        I Agree — Start Conversation →
      </button>
      
      <p className="text-xs text-gray-400">
        A research project by Tabulas
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Email Capture Screen
// -----------------------------------------------------------------------------

function EmailCapture({ 
  onSubmit,
  onSkip 
}: { 
  onSubmit: (email: string, country: string) => void;
  onSkip: () => void;
}) {
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [error, setError] = useState('');
  const [isDetecting, setIsDetecting] = useState(true);
  
  // Auto-detect country by IP
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.country_name) {
          setCountry(data.country_name);
        }
      } catch (err) {
        console.log('Could not detect country:', err);
      } finally {
        setIsDetecting(false);
      }
    };
    
    detectCountry();
  }, []);
  
  const handleSubmit = () => {
    // Basic validation
    if (!email) {
      setError('Please enter your email');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    setError('');
    onSubmit(email, country);
  };
  
  return (
    <div className="max-w-md mx-auto bg-white rounded-xl p-6 shadow-lg">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">✅</div>
        <h2 className="text-xl font-bold text-gray-800">Thanks for the talk!</h2>
        <p className="text-gray-500">
          I can send a report and stay in touch<br />
          if you leave your email.
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
        
        <div>
          <label className="block text-sm text-gray-600 mb-2">
            {isDetecting ? 'Detecting country...' : 'Country'}
          </label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            disabled={isDetecting}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-400 outline-none bg-white text-gray-900 cursor-pointer disabled:opacity-50"
          >
            <option value="">🌍 Select country</option>
            <option value="Netherlands">🇳🇱 Netherlands</option>
            <option value="Belgium">🇧🇪 Belgium</option>
            <option value="Germany">🇩🇪 Germany</option>
            <option value="France">🇫🇷 France</option>
            <option value="United Kingdom">🇬🇧 United Kingdom</option>
            <option disabled>──────────</option>
            <option value="Austria">🇦🇹 Austria</option>
            <option value="Bulgaria">🇧🇬 Bulgaria</option>
            <option value="Croatia">🇭🇷 Croatia</option>
            <option value="Cyprus">🇨🇾 Cyprus</option>
            <option value="Czech Republic">🇨🇿 Czech Republic</option>
            <option value="Denmark">🇩🇰 Denmark</option>
            <option value="Estonia">🇪🇪 Estonia</option>
            <option value="Finland">🇫🇮 Finland</option>
            <option value="Greece">🇬🇷 Greece</option>
            <option value="Hungary">🇭🇺 Hungary</option>
            <option value="Iceland">🇮🇸 Iceland</option>
            <option value="Ireland">🇮🇪 Ireland</option>
            <option value="Italy">🇮🇹 Italy</option>
            <option value="Latvia">🇱🇻 Latvia</option>
            <option value="Lithuania">🇱🇹 Lithuania</option>
            <option value="Luxembourg">🇱🇺 Luxembourg</option>
            <option value="Malta">🇲🇹 Malta</option>
            <option value="Norway">🇳🇴 Norway</option>
            <option value="Poland">🇵🇱 Poland</option>
            <option value="Portugal">🇵🇹 Portugal</option>
            <option value="Romania">🇷🇴 Romania</option>
            <option value="Slovakia">🇸🇰 Slovakia</option>
            <option value="Slovenia">🇸🇮 Slovenia</option>
            <option value="Spain">🇪🇸 Spain</option>
            <option value="Sweden">🇸🇪 Sweden</option>
            <option value="Switzerland">🇨🇭 Switzerland</option>
            <option value="Other">🌍 Other</option>
          </select>
        </div>
        
        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Send me the report →
        </button>
        
        <button
          onClick={onSkip}
          className="w-full py-2 text-gray-500 text-sm hover:underline"
        >
          Skip — I don't want the report
        </button>
      </div>
      
      <p className="text-xs text-gray-400 text-center mt-4">
        We only use your email to send the research results. No spam.
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Completion Screen
// -----------------------------------------------------------------------------

function CompletionScreen({ 
  messageCount,
  email,
  country
}: { 
  messageCount: number;
  email?: string;
  country?: string;
}) {
  return (
    <div className="max-w-xl mx-auto text-center space-y-6">
      <div className="text-6xl">🎉</div>
      
      <h1 className="text-3xl font-bold text-gray-800">
        Thank You!
      </h1>
      
      <p className="text-lg text-gray-600">
        Your responses have been recorded. 
        {email && " We'll send you the research report when it's ready."}
      </p>
      
      <div className="bg-green-50 rounded-lg p-4 text-green-800">
        <p className="font-medium">
          {messageCount} messages recorded in this conversation
        </p>
      </div>
      
      {(email || country) && (
        <div className="bg-gray-50 rounded-lg p-4 text-left text-sm space-y-1">
          {email && <p><span className="text-gray-400">Email:</span> {email}</p>}
          {country && <p><span className="text-gray-400">Country:</span> {country}</p>}
        </div>
      )}
      
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
  
  // Dev mode: Allow URL to set initial view (e.g., ?view=email or ?view=complete)
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const devView = urlParams?.get('view') as ViewState | null;
  const isDev = process.env.NODE_ENV === 'development';
  const initialView = (isDev && devView) ? devView : 'conversation'; // Start directly in conversation!
  
  const [view, setView] = useState<ViewState>(initialView);
  const [messageCount, setMessageCount] = useState(isDev && devView ? 12 : 0);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userCountry, setUserCountry] = useState<string>('');
  const [enableAvatar, setEnableAvatar] = useState<boolean>(false); // Avatar disabled by default
  
  // Handle consent acceptance - start conversation (keeping for compatibility)
  const handleAccept = useCallback(async () => {
    setView('conversation');
  }, []);
  
  // Handle conversation end - go to email capture
  const handleConversationEnd = useCallback(async (messages: Message[]) => {
    console.log('Conversation ended with', messages.length, 'messages:', messages);
    setMessageCount(messages.length);
    setView('email');
    
    // Note: Conversation data is automatically saved via ElevenLabs webhook
    // The webhook sends structured data to your Supabase database
    // This transcript is just for display purposes
  }, []);
  
  // Handle email submission
  const handleEmailSubmit = useCallback((email: string, country: string) => {
    console.log('Email submitted:', { email, country });
    setUserEmail(email);
    setUserCountry(country);
    setView('complete');
    
    // Here you could send to an API endpoint to store email/country
    // fetch('/api/research/update-response', { email, country, ... })
  }, []);
  
  // Handle skip email
  const handleEmailSkip = useCallback(() => {
    console.log('User skipped email');
    setView('complete');
  }, []);
  
  // Dev Tools handlers
  const handleSkipToEmail = useCallback(() => {
    setMessageCount(12); // Mock message count
    setView('email');
  }, []);
  
  const handleSkipToComplete = useCallback(() => {
    setMessageCount(12); // Mock message count
    setView('complete');
  }, []);
  
  const handleAutoFillEmail = useCallback((email: string, country: string) => {
    if (email === 'skip') {
      handleEmailSkip();
    } else {
      handleEmailSubmit(email, country);
    }
  }, [handleEmailSkip, handleEmailSubmit]);
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      {view === 'consent' && (
        <ConsentScreen onAccept={handleAccept} />
      )}
      
      {view === 'conversation' && (
        <div className="w-full max-w-4xl">
          {/* Brief consent notice */}
          <div className="mb-4 text-center">
            <p className="text-xs text-gray-500">
              Your responses are anonymized and used for product transparency research. 
              <a href="#" className="underline ml-1">Privacy</a>
            </p>
          </div>
          
          <AnamElevenLabsTranscript
            agentId={process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!}
            agentName="Nova"
            onConversationEnd={handleConversationEnd}
            className="h-[600px]"
            enableAvatar={enableAvatar}
          />
          
          <p className="text-center text-xs text-gray-400 mt-4">
            Having trouble? Make sure your microphone is enabled.
            {!enableAvatar && ' 💡 Enable avatar in dev tools for visual experience.'}
          </p>
        </div>
      )}
      
      {view === 'email' && (
        <EmailCapture 
          onSubmit={handleEmailSubmit}
          onSkip={handleEmailSkip}
        />
      )}
      
      {view === 'complete' && (
        <CompletionScreen 
          messageCount={messageCount}
          email={userEmail}
          country={userCountry}
        />
      )}
      
      {/* Development Tools - Only visible in dev mode */}
      <DevTools 
        onSkipToEmail={handleSkipToEmail}
        onSkipToComplete={handleSkipToComplete}
        onAutoFillEmail={handleAutoFillEmail}
        currentView={view}
        enableAvatar={enableAvatar}
        onToggleAvatar={setEnableAvatar}
      />
    </main>
  );
}

