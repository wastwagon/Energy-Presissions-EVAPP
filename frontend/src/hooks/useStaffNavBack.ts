import { useEffect } from 'react';
import { useStaffPageChrome } from '../contexts/StaffPageChromeContext';

/** Registers back affordance in staff AppBar on mobile/tablet (admin / superadmin layouts). */
export function useStaffNavBack(onBack: () => void, ariaLabel = 'Back') {
  const chrome = useStaffPageChrome();

  useEffect(() => {
    if (!chrome) return;
    chrome.setNavBack({ onBack, ariaLabel });
    return () => chrome.setNavBack(null);
  }, [chrome, onBack, ariaLabel]);
}
