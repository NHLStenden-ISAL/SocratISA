/**
 * useAutoFocus: focust een element wanneer de component mount.
 */
import { useEffect, type RefObject } from 'react';

export function useAutoFocus(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    ref.current?.focus();
  }, [ref]);
}
