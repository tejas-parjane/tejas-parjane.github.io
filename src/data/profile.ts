export interface Profile {
  name: string
  role: string
  location: string
  email: string
  github: string
  linkedin: string
  headline: string
  supportingCopy: string
}

export const profile: Profile = {
  name: 'Tejas Parjane',
  role: 'Applied AI Engineer · Evaluated systems · Product delivery',
  location: 'Pune, Maharashtra, India',
  email: 'tejasparjane7334@gmail.com',
  github: 'https://github.com/tejas-parjane',
  linkedin: 'https://www.linkedin.com/in/tejas-parjane/',
  headline: 'I build evaluated AI systems that turn data into trustworthy decisions and usable products.',
  supportingCopy:
    'I design and ship AI decision systems—from data and model evaluation to reliable APIs and product workflows.',
}

export const resume = {
  status: 'pending' as const,
  path: '/about#resume',
  label: 'Resume',
  note: 'The latest resume is available on request.',
}
