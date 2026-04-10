/**
 * Public support copy for /support (web + WebViewGold). Update contact details to match operations.
 * Same values as CustomerHelpPage where possible.
 */
export const SUPPORT_LAST_UPDATED = 'April 10, 2026';

export const SUPPORT_EMAIL = 'support@cleanmotionghana.com';
export const SUPPORT_PHONE_TEL = 'tel:+233244000000';
export const SUPPORT_PHONE_DISPLAY = '+233 24 400 0000';

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
      'Email is the best way to reach us for billing disputes, session issues, or account problems. Include your registered email or phone number and a short description of what happened.',
      'For urgent issues at a charging site, use the phone line below during published business hours (update these hours in your operations docs if needed).',
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
