import { SiteSettings } from '../types/blog'

interface AboutProps {
  settings?: SiteSettings | null
}

export default function About({ settings }: AboutProps) {
  if (!settings) return null

  return (
    <div className="content-container">
      <h1>{settings.name}</h1>
      <p>{settings.aboutBlurb}</p>
    </div>
  )
}

