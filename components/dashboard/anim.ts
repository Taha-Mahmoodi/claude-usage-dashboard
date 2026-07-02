"use client";

// Animation hooks. GSAP + anime.js are imported dynamically inside effects so they
// never enter the initial route bundle (perf rule). All respect reduced-motion.
import { useEffect, useLayoutEffect, useRef } from "react";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// GSAP entrance: stagger children matching `selector` into view on mount.
// Content is visible by default (no-JS safe); we hide pre-paint only when we will animate.
export function useEntrance<T extends HTMLElement>(selector: string) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const targets = Array.from(el.querySelectorAll<HTMLElement>(selector));
    if (targets.length === 0) return;
    const reveal = () =>
      targets.forEach((t) => {
        t.style.opacity = "";
        t.style.transform = "";
      });
    targets.forEach((t) => {
      t.style.opacity = "0";
      t.style.transform = "translateY(18px)";
    });
    let cancelled = false;
    let tween: { revert?: () => void } | undefined;
    import("gsap")
      .then(({ gsap }) => {
        if (cancelled) return reveal();
        tween = gsap.to(targets, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.06,
          clearProps: "opacity,transform",
        });
      })
      .catch(reveal);
    return () => {
      cancelled = true;
      tween?.revert?.();
      reveal();
    };
  }, [selector]);
  return ref;
}

// anime.js number count-up. Writes formatted text into the returned ref.
export function useCountUp<T extends HTMLElement>(
  value: number,
  format: (n: number) => string,
) {
  const ref = useRef<T>(null);
  const fmt = useRef(format);
  useEffect(() => {
    fmt.current = format;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = fmt.current(value);
      return;
    }
    let cancelled = false;
    const obj = { v: 0 };
    import("animejs")
      .then(({ animate }) => {
        if (cancelled || !ref.current) return;
        animate(obj, {
          v: value,
          duration: 900,
          ease: "outCubic",
          onUpdate: () => {
            if (ref.current) ref.current.textContent = fmt.current(obj.v);
          },
        });
      })
      .catch(() => {
        if (ref.current) ref.current.textContent = fmt.current(value);
      });
    return () => {
      cancelled = true;
    };
    // format identity intentionally excluded — captured via ref to avoid re-animating.
  }, [value]);
  return ref;
}
