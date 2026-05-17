const ENDPOINT = 'https://captainbunhop.goatcounter.com/count';
const enabled = import.meta.env.PROD;

declare global {
  interface Window {
    goatcounter?: {
      count?: (vars: { path: string; title?: string; event?: boolean }) => void;
      no_onload?: boolean;
    };
  }
}

export function initAnalytics(): void {
  if (!enabled) return;
  window.goatcounter = { no_onload: false };
  const s = document.createElement('script');
  s.async = true;
  s.dataset.goatcounter = ENDPOINT;
  s.src = '//gc.zgo.at/count.js';
  document.head.appendChild(s);
}

export function trackEvent(path: string, title?: string): void {
  if (!enabled) return;
  if (window.goatcounter?.count) {
    window.goatcounter.count({ path, title, event: true });
  } else {
    setTimeout(() => window.goatcounter?.count?.({ path, title, event: true }), 500);
  }
}

export function scoreBucket(score: number): string {
  if (score < 10) return '0-9';
  if (score < 25) return '10-24';
  if (score < 50) return '25-49';
  if (score < 100) return '50-99';
  if (score < 250) return '100-249';
  if (score < 500) return '250-499';
  return '500+';
}
