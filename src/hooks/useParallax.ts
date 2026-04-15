import { useRef, useEffect, useCallback } from "react";

/**
 * useParallax — Tracks pointer position and scroll offset for parallax effects.
 * Returns normalized values for use in r3f useFrame and DOM transforms.
 */

export interface ParallaxState {
  /** Pointer X: -1 (left) to 1 (right) */
  pointerX: number;
  /** Pointer Y: -1 (top) to 1 (bottom) */
  pointerY: number;
  /** Scroll offset in pixels */
  scrollY: number;
  /** Scroll progress 0-1 */
  scrollProgress: number;
}

export function useParallax() {
  const state = useRef<ParallaxState>({
    pointerX: 0,
    pointerY: 0,
    scrollY: 0,
    scrollProgress: 0,
  });

  const handlePointer = useCallback((e: MouseEvent | TouchEvent) => {
    let x: number, y: number;
    if ("touches" in e && e.touches.length > 0) {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    } else if ("clientX" in e) {
      x = e.clientX;
      y = e.clientY;
    } else return;

    state.current.pointerX = (x / window.innerWidth) * 2 - 1;
    state.current.pointerY = (y / window.innerHeight) * 2 - 1;
  }, []);

  const handleScroll = useCallback(() => {
    state.current.scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    state.current.scrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handlePointer, { passive: true });
    window.addEventListener("touchmove", handlePointer, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handlePointer);
      window.removeEventListener("touchmove", handlePointer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handlePointer, handleScroll]);

  return state;
}
