import { useCallback, useMemo, useState } from 'react';

export function useStaffSelection(visibleIds: Array<string | number>) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const visible = useMemo(() => visibleIds.map(String), [visibleIds]);

  const selectedVisible = useMemo(() => {
    const allow = new Set(visible);
    return new Set([...selected].filter((id) => allow.has(id)));
  }, [selected, visible]);

  const allSelected = visible.length > 0 && visible.every((id) => selectedVisible.has(id));
  const someSelected = selectedVisible.size > 0 && !allSelected;

  const toggle = useCallback((id: string | number) => {
    const key = String(id);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allOn = visible.length > 0 && visible.every((id) => next.has(id));
      if (allOn) {
        for (const id of visible) next.delete(id);
      } else {
        for (const id of visible) next.add(id);
      }
      return next;
    });
  }, [visible]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isSelected = useCallback(
    (id: string | number) => selectedVisible.has(String(id)),
    [selectedVisible],
  );

  return {
    selected: selectedVisible,
    selectedCount: selectedVisible.size,
    allSelected,
    someSelected,
    toggle,
    toggleAll,
    clear,
    isSelected,
  };
}
