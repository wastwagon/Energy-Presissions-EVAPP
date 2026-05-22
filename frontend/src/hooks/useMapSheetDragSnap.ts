import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { triggerHaptic } from '../utils/haptics';

export type MapSheetSnap = 'peek' | 'half' | 'full';

export const MAP_SHEET_SNAP_VH: Record<MapSheetSnap, number> = {
  peek: 28,
  half: 52,
  full: 78,
};

const SNAP_ORDER: MapSheetSnap[] = ['peek', 'half', 'full'];

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function snapFromVh(vh: number): MapSheetSnap {
  let best: MapSheetSnap = 'half';
  let bestDist = Infinity;
  for (const key of SNAP_ORDER) {
    const dist = Math.abs(MAP_SHEET_SNAP_VH[key] - vh);
    if (dist < bestDist) {
      bestDist = dist;
      best = key;
    }
  }
  return best;
}

type UseMapSheetDragSnapOptions = {
  initialSnap?: MapSheetSnap;
  /** Pixels of vertical movement before a tap is treated as a drag. */
  dragThresholdPx?: number;
};

/**
 * Peek / half / full sheet heights with tap-to-cycle and pointer drag on the handle.
 */
export function useMapSheetDragSnap({ initialSnap = 'half', dragThresholdPx = 8 }: UseMapSheetDragSnapOptions = {}) {
  const [snap, setSnap] = useState<MapSheetSnap>(initialSnap);
  const [dragVh, setDragVh] = useState<number | null>(null);
  const startRef = useRef<{ pointerY: number; startVh: number } | null>(null);
  const draggedRef = useRef(false);
  const dragVhRef = useRef<number | null>(null);

  const resolvedMaxHeight =
    dragVh != null
      ? `${dragVh}dvh`
      : snap === 'full'
        ? 'min(78dvh, 640px)'
        : `${MAP_SHEET_SNAP_VH[snap]}dvh`;

  const cycleSnap = useCallback(() => {
    triggerHaptic('light');
    setSnap((s) => (s === 'peek' ? 'half' : s === 'half' ? 'full' : 'peek'));
  }, []);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      const startVh = MAP_SHEET_SNAP_VH[snap];
      startRef.current = { pointerY: e.clientY, startVh };
      draggedRef.current = false;
      dragVhRef.current = startVh;
      setDragVh(startVh);
    },
    [snap],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!startRef.current) return;
      const deltaY = e.clientY - startRef.current.pointerY;
      if (Math.abs(deltaY) > dragThresholdPx) {
        draggedRef.current = true;
      }
      const nextVh = clamp(startRef.current.startVh - deltaY * 0.12, 24, 84);
      dragVhRef.current = nextVh;
      setDragVh(nextVh);
    },
    [dragThresholdPx],
  );

  const finishPointer = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      /* ignore */
    }
    if (draggedRef.current && dragVhRef.current != null) {
      setSnap(snapFromVh(dragVhRef.current));
      triggerHaptic('light');
    }
    startRef.current = null;
    dragVhRef.current = null;
    setDragVh(null);
  }, []);

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      finishPointer(e);
    },
    [finishPointer],
  );

  const handlePointerCancel = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      draggedRef.current = false;
      finishPointer(e);
    },
    [finishPointer],
  );

  const handleSnapToggleClick = useCallback(() => {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    cycleSnap();
  }, [cycleSnap]);

  return {
    snap,
    setSnap,
    resolvedMaxHeight,
    isDragging: dragVh != null,
    cycleSnap,
    sheetDragHandleProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      onSnapToggle: handleSnapToggleClick,
    },
  };
}
