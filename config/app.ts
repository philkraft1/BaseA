export const DUE_APP_NAME = 'Due'

const appUrl = (
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://basea-tau.vercel.app'
).replace(/\/$/, '')

export const DUE_APP_LOGO_URL = `${appUrl}/due.svg`
