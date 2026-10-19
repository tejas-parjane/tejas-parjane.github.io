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
  role: 'AI Engineering · Data Science · Product',
  location: 'Pune, Maharashtra, India',
  email: 'tejasparjane7334@gmail.com',
  github: 'https://github.com/tejas-parjane',
  linkedin: 'https://www.linkedin.com/in/tejas-parjane/',
  headline: 'From data to intelligence. From intelligence to products.',
  supportingCopy:
    "I'm Tejas Parjane. I build data-driven systems and AI-powered applications that help people make better decisions. My work spans machine learning, experimentation, AI workflows, and the engineering required to turn ideas into usable products.",
}

export const resume = {
  status: 'pending' as const,
  path: '/about#resume',
  label: 'Resume',
  note: 'The latest resume is available on request.',
}
