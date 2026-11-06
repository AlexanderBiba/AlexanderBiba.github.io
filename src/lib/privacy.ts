// Shared checks for the analytics scripts. Browser-only: call from useEffect.

// Only the live site reports, so local dev and preview deployments don't
// pollute the numbers.
const PRODUCTION_HOSTS = ['alexbiba.com', 'www.alexbiba.com']

export function isProductionHost() {
  return PRODUCTION_HOSTS.includes(window.location.hostname)
}

// Neither PostHog's cookieless mode nor Cloudflare's beacon looks at these
// signals, so Do Not Track and Global Privacy Control are honoured by never
// loading the analytics scripts at all.
export function visitorOptedOut() {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string }
  const win = window as Window & { doNotTrack?: string }
  return [nav.doNotTrack, nav.msDoNotTrack, win.doNotTrack].some((v) => v === '1' || v === 'yes')
    || nav.globalPrivacyControl === true
}
