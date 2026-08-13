import { Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { compactContainedCtaSx, sxObject } from '../../styles/authShell';
import { formatCurrency } from '../../utils/formatters';
import { triggerHaptic } from '../../utils/haptics';
import { GroupedListSection } from '../ios/GroupedListSection';

export type CustomerWalletFunds = {
  available: number;
  reserved: number;
  total: number;
  currency: string;
};

type CustomerWalletBalanceHeroProps = {
  funds: CustomerWalletFunds;
  onTopUp: () => void;
};

/** Apple Wallet–style available balance, then a single Top up action. */
export function CustomerWalletBalanceHero({ funds, onTopUp }: CustomerWalletBalanceHeroProps) {
  return (
    <GroupedListSection>
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          Available
        </Typography>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '2rem', sm: '2.375rem' },
            letterSpacing: '-0.04em',
            lineHeight: 1.12,
            mt: 0.5,
            wordBreak: 'break-word',
          }}
        >
          {formatCurrency(funds.available, funds.currency)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {funds.reserved > 0
            ? `${formatCurrency(funds.reserved, funds.currency)} on hold · ${formatCurrency(funds.total, funds.currency)} total`
            : `Total ${formatCurrency(funds.total, funds.currency)}`}
        </Typography>
        <Button
          variant="contained"
          disableElevation
          fullWidth
          startIcon={<AddIcon />}
          onClick={() => {
            triggerHaptic('light');
            onTopUp();
          }}
          sx={(th) => ({
            ...sxObject(th, compactContainedCtaSx),
            mt: 2,
            minHeight: 48,
            width: '100%',
          })}
        >
          Top up
        </Button>
      </Box>
    </GroupedListSection>
  );
}
