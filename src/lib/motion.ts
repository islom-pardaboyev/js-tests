import { useEffect, useLayoutEffect, type RefObject } from 'react';
import gsap from 'gsap';

export { gsap };

// Follow the wall clock even when frames are throttled (background or low-power tabs).
gsap.ticker.lagSmoothing(0);

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Runs a GSAP setup scoped to `scope` and reverts it on cleanup. Skipped
 * entirely under prefers-reduced-motion, so content is simply shown.
 */
export function useGsap(scope: RefObject<HTMLElement>, setup: () => void, deps: unknown[] = []): void {
  useLayoutEffect(() => {
    const root = scope.current;
    if (!root || prefersReducedMotion()) return;
    const ctx = gsap.context(setup, scope);
    // Safety net: if a tween is ever interrupted (fast navigation, re-render), nothing may stay hidden.
    const rescue = () => {
      root.querySelectorAll<HTMLElement>('*').forEach((el) => {
        if (el.style.opacity !== '' && !gsap.isTweening(el)) gsap.set(el, { clearProps: 'opacity,visibility,transform' });
      });
    };
    const t1 = window.setTimeout(rescue, 3500);
    const t2 = window.setTimeout(rescue, 8000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Fades `.reveal` elements in as they scroll into view (CSS transition, class
 * toggled by IntersectionObserver). A timer reveals everything after a few
 * seconds, so nothing can stay hidden.
 */
export function useReveal(scope: RefObject<HTMLElement>): void {
  useLayoutEffect(() => {
    const root = scope.current;
    if (!root || !('IntersectionObserver' in window)) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>('.reveal'));
    root.classList.add('js-reveal');
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        }),
      { rootMargin: '0px 0px -8% 0px' },
    );
    items.forEach((el) => io.observe(el));
    const fallback = window.setTimeout(() => items.forEach((el) => el.classList.add('in')), 6000);
    return () => {
      window.clearTimeout(fallback);
      io.disconnect();
      root.classList.remove('js-reveal');
    };
  }, [scope]);
}

/**
 * Publishes the scroll position as CSS variables on the root (`--sy` in px, `--sp` 0..1)
 * and flags `data-scrolled` once the page has moved, so CSS can parallax and fade
 * without any per-element JavaScript. One rAF-throttled listener.
 */
export function useScrollFx(): void {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const root = document.documentElement;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const max = Math.max(1, root.scrollHeight - window.innerHeight);
      root.style.setProperty('--sy', `${Math.round(y)}`);
      root.style.setProperty('--sp', (y / max).toFixed(4));
      if (y > 8) root.setAttribute('data-scrolled', ''); else root.removeAttribute('data-scrolled');
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
      root.style.removeProperty('--sy');
      root.style.removeProperty('--sp');
      root.removeAttribute('data-scrolled');
    };
  }, []);
}

const SR_SELECTOR = [
  'main h1', 'main h2', 'main .panel', 'main .cert', 'main .shot', 'main .level', 'main .test-row',
  'main table.data', 'main .kv', 'main .banner', 'main .dotfield', 'main .agree', 'main .seg', 'main .tabs',
].join(',');

/**
 * Every page: components fade, lift and un-blur as they scroll into view, in a short
 * stagger among siblings. Elements are tagged as they appear in the DOM (so content
 * loaded later animates too); anything that already animates itself is left alone.
 */
export function useScrollReveal(): void {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const root = document.documentElement;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('sr-in'); io.unobserve(e.target); }
      }),
      { rootMargin: '0px 0px -6% 0px', threshold: 0.05 },
    );
    const tag = (scope: ParentNode) => {
      scope.querySelectorAll<HTMLElement>(SR_SELECTOR).forEach((el) => {
        if (el.hasAttribute('data-sr') || el.closest('.exam-shell') || el.closest('.rise, .reveal')) return;
        if (el.parentElement?.closest('[data-sr]')) return;
        const sibs = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.hasAttribute('data-sr')).length : 0;
        el.setAttribute('data-sr', '');
        el.style.setProperty('--sr-d', `${Math.min(sibs, 6) * 70}ms`);
        io.observe(el);
      });
    };
    root.classList.add('sr-on');
    tag(document.body);
    const mo = new MutationObserver((muts) => muts.forEach((m) => m.addedNodes.forEach((n) => {
      if (n instanceof HTMLElement) { if (n.matches(SR_SELECTOR)) tag(n.parentElement ?? document.body); tag(n); }
    })));
    mo.observe(document.body, { childList: true, subtree: true });
    const safety = window.setInterval(() => {
      document.querySelectorAll('[data-sr]:not(.sr-in)').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('sr-in');
      });
    }, 1500);
    return () => { window.clearInterval(safety); mo.disconnect(); io.disconnect(); root.classList.remove('sr-on'); };
  }, []);
}
