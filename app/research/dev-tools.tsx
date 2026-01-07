'use client';

import { useState } from 'react';

interface DevToolsProps {
  onSkipToEmail: () => void;
  onSkipToComplete: () => void;
  onAutoFillEmail: (email: string, country: string) => void;
  currentView: string;
  enableAvatar?: boolean;
  onToggleAvatar?: (enabled: boolean) => void;
}

export function DevTools({ 
  onSkipToEmail, 
  onSkipToComplete, 
  onAutoFillEmail,
  currentView,
  enableAvatar = false,
  onToggleAvatar
}: DevToolsProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-purple-700 transition font-mono text-sm"
      >
        🛠️ DEV {isOpen ? '▼' : '▲'}
      </button>

      {/* Dev Tools Panel */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-50 bg-gray-900 text-white p-4 rounded-lg shadow-2xl w-80 border border-purple-500">
          <h3 className="font-bold text-purple-400 mb-3 flex items-center gap-2">
            🛠️ Development Tools
          </h3>

          <div className="space-y-2">
            <div className="text-xs text-gray-400 mb-2">
              Current view: <span className="text-white">{currentView}</span>
            </div>

            {/* Avatar Toggle */}
            {onToggleAvatar && (
              <div className="border-b border-gray-700 pb-2 mb-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm">🎭 Enable Avatar</span>
                  <input
                    type="checkbox"
                    checked={enableAvatar}
                    onChange={(e) => onToggleAvatar(e.target.checked)}
                    className="w-4 h-4"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  {enableAvatar ? '✅ Avatar active' : '⚡ Faster without avatar'}
                </p>
              </div>
            )}

            {/* Skip Buttons */}
            <div className="space-y-1">
              <button
                onClick={onSkipToEmail}
                disabled={currentView === 'email' || currentView === 'complete'}
                className="w-full text-left px-3 py-2 bg-purple-700 hover:bg-purple-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ⏭️ Skip to Email Capture
              </button>

              <button
                onClick={onSkipToComplete}
                disabled={currentView === 'complete'}
                className="w-full text-left px-3 py-2 bg-purple-700 hover:bg-purple-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ⏭️ Skip to Complete
              </button>
            </div>

            {/* Auto-fill Options */}
            <div className="border-t border-gray-700 pt-2 mt-2">
              <p className="text-xs text-gray-400 mb-2">Quick Fill Email:</p>
              <div className="space-y-1">
                <button
                  onClick={() => onAutoFillEmail('test@example.com', 'Netherlands')}
                  className="w-full text-left px-3 py-1.5 bg-blue-700 hover:bg-blue-600 rounded text-xs"
                >
                  🇳🇱 test@example.com (NL)
                </button>
                <button
                  onClick={() => onAutoFillEmail('dev@test.com', 'Belgium')}
                  className="w-full text-left px-3 py-1.5 bg-blue-700 hover:bg-blue-600 rounded text-xs"
                >
                  🇧🇪 dev@test.com (BE)
                </button>
                <button
                  onClick={() => onAutoFillEmail('skip', '')}
                  className="w-full text-left px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                >
                  ⏭️ Skip Email (no data)
                </button>
              </div>
            </div>

            {/* Mock Data Generator */}
            <div className="border-t border-gray-700 pt-2 mt-2">
              <button
                onClick={() => {
                  const mockMessages = Array.from({ length: 12 }, (_, i) => ({
                    id: `msg-${i}`,
                    role: (i % 2 === 0 ? 'agent' : 'user') as 'agent' | 'user',
                    content: i % 2 === 0 
                      ? `Question ${Math.floor(i/2) + 1}...` 
                      : `Mock answer ${Math.floor(i/2) + 1}`,
                    timestamp: new Date(),
                    isFinal: true
                  }));
                  console.log('Mock messages generated:', mockMessages);
                  alert('Check console for mock conversation data');
                }}
                className="w-full text-left px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded text-xs"
              >
                📝 Generate Mock Transcript
              </button>
            </div>

            {/* URLs for Testing */}
            <div className="border-t border-gray-700 pt-2 mt-2">
              <p className="text-xs text-gray-400 mb-1">Test URLs:</p>
              <div className="space-y-1 text-xs">
                <a
                  href="/research?source=facebook&campaign=eu-study&ref=test123"
                  className="block text-blue-400 hover:text-blue-300 truncate"
                  target="_blank"
                >
                  📎 With tracking params
                </a>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-700">
            💡 This panel only shows in development
          </div>
        </div>
      )}
    </>
  );
}

