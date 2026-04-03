/**
 * Privacy policy copy aligned with common Google Play Data safety & Apple App Privacy disclosure themes.
 * Keep store console answers consistent with this document. Not legal advice — have counsel review.
 */
export const PRIVACY_LAST_UPDATED = 'April 2026';

export type PrivacyBullet = { lead: string; text: string };

export type PrivacySection = {
  id: string;
  title: string;
  /** Optional lead-in (e.g. store-alignment note) shown after the title */
  introNote?: string;
  paragraphs?: string[];
  bullets?: PrivacyBullet[];
  /** Paragraphs shown after bullets when both exist (preserves reading order) */
  afterBullets?: string[];
};

export const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: 'who',
    title: '1. Who we are and what this covers',
    paragraphs: [
      'Clean Motion Ghana (“Clean Motion”, “we”, “us”) provides a software platform for electric vehicle (EV) charging discovery, sessions, wallet or payments, and related operator tools.',
      'This Privacy Policy applies when you use our websites, progressive web experience, or the same experience inside a mobile wrapper (for example WebView-based apps on Google Play or the Apple App Store). It should be read together with our Terms of Service.',
    ],
  },
  {
    id: 'collect',
    title: '2. Categories of information we collect',
    introNote:
      'We collect information in line with how the product works. This list is grouped in a way that helps you compare with Google Play “Data safety” and Apple “App Privacy” questions.',
    paragraphs: [
      'The types of data depend on whether you only browse, create an account, charge a vehicle, pay or top up a wallet, or use operator/admin features.',
    ],
    bullets: [
      {
        lead: 'Contact and profile information',
        text: 'Such as name, email address, and phone number when you register or update your profile; account type (for example Customer, Walk-In, Admin); and vendor association for staff accounts.',
      },
      {
        lead: 'Credentials and identifiers',
        text: 'A secure password hash (we do not store your password in plain text), account IDs, and if you use Sign in with Apple or Google, identifiers and profile details those services send us (for example email and name) to create or sign you in.',
      },
      {
        lead: 'Location-related information',
        text: 'If you use station discovery or maps, we may process location you allow on your device (for example GPS or approximate location). We may also infer coarse location from IP address for security or general region display.',
      },
      {
        lead: 'Charging, wallet, and transaction information',
        text: 'Charge point identifiers, session and transaction records, energy delivered, timestamps, reservations where available, wallet balance movements, invoices or payment records, and related operational data needed to run billing.',
      },
      {
        lead: 'Payment information',
        text: 'Payments and wallet top-ups are processed by our payment partners (such as Paystack). Card or mobile-money details are handled according to that provider’s rules; we typically receive status, references, and amounts—not full card numbers stored on our servers.',
      },
      {
        lead: 'Technical, security, and service diagnostics',
        text: 'Such as IP address, device/browser or WebView user agent, timestamps, authentication events, server and security logs, connection or diagnostic data related to chargers where applicable, and information needed to prevent abuse or fraud.',
      },
      {
        lead: 'Communications',
        text: 'Messages you send us through support or in-app help channels, and related metadata.',
      },
    ],
  },
  {
    id: 'sensitive',
    title: '3. Sensitive categories',
    paragraphs: [
      'We do not intend to collect health information. The service is not a health app. Do not submit health or other special-category data unless we explicitly ask for it for a specific lawful purpose.',
    ],
  },
  {
    id: 'use',
    title: '4. How we use information (purposes)',
    bullets: [
      { lead: 'Provide the service', text: 'Operate accounts, charging flows, maps, wallet, payments, notifications where enabled, and operator dashboards.' },
      { lead: 'Security and integrity', text: 'Authenticate users, detect fraud, protect users and infrastructure, and troubleshoot issues.' },
      { lead: 'Legal and compliance', text: 'Meet tax, accounting, and regulatory obligations, enforce our terms, and respond to lawful requests.' },
      { lead: 'Support', text: 'Respond to questions and improve help content.' },
      { lead: 'Improvement', text: 'Understand aggregate or de-identified usage to improve reliability and features; operational “analytics” inside our own systems for admins is not the same as selling data or ad tracking.' },
    ],
    afterBullets: [
      'We do not sell your personal information. The customer-facing web app does not embed third-party advertising or cross-app tracking SDKs for behavioural ads. If that ever changes, we will update this policy and the disclosures in the app stores before expanding use.',
    ],
  },
  {
    id: 'legal-bases',
    title: '5. Legal bases (where GDPR / UK GDPR applies)',
    paragraphs: [
      'Depending on your region, we rely on one or more of: performance of a contract (providing the service you asked for); legitimate interests (security, fraud prevention, improving reliability) where not overridden by your rights; legal obligation; and consent where required (for example optional marketing, if offered).',
    ],
  },
  {
    id: 'storage',
    title: '6. Cookies, local storage, and device storage',
    paragraphs: [
      'We use cookies or similar technologies where needed for sign-in, security, and session continuity. The app may store an authentication token and basic profile details locally on your device (for example browser localStorage in the web shell) so you stay signed in. You can clear site data in device or browser settings, which will sign you out.',
    ],
  },
  {
    id: 'sharing',
    title: '7. Sharing and subprocessors',
    paragraphs: [
      'We share information with service providers who process it on our instructions, such as cloud hosting, payment processing (e.g. Paystack), and email or infrastructure vendors. We may disclose information if required by law or to protect rights, safety, and security.',
      'When you use Sign in with Apple or Google Sign-In, Apple or Google processes information under their respective policies. We encourage you to review their privacy notices.',
    ],
  },
  {
    id: 'transfers',
    title: '8. International transfers',
    paragraphs: [
      'Our servers or subprocessors may be located outside your country (for example in the United States or the European Economic Area). Where required, we use appropriate safeguards such as standard contractual clauses or equivalent mechanisms.',
    ],
  },
  {
    id: 'retention',
    title: '9. Retention',
    paragraphs: [
      'We keep personal information only as long as needed for the purposes above, including statutory retention for billing and tax. Some information may be kept in aggregated or de-identified form that does not identify you.',
    ],
  },
  {
    id: 'security',
    title: '10. Security',
    paragraphs: [
      'We use technical and organisational measures appropriate to the risk, including encryption in transit (HTTPS) and access controls. No method of storage or transmission is completely secure.',
    ],
  },
  {
    id: 'rights',
    title: '11. Your choices and rights',
    bullets: [
      { lead: 'Access and correction', text: 'Update profile fields in the app where available, or contact us to correct inaccurate information.' },
      { lead: 'Data portability', text: 'You may request a machine-readable copy of personal data we hold about you where applicable law requires it.' },
      { lead: 'Objection and restriction', text: 'You may have rights to object to or restrict certain processing depending on your region.' },
      { lead: 'Complaints', text: 'You may lodge a complaint with a data protection authority in your country or region.' },
    ],
  },
  {
    id: 'deletion',
    title: '12. Account deletion',
    paragraphs: [
      'If you created a customer account in the app, you can request deletion of your account from the profile screen where the “Delete account” option is available. You may need to confirm with your current password. Deletion removes or anonymises personal data associated with that account where possible.',
      'Some information may be retained after deletion where we must comply with law (for example tax or financial records), resolve disputes, or enforce our agreements. Aggregated statistics that do not identify you may be retained.',
      'If you use Sign in with Apple or Google, you can also manage app access from your Apple ID or Google account settings; that does not automatically delete all data we hold until you complete in-app deletion or contact us.',
      'Staff, walk-in, or other account types may not see self-service deletion in the customer profile; contact support to close those accounts.',
    ],
  },
  {
    id: 'children',
    title: '13. Children',
    paragraphs: [
      'The service is not directed to children under 13 (or the minimum digital consent age in your jurisdiction). We do not knowingly collect personal information from children. If you believe we have, contact us and we will take appropriate steps.',
    ],
  },
  {
    id: 'third',
    title: '14. Third-party sites and chargers',
    paragraphs: [
      'The platform may link to third-party sites or depend on hardware at charging locations. Their privacy practices are governed by their own policies, not this one.',
    ],
  },
  {
    id: 'changes',
    title: '15. Changes to this policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time. We will post the new version here and update the “Last updated” date. Where required by law or by app store rules, we will provide additional notice for material changes.',
    ],
  },
  {
    id: 'contact',
    title: '16. Contact us',
    paragraphs: [
      'For privacy requests or questions, use the support URL or contact details shown on our Google Play and Apple App Store listings, or the in-app Help / support channel if available.',
      'You may also use the contact information published on our official website for Clean Motion Ghana / Energy Precisions.',
    ],
  },
];
