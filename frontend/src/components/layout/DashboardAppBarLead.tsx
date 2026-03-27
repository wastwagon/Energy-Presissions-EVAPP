import { useState } from 'react';
import { Box, Breadcrumbs, Link, TextField, Typography, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Link as RouterLink, useLocation } from 'react-router-dom';

function pathToCrumbs(pathname: string) {
  const normalized = pathname.replace(/\/$/, '') || '/';
  if (normalized === '/') return [{ path: '/', label: 'Home' }];
  const segments = normalized.split('/').filter(Boolean);
  let acc = '';
  return segments.map((seg) => {
    acc += `/${seg}`;
    const label = seg
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return { path: acc, label };
  });
}

/**
 * Top bar: path breadcrumbs + search field (UI only; wire to global search when backend is ready).
 */
export function DashboardAppBarLead() {
  const { pathname } = useLocation();
  const crumbs = pathToCrumbs(pathname);
  const [query, setQuery] = useState('');

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1, sm: 2 },
        minWidth: 0,
        mr: { xs: 1, sm: 2 },
      }}
    >
      <Breadcrumbs
        maxItems={4}
        sx={{
          display: { xs: 'none', md: 'flex' },
          '& .MuiBreadcrumbs-separator': { mx: 0.5 },
          minWidth: 0,
        }}
      >
        {crumbs.map((c, i) =>
          i === crumbs.length - 1 ? (
            <Typography key={c.path} color="text.primary" variant="body2" fontWeight={600} noWrap>
              {c.label}
            </Typography>
          ) : (
            <Link
              key={c.path}
              component={RouterLink}
              to={c.path}
              underline="hover"
              color="inherit"
              variant="body2"
              sx={{ maxWidth: 140 }}
              noWrap
            >
              {c.label}
            </Link>
          ),
        )}
      </Breadcrumbs>
      <TextField
        size="small"
        placeholder="Search…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.preventDefault();
        }}
        aria-label="Search"
        sx={{
          flex: 1,
          maxWidth: { xs: 140, sm: 280, md: 380 },
          minWidth: 0,
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" color="action" />
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
}
