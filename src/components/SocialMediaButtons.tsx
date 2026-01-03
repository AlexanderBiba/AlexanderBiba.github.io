import { SiteSettings } from '../types/blog'

interface SocialMediaButtonsProps {
  settings?: SiteSettings | null
}

export default function SocialMediaButtons({ settings }: SocialMediaButtonsProps) {
  if (!settings) return null

  const links = [
    settings.email && <a key="email" href={`mailto:${settings.email}`}>Email</a>,
    settings.github && <a key="github" href={settings.github} target="_blank" rel="noreferrer noopener">GitHub</a>,
    settings.linkedin && <a key="linkedin" href={settings.linkedin} target="_blank" rel="noreferrer noopener">LinkedIn</a>,
    settings.twitter && <a key="twitter" href={settings.twitter} target="_blank" rel="noreferrer noopener">Twitter</a>,
  ].filter(Boolean)

  if (links.length === 0) return null

  return (
    <p>
      {links.map((link, i) => (
        <span key={i}>
          {i > 0 && ' · '}
          {link}
        </span>
      ))}
    </p>
  )
}

