import posts from '../../content/blog.json'
import projects from '../../content/projects.json'
import profile from '../../content/site.json'

export type RoomId = 'upstairs' | 'downstairs' | 'backyard'
export type Story = { id: string; title: string; text: string; links?: { label: string; href: string }[]; destination?: RoomId }
export const rooms: Record<RoomId, { title: string; label: string; number: string }> = {
  upstairs: { title: 'ALEX’S ROOM', label: 'UPSTAIRS', number: '2F' },
  downstairs: { title: 'LIVING ROOM', label: 'DOWNSTAIRS', number: '1F' },
  backyard: { title: 'BACKYARD', label: 'OUTSIDE', number: 'OUT' },
}
export const stories: Record<string, Story> = {
  laptop: { id: 'laptop', title: 'ALEX', text: 'I build software. Here are a few things I’ve shipped.', links: projects.map(p => ({ label: p.title, href: p.url || `/projects/${p.slug}/` })) },
  printer: { id: 'printer', title: 'ALEX', text: 'My 3D printer. I like making things I can actually hold.' },
  guitar: { id: 'guitar', title: 'GUITAR', text: 'A Strat-style electric. Three pickups, six strings.' },
  bookshelf: { id: 'bookshelf', title: 'ALEX', text: 'I write about what I’m building and learning.', links: posts.map(p => ({ label: p.title, href: `/blog/${p.slug}/` })) },
  bed: { id: 'bed', title: 'ALEX', text: 'I’m Alex. Engineer, husband, dad. This is my place.', links: [{ label: 'X (Twitter)', href: profile.twitter }, { label: 'LinkedIn', href: profile.linkedin }, { label: 'GitHub', href: profile.github }, { label: 'Email', href: `mailto:${profile.email}` }] },
  stairsDown: { id: 'stairsDown', title: 'STAIRS', text: '', destination: 'downstairs' },
  wife: { id: 'wife', title: 'ALEX', text: 'Meet my wife. We live here with our baby and our dog.' },
  baby: { id: 'baby', title: 'BABY', text: 'Ba! Ba ba!' },
  dog: { id: 'dog', title: 'DOG', text: 'Woof!' },
  fridge: { id: 'fridge', title: 'FRIDGE', text: 'You open the fridge. A little snack break.' },
  photos: { id: 'photos', title: 'ALEX', text: 'A few family photos.' },
  stairsUp: { id: 'stairsUp', title: 'STAIRS', text: '', destination: 'upstairs' },
  outside: { id: 'outside', title: 'BACK DOOR', text: '', destination: 'backyard' },
  tesla: { id: 'tesla', title: 'ALEX', text: 'Charged up and ready to go.' },
  garden: { id: 'garden', title: 'ALEX', text: 'Our backyard. Good for a break from the screen.' },
  picnic: { id: 'picnic', title: 'ALEX', text: 'Have something in mind? Send me a message.', links: [{ label: 'X (Twitter)', href: profile.twitter }, { label: 'LinkedIn', href: profile.linkedin }, { label: 'GitHub', href: profile.github }, { label: 'Email', href: `mailto:${profile.email}` }] },
  inside: { id: 'inside', title: 'BACK DOOR', text: '', destination: 'downstairs' },
}
export const collectibleIds = Object.values(stories).filter(s => !s.destination).map(s => s.id)
