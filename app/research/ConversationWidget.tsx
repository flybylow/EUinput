'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useEffect, useState } from 'react';

interface ConversationWidgetProps {
  source?: string;
  campaign?: string;
  ref?: string;
}

export default function ConversationWidget({
  source,
  campaign,
  ref,
}: ConversationWidgetProps) {
  const [status, setStatus] = useState<
    'idle' | 'requesting' | 'connected' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs');
      setStatus('connected');
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs');
      setStatus('idle');
    },
    onMessage: (message) => {
      console.log('Message:', message);
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
      setErrorMessage(error.message || 'Connection error occurred');
      setStatus('error');
    },
  });

  const startConversation = useCallback(async () => {
    try {
      setStatus('requesting');
      setErrorMessage('');

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
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

      const { signedUrl } = await response.json();

      // Start the conversation
      await conversation.startSession({
        signedUrl,
      });

      // Clean up the stream
      stream.getTracks().forEach((track) => track.stop());
    } catch (error: any) {
      console.error('Failed to start conversation:', error);
      setErrorMessage(
        error.message || 'Failed to start conversation. Please try again.'
      );
      setStatus('error');
    }
  }, [conversation, source, campaign, ref]);

  const endConversation = useCallback(async () => {
    await conversation.endSession();
    setStatus('idle');
  }, [conversation]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Status Indicator */}
      {status === 'connected' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-800 font-medium">
                Connected to Nova
              </span>
            </div>
            <button
              onClick={endConversation}
              className="text-sm text-green-700 hover:text-green-900 underline"
            >
              End Conversation
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {status === 'error' && errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm">{errorMessage}</p>
          <button
            onClick={() => {
              setStatus('idle');
              setErrorMessage('');
            }}
            className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Start Button */}
      {status === 'idle' && (
        <button
          onClick={startConversation}
          className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
        >
          🎤 Start Conversation with Nova
        </button>
      )}

      {/* Loading State */}
      {status === 'requesting' && (
        <button
          disabled
          className="w-full bg-blue-400 text-white px-8 py-4 rounded-lg text-lg font-semibold cursor-not-allowed"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Connecting...
          </span>
        </button>
      )}

      {/* Instructions */}
      <div className="mt-4 text-center text-sm text-gray-500">
        {status === 'idle' && (
          <p>Click the button above to start your conversation with Nova</p>
        )}
        {status === 'requesting' && <p>Requesting microphone access...</p>}
        {status === 'connected' && (
          <p>Speak naturally - Nova is listening and will respond</p>
        )}
      </div>

      {/* Microphone Notice */}
      {status === 'idle' && (
        <div className="mt-4 bg-gray-50 rounded-lg p-3 text-xs text-gray-600 text-center">
          💡 You'll be asked for microphone permission to speak with Nova
        </div>
      )}
    </div>
  );
}

