"use client";

import { useEffect } from "react";

/**
 * Reveals any `[data-reveal]` element on scroll-into-view (spec section 2).
 * Pass deps that change when new revealable content mounts so freshly-added
 * nodes get prepared. Each element is only ever processed once (`data-revealed`).
 */
export function useScrollReveal(deps: React.DependencyList = []) {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return; // graceful fallback

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.style.opacity = "1";
            el.style.transform = "none";
            io.unobserve(el);
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
          el.setAttribute("data-revealed", "");
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
