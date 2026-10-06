'use client'

import { useEffect } from 'react'

// TODO: paste the PostHog project API key here (PostHog → Project settings →
// "Project API key", starts with `phc_`). It is public by design, so committing
// it is fine. Analytics stays off while this is empty.
const POSTHOG_KEY = ''

// Only the live site reports, so local dev and preview deployments don't
// pollute the numbers.
const PRODUCTION_HOSTS = ['alexbiba.com', 'www.alexbiba.com']

// Cookieless mode ignores `respect_dnt`, so Do Not Track and Global Privacy
// Control are honoured here by never loading PostHog at all.
function visitorOptedOut() {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string }
  const win = window as Window & { doNotTrack?: string }
  return [nav.doNotTrack, nav.msDoNotTrack, win.doNotTrack].some((v) => v === '1' || v === 'yes')
    || nav.globalPrivacyControl === true
}

// Privacy-first analytics that needs no cookie banner: nothing is stored on the
// visitor's device (no cookies, localStorage or sessionStorage), visitors are
// counted with PostHog's server-side hash whose salt rotates daily, and no one
// is ever identified. Requires "Cookieless server hash mode" to be enabled in
// the PostHog project settings, otherwise PostHog drops these events.
export default function PostHogAnalytics() {
  useEffect(() => {
    if (!POSTHOG_KEY || !PRODUCTION_HOSTS.includes(window.location.hostname) || visitorOptedOut()) return

    import('posthog-js').then(({ default: posthog }) => {
      if (posthog.__loaded) return
      posthog.init(POSTHOG_KEY, {
        api_host: 'https://eu.i.posthog.com',
        ui_host: 'https://eu.posthog.com',
        defaults: '2026-08-30',
        cookieless_mode: 'always',
        persistence: 'memory',
        person_profiles: 'never',
        mask_personal_data_properties: true,
        disable_session_recording: true,
        disable_surveys: true,
        disable_product_tours: true,
        disable_conversations: true,
        disable_web_experiments: true,
        disable_external_dependency_loading: true,
        advanced_disable_flags: true,
        enable_heatmaps: false,
        capture_dead_clicks: false,
        capture_exceptions: false,
      })
    })
  }, [])

  return null
}
