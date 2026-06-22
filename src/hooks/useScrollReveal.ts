"use client";

import { useEffect } from "react";

/**
 * Reveals any `[data-reveal]` element on scroll-into-view (spec section 2).
 * Pass deps that change when new revealable content mounts so freshly-added
 * nodes get prepared.
 *
 * Robustness: an element is marked `data-revealed` only when it is actually
 * revealed — never at hide time. That way, if the observer is torn down before
 * it fires (which happens on fast client-side navigation), a later effect run
 * re-observes the still-hidden element instead of skipping it forever. As a
 * final guard, cleanup force-reveals anything left hidden-but-unrevealed so a
 * page can never get stuck invisible.
 */
export function useScrollReveal(deps: React.DependencyList = []) {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return; // graceful fallback

    const show = (el: HTMLElement) => {
      el.style.opacity = "1";
      el.style.transform = "none";
      el.setAttribute("data-revealed", ""); // mark only once truly revealed
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            show(e.target as HTMLElement);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px -38px 0px" },
    );

    const raf = requestAnimationFrame(() => {
      let i = 0;
      document
        .querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])")
        .forEach((el) => {
          el.style.willChange = "opacity, transform";
          const d = (i * 0.06).toFixed(2); // small cascade between neighbours
          el.style.transition =
            `opacity 0.6s cubic-bezier(.22,.61,.36,1) ${d}s, ` +
            `transform 0.6s cubic-bezier(.22,.61,.36,1) ${d}s`;
          el.style.opacity = "0";
          el.style.transform = "translateY(18px)";
          io.observe(el);
          i++;
        });
    });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      // Safety net: never leave a prepared-but-unrevealed block invisible.
      document
        .querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])")
        .forEach((el) => {
          el.style.opacity = "1";
          el.style.transform = "none";
        });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
