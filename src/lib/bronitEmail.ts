// New owner and hotel-admin logins are provisioned by us, not chosen by the
// customer, so we require them on our own domain — keeps every tenant login
// recognizable and avoids customers locking themselves out of an inbox we
// don't control. Enforced at creation only; existing non-bronit accounts
// (from before this rule) are left alone.
export const BRONIT_DOMAIN = '@bronit.uz'

export function isBronitEmail(email: string): boolean {
  return email.toLowerCase().trim().endsWith(BRONIT_DOMAIN)
}

// Splits an email into the part shown in a compound "local + fixed domain"
// input. If the email isn't on the bronit domain (e.g. a legacy account),
// the whole thing is returned as-is so it displays without corruption.
export function bronitLocalPart(email: string): string {
  return isBronitEmail(email) ? email.slice(0, -BRONIT_DOMAIN.length) : email
}

export function toBronitEmail(localPart: string): string {
  return `${localPart.trim().toLowerCase()}${BRONIT_DOMAIN}`
}
