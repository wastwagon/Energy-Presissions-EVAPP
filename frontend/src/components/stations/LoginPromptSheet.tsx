import { Button, Typography } from '@mui/material';
import { AdaptiveSheet } from '../ios/AdaptiveSheet';
import { authPageBodySx, compactContainedCtaSx, compactOutlinedCtaSx, sxObject } from '../../styles/authShell';
import { triggerHaptic } from '../../utils/haptics';

type LoginPromptSheetProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function LoginPromptSheet({ open, onClose, onConfirm }: LoginPromptSheetProps) {
  return (
    <AdaptiveSheet
      open={open}
      onClose={onClose}
      title="Log in required"
      maxWidth="xs"
      actions={
        <>
          <Button onClick={onClose} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={() => {
              triggerHaptic('light');
              onConfirm();
            }}
            sx={(th) => sxObject(th, compactContainedCtaSx)}
          >
            Log in
          </Button>
        </>
      }
    >
      <Typography component="p" sx={authPageBodySx}>
        Log in to start charging. Continue to the login page?
      </Typography>
    </AdaptiveSheet>
  );
}
