// =============================================================================
// Simple Anam Avatar Test - No ElevenLabs
// =============================================================================
// Tests if Anam avatar connection works standalone
// URL: /research/avatar-test
// =============================================================================

'use client';

import { useCallback, useRef, useState } from 'react';
import { createClient } from '@anam-ai/js-sdk';

export default function AnamTestPage() {
  const [status, setStatus] = useState<string>('idle');
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const anamClientRef = useRef<any>(null);
  
  const startAnam = useCallback(async () => {
    try {
      setStatus('connecting');
      setError('');
      
      console.log('1. Fetching Anam session token...');
      
      // Get session token (standard mode, not passthrough)
      const response = await fetch('/api/anam-session-standard');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get session token');
      }
      
      const { sessionToken, avatarId } = await response.json();
      console.log('✅ Got session token for avatar:', avatarId);
      
      console.log('2. Creating Anam client...');
      
      // Create Anam client (STANDARD MODE - not passthrough)
      const anamClient = createClient(sessionToken);
      
      console.log('3. Starting session...');
      await anamClient.startSession();
      
      console.log('4. Streaming to video element...');
      if (videoRef.current) {
        await anamClient.streamToVideoElement(videoRef.current);
      }
      
      anamClientRef.current = anamClient;
      setStatus('connected');
      console.log('✅ Anam avatar connected successfully!');
      
    } catch (err: any) {
      console.error('❌ Anam test failed:', err);
      setError(err.message || 'Unknown error');
      setStatus('error');
    }
  }, []);
  
  const stopAnam = useCallback(async () => {
    if (anamClientRef.current) {
      console.log('Stopping Anam session...');
      await anamClientRef.current.stopSession();
      anamClientRef.current = null;
    }
    setStatus('idle');
  }, []);
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white p-8">
      {/* Test Banner */}
      <div className="fixed top-0 left-0 right-0 bg-green-600 text-white text-center py-2 text-sm font-medium z-50">
        🧪 Anam Standalone Test - No ElevenLabs Integration
      </div>
      
      <div className="max-w-2xl mx-auto pt-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Anam Avatar Test
          </h1>
          <p className="text-gray-600">
            Testing if Anam connection works without ElevenLabs
          </p>
        </div>
        
        {/* Video Container */}
        <div className="bg-gray-900 rounded-xl overflow-hidden mb-6 relative" style={{ height: '400px' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
            style={{ transform: 'scaleX(-1)' }}
          />
          
          {status === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
              <div className="text-white text-center">
                <div className="text-6xl mb-4">🤖</div>
                <p className="text-lg">Click Start to test avatar</p>
              </div>
            </div>
          )}
          
          {status === 'connecting' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
              <div className="text-white text-center">
                <div className="animate-spin text-6xl mb-4">🔄</div>
                <p className="text-lg">Connecting to Anam...</p>
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-900/90">
              <div className="text-white text-center p-6">
                <div className="text-6xl mb-4">❌</div>
                <p className="text-lg font-semibold mb-2">Connection Failed</p>
                <p className="text-sm opacity-90">{error}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Status */}
        <div className="bg-white rounded-lg p-4 mb-4 shadow">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              status === 'connected' ? 'bg-green-500 animate-pulse' :
              status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              status === 'error' ? 'bg-red-500' :
              'bg-gray-300'
            }`} />
            <span className="font-medium">
              Status: {status === 'connected' ? '✅ Connected' :
                      status === 'connecting' ? '⏳ Connecting...' :
                      status === 'error' ? '❌ Error' :
                      '⚪ Idle'}
            </span>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex gap-4 justify-center mb-6">
          <button
            onClick={startAnam}
            disabled={status === 'connected' || status === 'connecting'}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Anam Test
          </button>
          
          <button
            onClick={stopAnam}
            disabled={status !== 'connected'}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Stop
          </button>
        </div>
        
        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <p className="font-semibold mb-2">What this tests:</p>
          <ul className="space-y-1 text-gray-700">
            <li>✓ Anam API credentials work</li>
            <li>✓ Session token generation works</li>
            <li>✓ Avatar video stream connects</li>
            <li>✓ Avatar renders in browser</li>
          </ul>
          
          <p className="mt-3 text-gray-600">
            <strong>Note:</strong> This uses Anam's built-in AI (not ElevenLabs).
            The avatar should appear and might speak on its own.
          </p>
        </div>
        
        {/* Console Log Hint */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Open browser console (F12) to see detailed logs
          </p>
        </div>
        
        {/* Links */}
        <div className="mt-6 text-center space-x-4">
          <a href="/research/avatar" className="text-green-600 hover:underline text-sm">
            → Full Integration Test
          </a>
          <a href="/research" className="text-green-600 hover:underline text-sm">
            → Back to Research
          </a>
        </div>
      </div>
    </main>
  );
}

