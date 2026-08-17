import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeProvider, useTheme } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { iosFontStacks } from '../theme/iosMobileTokens';
import { APP_MAIN_CONTENT_ID } from '../constants/a11y';

export type CustomerNavBack = {
  onBack: () => void;
  ariaLabel?: string;
};

type CustomerPageChromeContextValue = {
  pageTitle: string | null;
  setPageTitle: (title: string | null) => void;
  showCompactNavTitle: boolean;
  registerTitleSentinel: (node: HTMLElement | null) => void;
  navBack: CustomerNavBack | null;
  setNavBack: (back: CustomerNavBack | null) => void;
};

const CustomerPageChromeContext = createContext<CustomerPageChromeContextValue | null>(null);

function CustomerScrollTitleObserver({
  sentinelEl,
  enabled,
  onCompactChange,
}: {
  sentinelEl: HTMLElement | null;
  enabled: boolean;
  onCompactChange: (compact: boolean) => void;
}) {
  useEffect(() => {
    if (!enabled || !sentinelEl) {
      onCompactChange(false);
      return;
    }
    const root = document.getElementById(APP_MAIN_CONTENT_ID);
    if (!root) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        onCompactChange(!entry.isIntersecting);
      },
      { root, threshold: 0, rootMargin: '-1px 0px 0px 0px' },
    );

    observer.observe(sentinelEl);
    return () => observer.disconnect();
  }, [sentinelEl, enabled, onCompactChange]);

  return null;
}

  /** SF Pro typography for customer routes. */
function CustomerTypographyLayer({ children }: { children: ReactNode }) {
  const outerTheme = useTheme();
  const customerTheme = useMemo(
    () =>
      createTheme(outerTheme, {
        typography: {
          fontFamily: iosFontStacks.ui,
          h1: { fontFamily: iosFontStacks.ui },
          h2: { fontFamily: iosFontStacks.ui },
          h3: { fontFamily: iosFontStacks.ui },
          h4: { fontFamily: iosFontStacks.ui },
          h5: { fontFamily: iosFontStacks.ui },
          h6: { fontFamily: iosFontStacks.ui },
          button: { fontFamily: iosFontStacks.ui },
        },
      }),
    [outerTheme],
  );

  return <ThemeProvider theme={customerTheme}>{children}</ThemeProvider>;
}

export function CustomerPageChromeProvider({ children }: { children: ReactNode }) {
  const [pageTitle, setPageTitle] = useState<string | null>(null);
  const [showCompactNavTitle, setShowCompactNavTitle] = useState(false);
  const [sentinelEl, setSentinelEl] = useState<HTMLElement | null>(null);
  const [navBack, setNavBack] = useState<CustomerNavBack | null>(null);

  const registerTitleSentinel = useCallback((node: HTMLElement | null) => {
    setSentinelEl(node);
  }, []);

  const onCompactChange = useCallback((compact: boolean) => {
    setShowCompactNavTitle(compact);
  }, []);

  const value = useMemo(
    () => ({
      pageTitle,
      setPageTitle,
      showCompactNavTitle,
      registerTitleSentinel,
      navBack,
      setNavBack,
    }),
    [pageTitle, showCompactNavTitle, registerTitleSentinel, navBack],
  );

  return (
    <CustomerPageChromeContext.Provider value={value}>
      <CustomerTypographyLayer>
        <CustomerScrollTitleObserver
          sentinelEl={sentinelEl}
          enabled={Boolean(pageTitle)}
          onCompactChange={onCompactChange}
        />
        {children}
      </CustomerTypographyLayer>
    </CustomerPageChromeContext.Provider>
  );
}

export function useCustomerPageChrome() {
  return useContext(CustomerPageChromeContext);
}
