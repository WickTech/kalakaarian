const GENERIC_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'yahoo.in', 'outlook.com', 'hotmail.com',
  'hotmail.in', 'live.com', 'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'zoho.com', 'ymail.com', 'rediffmail.com',
  'aol.com', 'msn.com', 'googlemail.com', 'inbox.com', 'mail.com',
  'yandex.com', 'tutanota.com', 'fastmail.com',
]);

export function isWorkEmail(email: string): boolean {
  const domain = emailDomain(email);
  if (!domain) return false;
  return !GENERIC_DOMAINS.has(domain);
}

export function emailDomain(email: string): string {
  return email.trim().toLowerCase().split('@')[1] ?? '';
}

export function emailWarning(email: string): string | null {
  if (!email) return null;
  if (!isWorkEmail(email)) {
    return 'A work/business email is recommended for brand accounts. Personal email addresses may limit access to certain features.';
  }
  return null;
}
