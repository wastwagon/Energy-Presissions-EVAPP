/**
 * Canonical customer-facing support contacts (web + WebViewGold).
 * Help, /support, Suspended, and Disabled all read from here.
 */

export const SUPPORT_LAST_UPDATED = 'August 17, 2026';

export const SUPPORT_EMAIL = 'support@cleanmotionghana.com';

/** Display string. Null = hide phone (email-only). */
export const SUPPORT_PHONE_DISPLAY: string | null = '+233 533 611 611';

/** `tel:` href including country code. Null = hide phone. */
export const SUPPORT_PHONE_TEL: string | null = 'tel:+233533611611';

export function getSupportPhone(): { display: string; tel: string } | null {
  if (!SUPPORT_PHONE_DISPLAY || !SUPPORT_PHONE_TEL) return null;
  return { display: SUPPORT_PHONE_DISPLAY, tel: SUPPORT_PHONE_TEL };
}

export type SupportSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export const SUPPORT_SECTIONS: SupportSection[] = [
  {
    id: 'overview',
    title: 'How we can help',
    paragraphs: [
      'This page is the official support reference for the Clean Motion mobile app. If you have questions about finding chargers, starting a session, wallet top-ups, or your account, we are here to help.',
    ],
  },
  {
    id: 'contact',
    title: 'Contact us',
    paragraphs: [
      'Email or call us for billing disputes, session issues, or account problems. Include your registered email or phone number and a short description of what happened.',
      'For urgent issues at a charging site, call us or email with the station name and what you see on the charger.',
    ],
  },
  {
    id: 'response',
    title: 'Response times',
    paragraphs: [
      'We aim to respond to email within two business days. Complex cases (payments, refunds, or hardware at a specific site) may take longer while we coordinate with the station operator.',
    ],
  },
  {
    id: 'self-serve',
    title: 'Self-service in the app',
    paragraphs: [
      'Signed-in customers can open Help from the app menu for FAQs, wallet and payment topics, and the same privacy and terms links you see on the App Store listing.',
    ],
  },
];
