import { JSONBIN } from './config';
import { mergeHistory, ScoreEntry, getHistory, setHistory } from './score';

const BASE = 'https://api.jsonbin.io/v3/b';

function configured(): boolean {
  return !!JSONBIN.BIN_ID && !!JSONBIN.MASTER_KEY;
}

function headers(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Master-Key': JSONBIN.MASTER_KEY,
    'X-Bin-Meta': 'false',
  };
}

export async function fetchLeaderboard(): Promise<ScoreEntry[] | null> {
  if (!configured()) return null;
  try {
    const res = await fetch(`${BASE}/${JSONBIN.BIN_ID}/latest`, { headers: headers() });
    if (!res.ok) return null;
    const data = await res.json();
    const scores = Array.isArray(data?.scores) ? data.scores : [];
    const sanitized: ScoreEntry[] = scores
      .filter((e: unknown): e is ScoreEntry =>
        !!e && typeof (e as ScoreEntry).name === 'string' && typeof (e as ScoreEntry).score === 'number')
      .slice(0, 10);
    setHistory(sanitized);
    return sanitized;
  } catch {
    return null;
  }
}

export async function submitScore(entry: ScoreEntry): Promise<ScoreEntry[] | null> {
  if (!configured()) return null;
  try {
    const remote = await fetchLeaderboard();
    const base = remote ?? getHistory();
    const merged = mergeHistory(base, entry);
    const res = await fetch(`${BASE}/${JSONBIN.BIN_ID}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ scores: merged }),
    });
    if (!res.ok) return null;
    setHistory(merged);
    return merged;
  } catch {
    return null;
  }
}
