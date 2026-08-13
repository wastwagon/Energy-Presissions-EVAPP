import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import {
  adminMenuConfig,
  superAdminMenuConfig,
  type MenuSection,
} from '../../config/menu.config';
import { getStoredAccountType } from '../../utils/authSession';
import { authFormFieldSx, premiumDialogPaperSx, sxObject } from '../../styles/authShell';

export type StaffCommandPaletteVariant = 'admin' | 'superadmin';

type CommandItem = {
  id: string;
  label: string;
  path: string;
  hint: string;
  shortcut?: string;
};

function flattenMenu(sections: MenuSection[]): CommandItem[] {
  const role = getStoredAccountType();
  const items: CommandItem[] = [];
  for (const section of sections) {
    for (const item of section.items) {
      if (item.disabled) continue;
      if (item.roles?.length && role && !item.roles.includes(role)) continue;
      items.push({
        id: `${section.id}-${item.id}`,
        label: item.text,
        path: item.path,
        hint: section.title,
        shortcut: item.shortcut,
      });
    }
  }
  return items;
}

export function staffModifierKeyLabel(): string {
  if (typeof navigator === 'undefined') return 'Ctrl+';
  return /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+';
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest('[contenteditable="true"]'));
}

function flattenGoTargets(sections: MenuSection[]): Array<{ path: string; goKey: string }> {
  const role = getStoredAccountType();
  const items: Array<{ path: string; goKey: string }> = [];
  for (const section of sections) {
    for (const item of section.items) {
      if (item.disabled) continue;
      if (item.roles?.length && role && !item.roles.includes(role)) continue;
      const match = item.shortcut?.match(/^G ([A-Z0-9])$/i);
      if (match) items.push({ path: item.path, goKey: match[1].toLowerCase() });
    }
  }
  return items;
}

/** GitHub-style: press G, then a letter, when not typing in a field. */
export function useStaffGoShortcuts(variant: StaffCommandPaletteVariant) {
  const navigate = useNavigate();

  useEffect(() => {
    const targets = flattenGoTargets(variant === 'superadmin' ? superAdminMenuConfig : adminMenuConfig);
    const byKey = new Map(targets.map((item) => [item.goKey, item.path]));
    let pending = false;
    let timer: number | undefined;

    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (!pending) {
        if (key === 'g') {
          pending = true;
          timer = window.setTimeout(() => {
            pending = false;
          }, 800);
        }
        return;
      }
      pending = false;
      if (timer) window.clearTimeout(timer);
      const path = byKey.get(key);
      if (!path) return;
      event.preventDefault();
      navigate(path);
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (timer) window.clearTimeout(timer);
    };
  }, [navigate, variant]);
}

export function useStaffCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return;
      event.preventDefault();
      setOpen((value) => !value);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return { open, setOpen };
}

export function StaffCommandPalette({
  open,
  onClose,
  variant,
}: {
  open: boolean;
  onClose: () => void;
  variant: StaffCommandPaletteVariant;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const mod = staffModifierKeyLabel();

  const items = useMemo(
    () => flattenMenu(variant === 'superadmin' ? superAdminMenuConfig : adminMenuConfig),
    [variant],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.hint.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q) ||
        (item.shortcut && item.shortcut.toLowerCase().includes(q)),
    );
  }, [items, query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
    >
      <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem', pb: 1 }}>Jump to</DialogTitle>
      <DialogContent sx={{ pt: 0, px: { xs: 2, sm: 2.5 }, pb: 2 }}>
        <TextField
          autoFocus
          fullWidth
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Devices, sessions, a page name…"
          inputProps={{ 'aria-label': 'Search staff pages' }}
          sx={(th) => sxObject(th, authFormFieldSx)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (event.key === 'Enter') {
              event.preventDefault();
              const item = filtered[activeIndex];
              if (item) go(item.path);
            }
          }}
        />
        <List dense disablePadding sx={{ mt: 1, maxHeight: 320, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No matching pages.
            </Typography>
          ) : (
            filtered.map((item, index) => (
              <ListItemButton
                key={item.id}
                selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => go(item.path)}
                sx={{ minHeight: 44, borderRadius: 1 }}
              >
                <ListItemText
                  primary={item.label}
                  secondary={item.hint}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
                {item.shortcut ? (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1, fontVariantNumeric: 'tabular-nums' }}>
                    {item.shortcut}
                  </Typography>
                ) : null}
              </ListItemButton>
            ))
          )}
        </List>
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            {mod}K open · G then a letter jumps · ↑↓ move · Enter open · Esc close
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
