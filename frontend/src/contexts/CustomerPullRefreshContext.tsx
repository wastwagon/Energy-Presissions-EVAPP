import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type RefreshHandler = () => void | Promise<void>;

type CustomerPullRefreshContextValue = {
  register: (handler: RefreshHandler | null) => void;
  getHandler: () => RefreshHandler | null;
  hasRefreshHandler: boolean;
  pulling: boolean;
  setPulling: (v: boolean) => void;
};

const CustomerPullRefreshContext = createContext<CustomerPullRefreshContextValue | null>(null);

export function CustomerPullRefreshProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<RefreshHandler | null>(null);
  const [pulling, setPulling] = useState(false);

  const [hasRefreshHandler, setHasRefreshHandler] = useState(false);

  const register = useCallback((handler: RefreshHandler | null) => {
    handlerRef.current = handler;
    setHasRefreshHandler(handler != null);
  }, []);

  const getHandler = useCallback(() => handlerRef.current, []);

  const value = useMemo(
    () => ({
      register,
      getHandler,
      hasRefreshHandler,
      pulling,
      setPulling,
    }),
    [register, getHandler, hasRefreshHandler, pulling],
  );

  return (
    <CustomerPullRefreshContext.Provider value={value}>{children}</CustomerPullRefreshContext.Provider>
  );
}

export function useCustomerPullRefresh(handler: RefreshHandler) {
  const ctx = useContext(CustomerPullRefreshContext);

  useEffect(() => {
    if (!ctx) return;
    ctx.register(handler);
    return () => ctx.register(null);
  }, [ctx, handler]);
}

export function useCustomerPullRefreshContext() {
  return useContext(CustomerPullRefreshContext);
}
