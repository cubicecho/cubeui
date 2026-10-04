/**
 * What `registry/ui/download-button.tsx` calls, declared rather than installed, for the reason
 * `expo-clipboard.d.ts` gives: the real package peers `expo`. The consumer installs it (the
 * `download-button` item declares it), and `npm run install-test` typechecks against it.
 */
declare module "expo-file-system" {
  export class File {
    constructor(...uris: (string | File | Directory)[]);
    readonly uri: string;
    /** Throws if the file exists, unless `overwrite`. */
    create(options?: { overwrite?: boolean; intermediates?: boolean }): void;
    write(content: string | Uint8Array): void;
  }

  export class Directory {
    constructor(...uris: (string | File | Directory)[]);
    readonly uri: string;
    /** Asks the person for a folder. */
    static pickDirectoryAsync(initialUri?: string): Promise<Directory>;
    createFile(name: string, mimeType: string | null): File;
  }

  export const Paths: { readonly cache: Directory; readonly document: Directory };
}
