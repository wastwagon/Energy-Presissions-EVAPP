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
  pulling: boolean;
  setPulling: (v: boolean) => void;
};

const CustomerPullRefreshContext = createContext<CustomerPullRefreshContextValue | null>(null);

export function CustomerPullRefreshProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<RefreshHandler | null>(null);
  const [pulling, setPulling] = useState(false);

  const register = useCallback((handler: RefreshHandler | null) => {
    handlerRef.current = handler;
  }, []);

  const getHandler = useCallback(() => handlerRef.current, []);

  const value = useMemo(
    () => ({
      register,
      getHandler,
      pulling,
      setPulling,
    }),
    [register, getHandler, pulling],
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
