import { Injectable } from '@angular/core';

/** Shared motion for content that arrives after an asynchronous render. */
@Injectable({ providedIn: 'root' })
export class UiMotion {
  revealRows(viewport: HTMLElement): () => void {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches) return () => {};

    const style = getComputedStyle(viewport);
    const duration = parseFloat(style.getPropertyValue('--motion-enter-duration'));
    const step = parseFloat(style.getPropertyValue('--motion-row-delay'));
    const limit = parseFloat(style.getPropertyValue('--motion-row-delay-limit'));
    const easing = style.getPropertyValue('--motion-easing').trim();
    const rows = [...viewport.querySelectorAll<HTMLElement>('.data-table tbody tr')];
    const targets = rows.length
      ? rows
      : [...viewport.querySelectorAll<HTMLElement>('app-empty-state, app-notice')];
    const animations = targets.map((element, index) =>
      element.animate(
        [
          { opacity: 0, transform: 'translateY(6px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration, delay: Math.min(index * step, limit), easing, fill: 'backwards' },
      ),
    );
    const cancel = (): void => {
      animations.forEach((animation) => animation.cancel());
      preference.removeEventListener('change', cancel);
    };
    preference.addEventListener('change', cancel);
    // Release resources after completion; cancellation also settles finished promises.
    void Promise.allSettled(animations.map((animation) => animation.finished)).then(cancel);
    return cancel;
  }
}
