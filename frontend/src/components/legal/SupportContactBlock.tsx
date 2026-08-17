import { Link, Typography } from '@mui/material';
import { SUPPORT_EMAIL, getSupportPhone } from '../../legal/supportPageContent';
import { authPageLinkSx } from '../../styles/authShell';

/** Shared support email (and optional phone) for status / legal screens. */
export function SupportContactBlock() {
  const phone = getSupportPhone();

  return (
    <>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 700, letterSpacing: '0.06em' }}
      >
        SUPPORT
      </Typography>
      <Link
        href={`mailto:${SUPPORT_EMAIL}`}
        sx={{ ...authPageLinkSx, display: 'flex', fontWeight: 600, mt: 0.75 }}
      >
        {SUPPORT_EMAIL}
      </Link>
      {phone ? (
        <Link href={phone.tel} sx={{ ...authPageLinkSx, display: 'flex', fontWeight: 600 }}>
          {phone.display}
        </Link>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
          Email is the fastest way to reach us.
        </Typography>
      )}
    </>
  );
}
