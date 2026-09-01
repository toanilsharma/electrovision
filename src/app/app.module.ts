/**
 * App Module for Layout Observers
 * STRICT CONSTRAINT: BreakpointObserver is imported strictly for responsive layout adaptations,
 * with ZERO bindings to physics engines, calculations, or standards formulas.
 */

export interface BreakpointState {
  matches: boolean;
  breakpoints: { [key: string]: boolean };
}

export class BreakpointObserver {
  private mediaQueryLists: Map<string, MediaQueryList> = new Map();

  public observe(queries: string | string[]) {
    const queryList = Array.isArray(queries) ? queries : [queries];
    return {
      subscribe: (callback: (state: BreakpointState) => void) => {
        const checkState = () => {
          const breakpoints: { [key: string]: boolean } = {};
          let matches = false;

          queryList.forEach((q) => {
            let mql = this.mediaQueryLists.get(q);
            if (!mql && typeof window !== 'undefined') {
              mql = window.matchMedia(q);
              this.mediaQueryLists.set(q, mql);
            }
            if (mql) {
              breakpoints[q] = mql.matches;
              if (mql.matches) matches = true;
            }
          });

          callback({ matches, breakpoints });
        };

        if (typeof window !== 'undefined') {
          queryList.forEach((q) => {
            const mql = window.matchMedia(q);
            this.mediaQueryLists.set(q, mql);
            mql.addEventListener('change', checkState);
          });
        }

        checkState();

        return {
          unsubscribe: () => {
            if (typeof window !== 'undefined') {
              this.mediaQueryLists.forEach((mql) => {
                mql.removeEventListener('change', checkState);
              });
            }
          }
        };
      }
    };
  }

  public isMatched(query: string): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  }
}

export class AppModule {
  private static layoutObserver: BreakpointObserver = new BreakpointObserver();

  public static getLayoutObserver(): BreakpointObserver {
    return this.layoutObserver;
  }
}
