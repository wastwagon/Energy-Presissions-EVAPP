import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { APP_MAIN_CONTENT_ID } from '../constants/a11y';

export type StaffNavBack = {
  onBack: () => void;
  ariaLabel?: string;
};

type StaffPageChromeContextValue = {
  navBack: StaffNavBack | null;
  setNavBack: (back: StaffNavBack | null) => void;
  pageTitle: string | null;
  setPageTitle: (title: string | null) => void;
  showCompactNavTitle: boolean;
  registerTitleSentinel: (node: HTMLElement | null) => void;
};

const StaffPageChromeContext = createContext<StaffPageChromeContextValue | null>(null);

function StaffScrollTitleObserver({
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

export function StaffPageChromeProvider({ children }: { children: ReactNode }) {
  const [navBack, setNavBackState] = useState<StaffNavBack | null>(null);
  const [pageTitle, setPageTitle] = useState<string | null>(null);
  const [showCompactNavTitle, setShowCompactNavTitle] = useState(false);
  const [sentinelEl, setSentinelEl] = useState<HTMLElement | null>(null);

  const setNavBack = useCallback((back: StaffNavBack | null) => {
    setNavBackState(back);
  }, []);

  const registerTitleSentinel = useCallback((node: HTMLElement | null) => {
    setSentinelEl(node);
  }, []);

  const onCompactChange = useCallback((compact: boolean) => {
    setShowCompactNavTitle(compact);
  }, []);

  const value = useMemo(
    () => ({
      navBack,
      setNavBack,
      pageTitle,
      setPageTitle,
      showCompactNavTitle,
      registerTitleSentinel,
    }),
    [navBack, setNavBack, pageTitle, showCompactNavTitle, registerTitleSentinel],
  );

  return (
    <StaffPageChromeContext.Provider value={value}>
      <StaffScrollTitleObserver
        sentinelEl={sentinelEl}
        enabled={Boolean(pageTitle)}
        onCompactChange={onCompactChange}
      />
      {children}
    </StaffPageChromeContext.Provider>
  );
}

export function useStaffPageChrome() {
  return useContext(StaffPageChromeContext);
}
