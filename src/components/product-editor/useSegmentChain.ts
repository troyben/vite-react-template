// ---------------------------------------------------------------------------
// React state wrapper over the pure chain model (chain-model.ts). Owns the
// current Chain plus which segment/connector is active for editing. All
// mutation logic (attach/remove/clone) lives in chain-model.ts — this hook
// only sequences state updates and derives selection.
// ---------------------------------------------------------------------------

import { useCallback, useState } from 'react';
import type { Segment } from '@/components/product-editor/types';
import {
  applyConnectorRemoval,
  chainToProductData,
  makeSegment,
  normalizeToChain,
  DEFAULT_CONNECTOR_ANGLE,
  DEFAULT_POST_WIDTH,
} from '@/components/product-editor/canvas/utils/chain-model';
import type { Chain } from '@/components/product-editor/canvas/utils/chain-model';

const MIN_ANGLE = 1;
const MAX_ANGLE = 359;

export function clampAngle(angle: number): number {
  if (!Number.isFinite(angle)) return DEFAULT_CONNECTOR_ANGLE;
  return Math.min(MAX_ANGLE, Math.max(MIN_ANGLE, Math.round(angle)));
}

/**
 * Clamp a possibly-malformed index (e.g. a `rootIndex` copied straight out of
 * a corrupted stored payload by `normalizeToChain`, which does not bounds
 * check it) into a valid `[0, length)` array index.
 */
function clampToRange(index: number, length: number): number {
  if (length <= 0) return 0;
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(index, 0), length - 1);
}

function singleSegmentChain(width: number): Chain {
  return { segments: [makeSegment(width)], connectors: [], rootIndex: 0 };
}

export function useSegmentChain(initialWidth = 1000) {
  const [chain, setChain] = useState<Chain>(() => singleSegmentChain(initialWidth));
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [activeConnectorIndex, setActiveConnectorIndex] = useState<number | null>(null);

  const updateSegment = useCallback((index: number, updates: Partial<Segment>) => {
    setChain((prev) => ({
      ...prev,
      segments: prev.segments.map((s, i) => (i === index ? { ...s, ...updates } : s)),
    }));
  }, []);

  const updateActiveSegment = useCallback((updates: Partial<Segment>) => {
    setChain((prev) => ({
      ...prev,
      segments: prev.segments.map((s, i) => (i === activeSegmentIndex ? { ...s, ...updates } : s)),
    }));
  }, [activeSegmentIndex]);

  const attachSegment = useCallback((end: 'left' | 'right', width: number) => {
    const segment = makeSegment(width);
    const connector = {
      id: `conn-${segment.id}`,
      angle: DEFAULT_CONNECTOR_ANGLE,
      postWidth: DEFAULT_POST_WIDTH,
    };
    setChain((prev) => {
      const next =
        end === 'right'
          ? {
              segments: [...prev.segments, segment],
              connectors: [...prev.connectors, connector],
              rootIndex: prev.rootIndex,
            }
          : {
              segments: [segment, ...prev.segments],
              connectors: [connector, ...prev.connectors],
              rootIndex: prev.rootIndex + 1,
            };
      setActiveSegmentIndex(end === 'right' ? next.segments.length - 1 : 0);
      setActiveConnectorIndex(end === 'right' ? next.connectors.length - 1 : 0);
      return next;
    });
  }, []);

  const setConnectorAngle = useCallback((index: number, angle: number) => {
    setChain((prev) => ({
      ...prev,
      connectors: prev.connectors.map((c, i) => (i === index ? { ...c, angle: clampAngle(angle) } : c)),
    }));
  }, []);

  const setConnectorPostWidth = useCallback((index: number, postWidth: number) => {
    const safe = Number.isFinite(postWidth) && postWidth >= 0 ? postWidth : DEFAULT_POST_WIDTH;
    setChain((prev) => ({
      ...prev,
      connectors: prev.connectors.map((c, i) => (i === index ? { ...c, postWidth: safe } : c)),
    }));
  }, []);

  const removeConnector = useCallback((index: number) => {
    setChain((prev) => {
      const next = applyConnectorRemoval(prev, index);
      setActiveSegmentIndex(clampToRange(next.rootIndex, next.segments.length));
      setActiveConnectorIndex(null);
      return next;
    });
  }, []);

  const loadChain = useCallback((next: Chain) => {
    const rootIndex = clampToRange(next.rootIndex, next.segments.length);
    setChain({ ...next, rootIndex });
    setActiveSegmentIndex(rootIndex);
    setActiveConnectorIndex(null);
  }, []);

  const resetChain = useCallback((width: number) => {
    setChain(singleSegmentChain(width));
    setActiveSegmentIndex(0);
    setActiveConnectorIndex(null);
  }, []);

  const toProductData = useCallback(() => chainToProductData(chain), [chain]);

  const activeSegment = chain.segments[activeSegmentIndex] ?? chain.segments[0];

  return {
    chain,
    activeSegment,
    activeSegmentIndex,
    activeConnectorIndex,
    setActiveSegmentIndex,
    setActiveConnectorIndex,
    updateSegment,
    updateActiveSegment,
    attachSegment,
    setConnectorAngle,
    setConnectorPostWidth,
    removeConnector,
    loadChain,
    resetChain,
    toProductData,
  };
}

export { normalizeToChain };
export type { Chain };
export type SegmentChainState = ReturnType<typeof useSegmentChain>;
