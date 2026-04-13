// Palette of distinct, pleasant colors for generated avatars
const AVATAR_COLORS: { bg: string; text: string }[] = [
  { bg: '#185fa5', text: '#ffffff' }, // brand blue
  { bg: '#3b6d11', text: '#ffffff' }, // brand green
  { bg: '#854f0b', text: '#ffffff' }, // brand orange
  { bg: '#a32d2d', text: '#ffffff' }, // brand red
  { bg: '#534ab7', text: '#ffffff' }, // brand purple
  { bg: '#0f766e', text: '#ffffff' }, // teal
  { bg: '#7c3aed', text: '#ffffff' }, // violet
  { bg: '#b45309', text: '#ffffff' }, // amber
  { bg: '#0369a1', text: '#ffffff' }, // sky
  { bg: '#be185d', text: '#ffffff' }, // pink
  { bg: '#065f46', text: '#ffffff' }, // emerald
  { bg: '#92400e', text: '#ffffff' }, // brown
];

/**
 * Returns a deterministic color pair based on the given name.
 * The same name always produces the same color (like Google/GitHub avatars).
 */
function getAvatarColor(name: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0; // force 32-bit integer
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Generates a data-URI SVG avatar with the user's initials on a
 * deterministic colored background. Works entirely client-side.
 *
 * @param firstName - user's first name
 * @param lastName  - user's last name
 * @returns a `data:image/svg+xml;base64,...` string usable as <img src>
 */
export function generateAvatarDataUri(firstName: string, lastName: string): string {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const fullName = `${firstName} ${lastName}`;
  const { bg, text } = getAvatarColor(fullName);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
  <rect width="40" height="40" fill="${bg}"/>
  <text x="20" y="27" font-family="Inter, system-ui, sans-serif" font-size="15" font-weight="600" text-anchor="middle" fill="${text}" letter-spacing="0.5">${initials}</text>
</svg>`;

  if (typeof window === 'undefined') {
    // Server-side: use Buffer
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}
