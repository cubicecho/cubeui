import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

/**
 * Makes `className` on a `react-native` component reach the DOM under Vite.
 *
 * On device this is Metro's job: `withReactNativeCSS(config, { globalClassNamePolyfill: true })`
 * rewrites react-native's exports so `<View className="p-4">` styles. react-native-css says
 * outright that it "officially only supports Metro as the bundler", so nothing does that job here,
 * and react-native-web drops the prop — it has no `className` passthrough, only a `forwardedProps`
 * allowlist. Every React Native component in this registry would render unstyled, with no error to
 * say why, and a side-by-side story would compare a styled tree against a bare one while looking
 * entirely plausible. `stories/section-heading.stories.tsx` asserts the computed colour for
 * exactly that reason, and it is what caught the first two attempts at this file doing nothing.
 *
 * `react-native-css/components` is the polyfill's hand-wired form: the whole of react-native,
 * with `View`, `Text`, `Pressable`, `ScrollView` and `TextInput` wrapped in `styled()`. On web
 * that wrapper turns `className="p-4"` into `style={{ $$css: true, className: "p-4" }}`, which is
 * the shape react-native-web's own styleq resolver turns back into a real `class` attribute.
 *
 * So the job is to point this repo's imports at that module — and *only* this repo's. An alias
 * cannot express "only": `react-native-css/components` imports `react-native` itself, and an alias
 * catches that too and resolves the module to itself. Rewriting the specifier in our own files
 * leaves every import inside `node_modules` alone, which is precisely the distinction that is
 * needed.
 *
 * Two earlier shapes are recorded here because both look correct and neither works. A `resolveId`
 * hook cannot do it even at `enforce: "pre"` — Vite's own alias plugin runs ahead of every user
 * plugin, so the specifier is already `react-native-web` by the time the hook is asked. And a shim
 * module that does `export * from "react-native-web"` plus five `export const`s to shadow it does
 * not shadow them: ES modules give a named export precedence over a star export, but this bundler
 * hands back react-native-web's `View` regardless, and the only symptom is an unstyled tree.
 */
export function reactNativeClassName(): Plugin {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const ours = ["compiled", "registry", "stories"].map((dir) => `${root}${dir}/`);

  return {
    name: "cubeui-rn:classname-polyfill",
    // Before the framework's Babel and Flow passes, so they see the final specifier.
    enforce: "pre",
    transform(code, id) {
      const [file] = id.split("?");
      if (!file || !ours.some((dir) => file.startsWith(dir))) return null;
      if (!code.includes('"react-native"') && !code.includes("'react-native'")) return null;

      // Anchored on `from` so it cannot touch `react-native-svg`, `react-native-css` or a string
      // in the prose of a comment.
      return {
        code: code.replace(/from\s+(["'])react-native\1/g, 'from "react-native-css/components"'),
        map: null,
      };
    },
  };
}
