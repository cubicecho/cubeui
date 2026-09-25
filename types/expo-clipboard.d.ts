/**
 * The one function `registry/ui/copy-button.tsx` calls, declared rather than installed.
 *
 * `expo-clipboard` peers `expo`, and installing it here pulls the whole Expo SDK and its CLI into a
 * component library's dev tree — 182 packages and a lockfile rewritten end to end — for one
 * signature. The consumer installs the real package (the `copy-button` item declares it), and
 * `npm run install-test` typechecks the native item against it in a scratch Expo app, which is
 * what catches this drifting.
 */
declare module "expo-clipboard" {
  /** Resolves `true` once the text is on the clipboard, `false` if the platform refused it. */
  export function setStringAsync(text: string): Promise<boolean>;
}
