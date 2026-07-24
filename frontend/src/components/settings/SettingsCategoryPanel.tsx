import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Switch,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { authFormFieldSx, premiumIconButtonTouchSx, sxObject } from '../../styles/authShell';
import { GroupedListSection } from '../ios/GroupedListSection';
import { GroupedListRow } from '../ios/GroupedListRow';

export type SettingRecord = {
  key: string;
  value?: string;
  description?: string;
  dataType?: string;
};

function formatSettingDisplayValue(setting: SettingRecord): string {
  if (setting.dataType === 'boolean') {
    return setting.value === 'true' || setting.value === '1' ? 'Enabled' : 'Disabled';
  }
  if (setting.key.includes('password') || setting.key.includes('secret') || setting.key.includes('key')) {
    return setting.value ? '••••••••' : 'Not set';
  }
  return setting.value || '—';
}

type SettingsCategoryPanelProps = {
  title: string;
  settings: SettingRecord[];
  useGroupedList: boolean;
  editingSetting: string | null;
  settingValue: string | boolean;
  onBeginEdit: (setting: SettingRecord) => void;
  onSave: (key: string) => void;
  onValueChange: (value: string) => void;
};

export function SettingsCategoryPanel({
  title,
  settings,
  useGroupedList,
  editingSetting,
  settingValue,
  onBeginEdit,
  onSave,
  onValueChange,
}: SettingsCategoryPanelProps) {
  const editingRecord = settings.find((s) => s.key === editingSetting);

  if (useGroupedList) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle1"
          sx={{ mt: 2, mb: 1.5, fontWeight: 600, letterSpacing: '-0.01em' }}
        >
          {title}
        </Typography>
        {settings.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
            No settings in this category.
          </Typography>
        ) : (
          <GroupedListSection>
            {settings.map((setting, index) => (
              <GroupedListRow
                key={setting.key}
                divider={index < settings.length - 1}
                primary={setting.key}
                secondary={formatSettingDisplayValue(setting)}
                onClick={() => onBeginEdit(setting)}
                aria-label={`Edit ${setting.key}`}
              />
            ))}
          </GroupedListSection>
        )}
        {editingRecord && editingSetting && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              {editingSetting}
            </Typography>
            {editingRecord.description && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                {editingRecord.description}
              </Typography>
            )}
            {editingRecord.dataType === 'boolean' ? (
              <Switch
                checked={settingValue === 'true' || settingValue === true}
                onChange={(e) => onValueChange(e.target.checked.toString())}
              />
            ) : (
              <TextField
                fullWidth
                type={
                  editingRecord.dataType === 'number'
                    ? 'number'
                    : editingRecord.key.includes('password') ||
                        editingRecord.key.includes('secret') ||
                        editingRecord.key.includes('key')
                      ? 'password'
                      : 'text'
                }
                value={String(settingValue ?? '')}
                onChange={(e) => onValueChange(e.target.value)}
                sx={(th) => sxObject(th, authFormFieldSx)}
              />
            )}
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <IconButton
                color="primary"
                onClick={() => onSave(editingSetting)}
                aria-label={`Save ${editingSetting}`}
                sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
              >
                <SaveIcon />
              </IconButton>
            </Box>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="subtitle1"
        sx={{ mt: 2, mb: 1.5, fontWeight: 600, letterSpacing: '-0.01em' }}
      >
        {title}
      </Typography>
      <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Setting</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {settings.map((setting) => (
              <TableRow key={setting.key}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {setting.key}
                  </Typography>
                </TableCell>
                <TableCell>
                  {editingSetting === setting.key ? (
                    setting.dataType === 'boolean' ? (
                      <Switch
                        checked={settingValue === 'true' || settingValue === true}
                        onChange={(e) => onValueChange(e.target.checked.toString())}
                      />
                    ) : (
                      <TextField
                        type={
                          setting.dataType === 'number'
                            ? 'number'
                            : setting.key.includes('password')
                              ? 'password'
                              : 'text'
                        }
                        value={String(settingValue ?? '')}
                        onChange={(e) => onValueChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') onSave(setting.key);
                        }}
                        autoFocus
                        sx={(th) => sxObject(th, authFormFieldSx)}
                      />
                    )
                  ) : (
                    <Typography variant="body2">{formatSettingDisplayValue(setting)}</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {setting.description || '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {editingSetting === setting.key ? (
                    <IconButton
                      size="small"
                      sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                      color="primary"
                      onClick={() => onSave(setting.key)}
                      aria-label={`Save setting ${setting.key}`}
                    >
                      <SaveIcon fontSize="small" />
                    </IconButton>
                  ) : (
                    <IconButton
                      size="small"
                      sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                      onClick={() => onBeginEdit(setting)}
                      aria-label={`Edit setting ${setting.key}`}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
