import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type StaffNavBack = {
  onBack: () => void;
  ariaLabel?: string;
};

type StaffPageChromeContextValue = {
  navBack: StaffNavBack | null;
  setNavBack: (back: StaffNavBack | null) => void;
};

const StaffPageChromeContext = createContext<StaffPageChromeContextValue | null>(null);

export function StaffPageChromeProvider({ children }: { children: ReactNode }) {
  const [navBack, setNavBackState] = useState<StaffNavBack | null>(null);

  const setNavBack = useCallback((back: StaffNavBack | null) => {
    setNavBackState(back);
  }, []);

  const value = useMemo(
    () => ({
      navBack,
      setNavBack,
    }),
    [navBack, setNavBack],
  );

  return (
    <StaffPageChromeContext.Provider value={value}>{children}</StaffPageChromeContext.Provider>
  );
}

export function useStaffPageChrome() {
  return useContext(StaffPageChromeContext);
}
