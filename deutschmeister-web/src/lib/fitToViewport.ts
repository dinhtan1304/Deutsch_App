/**
 * Callback ref: publishes the element's document top as `--fit-top` so CSS can
 * size it to exactly the rest of the viewport (navbar, banners and breadcrumb
 * above it vary per user). Re-measured on resize / layout shifts. Pair with
 * FIT_VIEWPORT_HEIGHT.
 */
export function fitToViewport(el: HTMLElement | null) {
  if (!el) return;
  const update = () => {
    const top = el.getBoundingClientRect().top + window.scrollY;
    el.style.setProperty('--fit-top', `${Math.round(top)}px`);
  };
  update();
  const ro = new ResizeObserver(update);
  ro.observe(document.body);
  window.addEventListener('resize', update);
  return () => {
    ro.disconnect();
    window.removeEventListener('resize', update);
  };
}

/**
 * Height classes for a fitToViewport element inside MainLayout: the rest of
 * the viewport minus MainLayout's bottom padding (16px) and, on phones, the
 * BottomTabBar spacer (64px + safe area).
 */
export const FIT_VIEWPORT_HEIGHT =
  'h-[calc(100dvh-var(--fit-top,0px)-80px-env(safe-area-inset-bottom))] md:h-[calc(100dvh-var(--fit-top,0px)-16px)]';
