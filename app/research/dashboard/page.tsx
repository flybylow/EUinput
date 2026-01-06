// =============================================================================
// Research Dashboard - View Past Conversations
// =============================================================================
// A dashboard to monitor and review completed research conversations
// Fetches data from Supabase and displays transcripts
// =============================================================================

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// -----------------------------------------------------------------------------
// Supabase Client (client-side, uses anon key)
// -----------------------------------------------------------------------------

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ResearchResponse {
  id: string;
  created_at: string;
  conversation_id: string;
  duration_seconds: number | null;
  source: string | null;
  q1_product: string | null;
  q1_doubt: string | null;
  q2_proof: string | null;
  q3_authority: string | null;
  q4_format: string | null;
  q5_behavior: string | null;
  q5_pay_more: string | null;
  email: string | null;
  country: string | null;
  completed: boolean;
}

interface Stats {
  total: number;
  completed: number;
  avgDuration: number;
  bySource: Record<string, number>;
  byCountry: Record<string, number>;
}

// -----------------------------------------------------------------------------
// Stats Cards
// -----------------------------------------------------------------------------

function StatsCard({ 
  label, 
  value, 
  icon 
}: { 
  label: string; 
  value: string | number; 
  icon: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Response Card
// -----------------------------------------------------------------------------

function ResponseCard({ 
  response, 
  onClick 
}: { 
  response: ResearchResponse; 
  onClick: () => void;
}) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg p-4 shadow-sm border hover:border-blue-300 cursor-pointer transition"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className={`
            inline-block px-2 py-0.5 rounded-full text-xs font-medium
            ${response.completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
          `}>
            {response.completed ? 'Completed' : 'Incomplete'}
          </span>
          {response.source && (
            <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
              {response.source}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {new Date(response.created_at).toLocaleDateString()}
        </span>
      </div>
      
      <div className="space-y-1 text-sm">
        {response.q1_product && (
          <p className="text-gray-700">
            <span className="text-gray-400">Product:</span> {response.q1_product}
          </p>
        )}
        {response.country && (
          <p className="text-gray-500">
            📍 {response.country}
          </p>
        )}
        {response.duration_seconds && (
          <p className="text-gray-400 text-xs">
            ⏱️ {Math.round(response.duration_seconds / 60)}:{String(response.duration_seconds % 60).padStart(2, '0')}
          </p>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Response Detail Modal
// -----------------------------------------------------------------------------

function ResponseDetail({ 
  response, 
  onClose 
}: { 
  response: ResearchResponse; 
  onClose: () => void;
}) {
  const questions = [
    { label: 'Product doubted', value: response.q1_product, doubt: response.q1_doubt },
    { label: 'What to prove', value: response.q2_proof },
    { label: 'Who should verify', value: response.q3_authority },
    { label: 'Preferred format', value: response.q4_format },
    { label: 'Would change behavior', value: response.q5_behavior },
    { label: 'Would pay more', value: response.q5_pay_more },
  ];
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg">Response Detail</h2>
            <p className="text-sm text-gray-500">
              {new Date(response.created_at).toLocaleString()}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Meta */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-400">Source</p>
              <p className="font-medium">{response.source || 'Direct'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-400">Country</p>
              <p className="font-medium">{response.country || 'Unknown'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-400">Duration</p>
              <p className="font-medium">
                {response.duration_seconds 
                  ? `${Math.round(response.duration_seconds / 60)}:${String(response.duration_seconds % 60).padStart(2, '0')}`
                  : 'N/A'
                }
              </p>
            </div>
          </div>
          
          {/* Questions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">Responses</h3>
            
            {questions.map((q, i) => (
              <div key={i} className="border-l-4 border-blue-200 pl-4">
                <p className="text-sm text-gray-400 mb-1">{q.label}</p>
                <p className="text-gray-800">{q.value || '—'}</p>
                {q.doubt && (
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="text-gray-400">Reason:</span> {q.doubt}
                  </p>
                )}
              </div>
            ))}
          </div>
          
          {/* Contact */}
          {response.email && (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600">
                📧 {response.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Dashboard Component
// -----------------------------------------------------------------------------

export default function ResearchDashboard() {
  const [responses, setResponses] = useState<ResearchResponse[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<ResearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'incomplete'>('all');
  
  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('consumer_research_responses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching responses:', error);
        setLoading(false);
        return;
      }
      
      setResponses(data || []);
      
      // Calculate stats
      if (data) {
        const completed = data.filter(r => r.completed);
        const durations = data.filter(r => r.duration_seconds).map(r => r.duration_seconds!);
        
        const bySource: Record<string, number> = {};
        const byCountry: Record<string, number> = {};
        
        data.forEach(r => {
          if (r.source) bySource[r.source] = (bySource[r.source] || 0) + 1;
          if (r.country) byCountry[r.country] = (byCountry[r.country] || 0) + 1;
        });
        
        setStats({
          total: data.length,
          completed: completed.length,
          avgDuration: durations.length > 0 
            ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
            : 0,
          bySource,
          byCountry,
        });
      }
      
      setLoading(false);
    }
    
    fetchData();
    
    // Real-time subscription
    const subscription = supabase
      .channel('research_responses')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'consumer_research_responses' },
        (payload) => {
          setResponses(prev => [payload.new as ResearchResponse, ...prev]);
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Filter responses
  const filteredResponses = responses.filter(r => {
    if (filter === 'completed') return r.completed;
    if (filter === 'incomplete') return !r.completed;
    return true;
  });
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin text-4xl">🔄</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-800">
          European Consumer Transparency Study
        </h1>
        <p className="text-gray-500">Research Dashboard</p>
      </header>
      
      {/* Stats */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatsCard 
            label="Total Responses" 
            value={stats?.total || 0} 
            icon="📊" 
          />
          <StatsCard 
            label="Completed" 
            value={stats?.completed || 0} 
            icon="✅" 
          />
          <StatsCard 
            label="Completion Rate" 
            value={stats ? `${Math.round((stats.completed / stats.total) * 100)}%` : '0%'} 
            icon="📈" 
          />
          <StatsCard 
            label="Avg Duration" 
            value={stats ? `${Math.round(stats.avgDuration / 60)}:${String(stats.avgDuration % 60).padStart(2, '0')}` : '0:00'} 
            icon="⏱️" 
          />
        </div>
        
        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {(['all', 'completed', 'incomplete'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium transition
                ${filter === f 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Response List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredResponses.map(response => (
            <ResponseCard
              key={response.id}
              response={response}
              onClick={() => setSelectedResponse(response)}
            />
          ))}
        </div>
        
        {filteredResponses.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📭</p>
            <p>No responses yet</p>
          </div>
        )}
      </div>
      
      {/* Detail Modal */}
      {selectedResponse && (
        <ResponseDetail 
          response={selectedResponse} 
          onClose={() => setSelectedResponse(null)} 
        />
      )}
    </div>
  );
}

