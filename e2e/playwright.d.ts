declare module '@playwright/test' {
  export interface Page {
    setViewportSize(size: { width: number; height: number }): Promise<void>;
    goto(url: string): Promise<any>;
    waitForLoadState(state?: string): Promise<void>;
    getByRole(role: string, options?: any): Locator;
    waitForTimeout(timeout: number): Promise<void>;
    evaluate<T>(fn: () => T): Promise<T>;
    locator(selector: string): Locator;
  }

  export interface Locator {
    isVisible(): Promise<boolean>;
    click(): Promise<void>;
    all(): Promise<Locator[]>;
    boundingBox(): Promise<{ width: number; height: number; x: number; y: number } | null>;
    first(): Locator;
    scrollIntoViewIfNeeded(): Promise<void>;
  }

  export interface ExpectScreenshotOptions {
    fullPage?: boolean;
    maxDiffPixelRatio?: number;
    threshold?: number;
    animations?: 'disabled' | 'allow';
  }

  export interface ExpectMatcher {
    toHaveScreenshot(name: string, options?: ExpectScreenshotOptions): Promise<void>;
    toBe(expected: any): void;
    toBeGreaterThanOrEqual(expected: number): void;
    toBeVisible(): Promise<void>;
    toBeAttached(): Promise<void>;
    toHaveLength(expected: number): void;
  }

  export interface TestContext {
    page: Page;
  }

  export interface TestFunction {
    (name: string, testFn: (context: TestContext) => Promise<void> | void): void;
    describe(name: string, suiteFn: () => void): void;
  }

  export const test: TestFunction;
  export const expect: (actual: any) => ExpectMatcher;
}
