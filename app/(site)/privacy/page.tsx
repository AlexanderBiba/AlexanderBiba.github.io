import { Metadata } from 'next'
import { getSiteMetadata } from '../../../src/lib/siteMetadata'
import { getSiteSettings } from '../../../src/lib/content'

export async function generateMetadata(): Promise<Metadata> {
  return getSiteMetadata({ pathname: '/privacy/' })
}

export default async function PrivacyPage() {
  const settings = await getSiteSettings()

  return (
    <div className="content-container">
      <h1>Privacy</h1>
      <p>
        This site doesn’t use cookies and doesn’t store anything on your device. There are no ads, no
        trackers that follow you across sites, and no accounts.
      </p>
      <h2>Analytics</h2>
      <p>
        To see which pages get read, the site sends anonymous page views to{' '}
        <a href="https://www.cloudflare.com/web-analytics/">Cloudflare Web Analytics</a> and{' '}
        <a href="https://posthog.com/privacy">PostHog</a> (hosted in the US). PostHog also records how
        far each page is scrolled and which links and buttons are clicked, but never what you type.
        Neither sets cookies or uses local storage. Cloudflare doesn’t try to tell visitors apart at all,
        and PostHog counts visits with a short-lived hash that resets every day, so you can’t be
        recognised across days, and doesn’t store IP addresses. The data is only used for aggregate
        statistics about this site and is never sold or shared for advertising.
      </p>
      <p>
        If your browser sends a Do Not Track or Global Privacy Control signal, neither of them is loaded
        at all.
      </p>
      {settings.email && (
        <>
          <h2>Contact</h2>
          <p>
            Questions or requests about your data: <a href={`mailto:${settings.email}`}>{settings.email}</a>.
          </p>
        </>
      )}
    </div>
  )
}
