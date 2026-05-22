import { useEffect } from 'react';
import { useCustomerPageChrome } from '../contexts/CustomerPageChromeContext';

/** Registers iOS-style back affordance in the customer AppBar (mobile). */
export function useCustomerNavBack(onBack: () => void, ariaLabel = 'Back') {
  const chrome = useCustomerPageChrome();

  useEffect(() => {
    if (!chrome) return;
    chrome.setNavBack({ onBack, ariaLabel });
    return () => chrome.setNavBack(null);
  }, [chrome, onBack, ariaLabel]);
}
