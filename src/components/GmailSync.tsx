import { useState, useEffect } from 'react';
import { Mail, RefreshCw, CheckCircle, XCircle, Calendar, Unlink, AlertTriangle } from 'lucide-react';
import type { AppStatus } from '../types';

interface ScanResult {
  id: string;
  company: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  type: 'offer' | 'rejected' | 'interview';
}

interface Props {
  onStatusUpdate: (company: string, status: AppStatus) => void;
}

const TYPE_STYLE = {
  rejected:  { label: 'Rejection',  bg: 'bg-red-900/50',     border: 'border-red-700/50',     text: 'text-red-300',     badge: 'bg-red-800 text-red-200'     },
  offer:     { label: 'Offer',      bg: 'bg-emerald-900/50', border: 'border-emerald-700/50', text: 'text-emerald-300', badge: 'bg-emerald-800 text-emerald-200' },
  interview: { label: 'Interview',  bg: 'bg-orange-900/50',  border: 'border-orange-700/50',  text: 'text-orange-300',  badge: 'bg-orange-700 text-white'      },
};

export default function GmailSync({ onStatusUpdate }: Props) {
  const [connected, setConnected]   = useState<boolean | null>(null);
  const [scanning, setScanning]     = useState(false);
  const [results, setResults]       = useState<ScanResult[]>([]);
  const [dismissed, setDismissed]   = useState<Set<string>>(new Set());
  const [applied, setApplied]       = useState<Set<string>>(new Set());
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    // Check connection status
    fetch('/api/auth/status')
      .then(r => r.json())
      .then(d => setConnected(d.connected))
      .catch(() => setConnected(false));

    // Handle redirect params
    const params = new URLSearchParams(window.location.search);
    if (params.get('gmail_connected')) {
      setConnected(true);
      window.history.replaceState({}, '', window.location.pathname);
      scan();
    }
    if (params.get('gmail_error')) {
      setError('Gmail connection failed. Please try again.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  async function scan() {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch('/api/gmail/scan');
      if (res.status === 401) { setConnected(false); return; }
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setResults(data.results ?? []);
    } catch {
      setError('Scan failed — check your connection.');
    } finally {
      setScanning(false);
    }
  }

  async function disconnect() {
    await fetch('/api/auth/disconnect');
    setConnected(false);
    setResults([]);
  }

  function applyUpdate(result: ScanResult) {
    onStatusUpdate(result.company, result.type as AppStatus);
    setApplied(s => new Set([...s, result.id]));
  }

  function dismiss(id: string) {
    setDismissed(s => new Set([...s, id]));
  }

  const visible = results.filter(r => !dismissed.has(r.id));

  if (connected === null) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${connected ? 'bg-orange-500/20' : 'bg-slate-800'}`}>
            <Mail size={16} className={connected ? 'text-orange-400' : 'text-slate-500'} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Gmail Sync</p>
            <p className="text-xs text-slate-500">
              {connected ? 'Auto-detects rejections & offers from your inbox' : 'Connect to auto-detect application responses'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {connected ? (
            <>
              <button
                onClick={scan}
                disabled={scanning}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-bold rounded-lg transition-colors disabled:opacity-50">
                <RefreshCw size={12} className={scanning ? 'animate-spin' : ''} />
                {scanning ? 'Scanning…' : 'Scan Inbox'}
              </button>
              <button
                onClick={disconnect}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-400 text-xs rounded-lg transition-colors"
                title="Disconnect Gmail">
                <Unlink size={12} />
              </button>
            </>
          ) : (
            <a
              href="/api/auth/google"
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-lg transition-colors">
              <Mail size={12} /> Connect Gmail
            </a>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 mx-5 mt-4 px-3 py-2.5 bg-red-900/40 border border-red-700/50 rounded-lg text-red-300 text-xs">
          <AlertTriangle size={13} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {connected && visible.length > 0 && (
        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-400 font-medium">{visible.length} email{visible.length !== 1 ? 's' : ''} detected — review and apply:</p>
          {visible.map(r => {
            const s = TYPE_STYLE[r.type];
            const wasApplied = applied.has(r.id);
            return (
              <div key={r.id} className={`rounded-xl border p-4 space-y-2 ${s.bg} ${s.border}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${s.badge}`}>{s.label}</span>
                      <span className="text-xs text-white font-semibold truncate">{r.company}</span>
                    </div>
                    <p className="text-xs text-slate-300 truncate">{r.subject}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{r.snippet}</p>
                    <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(r.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {wasApplied ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                      <CheckCircle size={12} /> Status updated
                    </span>
                  ) : (
                    <button
                      onClick={() => applyUpdate(r)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                        r.type === 'offer' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' :
                        r.type === 'interview' ? 'bg-orange-500 hover:bg-orange-400 text-slate-950' :
                        'bg-red-700 hover:bg-red-600 text-white'
                      }`}>
                      {r.type === 'offer' ? <CheckCircle size={11} /> : r.type === 'interview' ? <Calendar size={11} /> : <XCircle size={11} />}
                      Mark as {s.label}
                    </button>
                  )}
                  <button
                    onClick={() => dismiss(r.id)}
                    className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-300 rounded-lg transition-colors">
                    Dismiss
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state after scan */}
      {connected && !scanning && results.length === 0 && !error && (
        <div className="px-5 py-6 text-center text-slate-500 text-xs">
          Click <span className="text-orange-400 font-medium">Scan Inbox</span> to check for new responses.
        </div>
      )}

      {connected && !scanning && results.length > 0 && visible.length === 0 && (
        <div className="px-5 py-6 text-center text-slate-500 text-xs">
          All caught up — no new responses to review.
        </div>
      )}
    </div>
  );
}
