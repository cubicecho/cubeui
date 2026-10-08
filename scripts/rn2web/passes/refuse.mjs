/** A refusal. `line` is 1-based, so it pastes straight into an editor. */
export function refuse(diagnostics, node, message) {
  const file = node.getSourceFile();
  diagnostics.push({
    // The project is an in-memory filesystem, so `getFilePath()` is rooted at `/`. The repo-relative
    // path is what pastes into an editor, and it is what was handed in.
    file: file.getFilePath().replace(/^\//, ""),
    line: file.getLineAndColumnAtPos(node.getStart()).line,
    message,
  });
}
