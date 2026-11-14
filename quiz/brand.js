// Branding and playful bits shared by the trainer screen and the phone page.

export const TRAINERS = 'Divya Ravichandran, Álvaro Gómez García & Mohammed Krayem';
export const TRAINING = 'Training 3 · When something goes wrong';
export const BOOTCAMP = 'Cybersecurity for NGOs Bootcamp';

/** Digital Learning Hub wordmark (text + blinking purple cursor). */
export const wordmark = (stacked = false) => stacked
  ? '<div class="dlh stacked" aria-label="Digital Learning Hub"><span>Digital</span><span>Learning</span><span>Hub<i class="cursor"></i></span></div>'
  : '<div class="dlh" aria-label="Digital Learning Hub">Digital Learning Hub<i class="cursor"></i></div>';

// ---- Avatars: derived from the anonymous user id, so every device shows the same one
const AVATARS = ['user-astronaut', 'user-ninja', 'user-secret', 'robot', 'cat', 'dog', 'otter', 'dragon', 'hippo', 'frog', 'crow', 'fish', 'kiwi-bird', 'spider', 'horse', 'dove'];
const COLORS = ['#9F54F6', '#FF6B3D', '#34C77B', '#3D8BFD', '#F5B82E', '#FF5C8A', '#2EC4C4'];
function hash(s) { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
export function avatar(uid, cls = '') {
  const h = hash(uid);
  return `<span class="avatar ${cls}" style="--a:${COLORS[(h >>> 5) % COLORS.length]}"><i class="fa-solid fa-${AVATARS[h % AVATARS.length]}"></i></span>`;
}

// ---- "Cyber name" suggestions for people who don't want to think of a nickname
const ADJ = ['Brave', 'Calm', 'Quick', 'Smart', 'Steady', 'Sharp', 'Bright', 'Kind', 'Bold', 'Clever', 'Swift', 'Wise'];
const NOUN = ['Firewall', 'Router', 'Shield', 'Backup', 'Patch', 'Password', 'Antivirus', 'Cable', 'Laptop', 'Cookie', 'Pixel', 'Modem'];
export const cyberName = () => `${ADJ[Math.floor(Math.random() * ADJ.length)]} ${NOUN[Math.floor(Math.random() * NOUN.length)]}`;
