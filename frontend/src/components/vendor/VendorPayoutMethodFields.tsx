import { TextField, MenuItem, Typography } from '@mui/material';
import {
  PAYOUT_MOMO_NETWORKS,
  type VendorPayoutMethod,
} from '../../services/vendorApi';
import { authFormFieldSx, sxObject } from '../../styles/authShell';

export type VendorPayoutMethodForm = {
  payoutMethod: VendorPayoutMethod | '';
  payoutMomoNetwork: string;
  payoutMomoPhone: string;
  payoutBankName: string;
  payoutAccountName: string;
  payoutAccountNumber: string;
  payoutBankBranch: string;
};

export function VendorPayoutMethodFields({
  formData,
  onChange,
}: {
  formData: VendorPayoutMethodForm;
  onChange: (patch: Partial<VendorPayoutMethodForm>) => void;
}) {
  return (
    <>
      <TextField
        select
        fullWidth
        label="How you get paid"
        value={formData.payoutMethod}
        onChange={(e) => onChange({ payoutMethod: e.target.value as VendorPayoutMethod | '' })}
        helperText="Clean Motion sends settlement to this destination"
        sx={(th) => sxObject(th, authFormFieldSx)}
      >
        <MenuItem value="">Choose a method</MenuItem>
        <MenuItem value="mobile_money">Mobile money (MoMo)</MenuItem>
        <MenuItem value="bank">Bank transfer</MenuItem>
      </TextField>

      {formData.payoutMethod === 'mobile_money' ? (
        <>
          <TextField
            select
            fullWidth
            label="MoMo network"
            value={formData.payoutMomoNetwork}
            onChange={(e) => onChange({ payoutMomoNetwork: e.target.value })}
            sx={(th) => sxObject(th, authFormFieldSx)}
          >
            <MenuItem value="">Select network</MenuItem>
            {PAYOUT_MOMO_NETWORKS.map((network) => (
              <MenuItem key={network.value} value={network.value}>
                {network.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="MoMo number"
            value={formData.payoutMomoPhone}
            onChange={(e) => onChange({ payoutMomoPhone: e.target.value })}
            helperText="Ghana mobile money number that receives payouts"
            inputProps={{ inputMode: 'tel', autoComplete: 'tel' }}
            sx={(th) => sxObject(th, authFormFieldSx)}
          />
        </>
      ) : null}

      {formData.payoutMethod === 'bank' ? (
        <>
          <TextField
            fullWidth
            label="Bank name"
            value={formData.payoutBankName}
            onChange={(e) => onChange({ payoutBankName: e.target.value })}
            sx={(th) => sxObject(th, authFormFieldSx)}
          />
          <TextField
            fullWidth
            label="Account name"
            value={formData.payoutAccountName}
            onChange={(e) => onChange({ payoutAccountName: e.target.value })}
            helperText="Name on the account"
            sx={(th) => sxObject(th, authFormFieldSx)}
          />
          <TextField
            fullWidth
            label="Account number"
            value={formData.payoutAccountNumber}
            onChange={(e) => onChange({ payoutAccountNumber: e.target.value })}
            inputProps={{ inputMode: 'numeric', autoComplete: 'off' }}
            sx={(th) => sxObject(th, authFormFieldSx)}
          />
          <TextField
            fullWidth
            label="Branch (optional)"
            value={formData.payoutBankBranch}
            onChange={(e) => onChange({ payoutBankBranch: e.target.value })}
            sx={(th) => sxObject(th, authFormFieldSx)}
          />
        </>
      ) : null}

      {!formData.payoutMethod ? (
        <Typography variant="body2" color="text.secondary">
          Add MoMo or bank details so Clean Motion can pay you on the scheduled cycle.
        </Typography>
      ) : null}
    </>
  );
}
