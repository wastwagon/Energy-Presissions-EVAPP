/**
 * Terms of Service copy with common Play / App Store–friendly themes (paid features, third-party platforms, termination).
 * Have counsel review and set governing law / venue to match your entity. Not legal advice.
 */
export const TERMS_LAST_UPDATED = 'April 2026';

export type TermsSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export const TERMS_SECTIONS: TermsSection[] = [
  {
    id: 'agreement',
    title: '1. Agreement and eligibility',
    paragraphs: [
      'These Terms of Service (“Terms”) govern your use of Clean Motion Ghana’s (“we”, “us”) EV charging discovery, session, wallet, and billing platform, including when you access it through a web browser or a mobile wrapper (for example WebView-based apps distributed on Google Play or the Apple App Store).',
      'By creating an account, tapping “I agree”, or continuing to use the service, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the service.',
      'You must be at least the minimum age required in your jurisdiction to enter a binding contract (typically 18, or the digital consent age where higher). The service is not for children under 13 as described in our Privacy Policy.',
    ],
  },
  {
    id: 'service',
    title: '2. The service',
    paragraphs: [
      'We provide software to discover charge points, start and stop charging where supported, manage wallet or card payments, view history, and use related operator or admin features where your role allows. Hardware, networks, site operators, and payment networks are third parties; we do not guarantee uninterrupted availability or that every charger will work at all times.',
    ],
  },
  {
    id: 'account',
    title: '3. Your account',
    paragraphs: [
      'You must provide accurate registration information and keep your credentials secure. You are responsible for activity under your account unless you notify us promptly of unauthorised use.',
      'Sign in with Apple and Google Sign-In are subject to those providers’ terms and privacy policies. You may need to share name or email with us as permitted by the sign-in flow to create or link your account.',
    ],
  },
  {
    id: 'payments',
    title: '4. Fees, wallet, and payments',
    paragraphs: [
      'Prices, taxes, fees, and currency are shown in the product or on invoices where applicable. Charges may be processed by our payment partners (such as Paystack). You authorise us and our partners to charge your selected payment method or deduct from your wallet according to the rules shown at checkout or in your account.',
      'Refunds and chargebacks, where available, follow applicable law, the payment provider’s rules, and any in-app or posted refund policy. Disputes about card or wallet charges may need to be raised with your bank or the payment provider as well as with our support team.',
    ],
  },
  {
    id: 'acceptable',
    title: '5. Acceptable use',
    paragraphs: [
      'You must not misuse the service, interfere with charging equipment or networks, scrape or overload our systems without permission, attempt unauthorised access, misrepresent your identity, or violate applicable law. We may suspend or terminate access for violations, risk, or non-payment where permitted.',
    ],
  },
  {
    id: 'ip',
    title: '6. Intellectual property',
    paragraphs: [
      'The platform, branding, and content we provide are owned by us or our licensors. We grant you a limited, non-exclusive, non-transferable right to use the service for its intended purpose. You may not copy, reverse engineer, or remove proprietary notices except as allowed by law.',
    ],
  },
  {
    id: 'disclaimers',
    title: '7. Disclaimers',
    paragraphs: [
      'To the fullest extent permitted by law, the service is provided “as is” and “as available”. We disclaim implied warranties such as merchantability or fitness for a particular purpose where the law allows. We do not warrant that the service will be error-free or that third-party equipment or networks will always function.',
    ],
  },
  {
    id: 'liability',
    title: '8. Limitation of liability',
    paragraphs: [
      'To the extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive damages, or loss of profits, data, or goodwill, arising from your use of the service or third-party chargers, except where liability cannot be excluded or limited (for example death or personal injury caused by negligence where the law forbids exclusion).',
      'Our aggregate liability for claims relating to the service in any twelve-month period is limited to the greater of (a) the fees you paid us for the service in that period or (b) a nominal amount where you only use free features, unless mandatory law requires otherwise.',
    ],
  },
  {
    id: 'indemnity',
    title: '9. Indemnity',
    paragraphs: [
      'You will defend and indemnify us against third-party claims, damages, and costs (including reasonable legal fees) arising from your misuse of the service, violation of these Terms, or violation of others’ rights, to the extent permitted by law.',
    ],
  },
  {
    id: 'termination',
    title: '10. Termination',
    paragraphs: [
      'You may stop using the service at any time. Customer accounts may be deleted as described in our Privacy Policy where self-service deletion is available. We may suspend or terminate access for breach, risk, legal requirement, or discontinuation of the service with reasonable notice where practicable.',
      'Provisions that by their nature should survive (including payment obligations accrued before termination, liability limits where enforceable, and governing law) will survive.',
    ],
  },
  {
    id: 'changes',
    title: '11. Changes',
    paragraphs: [
      'We may modify these Terms or the service. We will post updated Terms and update the “Last updated” date. Where required by law or app store rules, we will provide additional notice for material changes. Continued use after the effective date may constitute acceptance where permitted by law.',
    ],
  },
  {
    id: 'law',
    title: '12. Governing law and disputes',
    paragraphs: [
      'These Terms are governed by the laws of the Republic of Ghana, excluding conflict-of-law rules, unless mandatory consumer protection law in your country gives you non-waivable rights.',
      'Courts in Ghana have non-exclusive jurisdiction unless your local law requires otherwise. You may also use mediation or consumer dispute schemes where available in your region.',
    ],
  },
  {
    id: 'third-party-stores',
    title: '13. Third-party app stores',
    paragraphs: [
      'If you obtained the app through the Apple App Store, you acknowledge that these Terms are between you and Clean Motion Ghana only, not Apple. Apple is not responsible for the service or its content. Apple has no obligation to provide maintenance or support for the app. If the app fails to conform to any applicable warranty, you may notify Apple and Apple may refund the purchase price for the app to you where applicable; to the maximum extent permitted by law, Apple has no other warranty obligation. Apple and Apple’s subsidiaries are third-party beneficiaries of these Terms solely as needed to enforce the foregoing.',
      'If you obtained the app through Google Play, Google may apply Google Play’s terms of service in addition to these Terms where Google requires. Google is not responsible for the service except as stated in Google Play’s terms.',
    ],
  },
  {
    id: 'contact',
    title: '14. Contact',
    paragraphs: [
      'For support, billing questions, or legal notices, use the contact URL or email shown on our Google Play and Apple App Store listings, or the in-app support channel if available.',
    ],
  },
];
