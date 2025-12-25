import StudioClient from './StudioClient'

// Required for catch-all routes with output: 'export'
// Return params for the base /studio route
// The Studio itself is dynamic, but we need to provide at least the base route
export function generateStaticParams() {
  return [{ index: [] }]
}

export default function StudioPage() {
  return <StudioClient />
}

