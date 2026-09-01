/**
 * Mobile Layout Helper
 * Observer utility to monitor responsive viewport breakpoints and toggle mobile CSS classes.
 * STRICT CONSTRAINTS: This helper ONLY manages layout class toggles and NEVER calls or touches physics services.
 */

export type BreakpointCallback = (isMobile: boolean, isTablet: boolean) => void;

export class MobileLayoutHelper {
  private static mobileQuery = '(max-width: 768px)';
  private static tabletQuery = '(max-width: 1024px)';
  private static listeners: Set<BreakpointCallback> = new Set();
  private static initialized = false;

  public static isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(this.mobileQuery).matches;
  }

  public static isTablet(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(this.tabletQuery).matches;
  }

  public static initBreakpointObserver(): () => void {
    if (typeof window === 'undefined' || this.initialized) {
      return () => {};
    }

    this.initialized = true;
    const mqlMobile = window.matchMedia(this.mobileQuery);
    const mqlTablet = window.matchMedia(this.tabletQuery);

    const updateClasses = () => {
      const isMob = mqlMobile.matches;
      const isTab = mqlTablet.matches;

      if (isTab) {
        document.documentElement.classList.add('layout-mobile-view');
      } else {
        document.documentElement.classList.remove('layout-mobile-view');
      }

      if (isMob) {
        document.documentElement.classList.add('layout-compact-phone');
      } else {
        document.documentElement.classList.remove('layout-compact-phone');
      }

      this.listeners.forEach((cb) => cb(isMob, isTab));
    };

    mqlMobile.addEventListener('change', updateClasses);
    mqlTablet.addEventListener('change', updateClasses);
    updateClasses();

    return () => {
      mqlMobile.removeEventListener('change', updateClasses);
      mqlTablet.removeEventListener('change', updateClasses);
    };
  }

  public static subscribe(callback: BreakpointCallback): () => void {
    this.listeners.add(callback);
    callback(this.isMobile(), this.isTablet());
    return () => {
      this.listeners.delete(callback);
    };
  }
}
