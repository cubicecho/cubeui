/**
 * The one function `registry/ui/download-button.tsx` calls, declared rather than installed, for
 * the reason `expo-clipboard.d.ts` gives: the real package peers `expo`. The consumer installs it
 * (the `download-button` item declares it), and `npm run install-test` typechecks against it.
 */
declare module "expo-sharing" {
  /** Opens the share sheet for a local file. */
  export function shareAsync(
    url: string,
    options?: { mimeType?: string; dialogTitle?: string; UTI?: string },
  ): Promise<void>;
}
