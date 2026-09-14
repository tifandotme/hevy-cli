---
name: creating-changesets
description: Creates a non-interactive Changeset for the single @tifan/hevy package when the user asks to add, write, create, or prepare release notes for a user-facing change.
---

# Creating Changesets

Create the Changeset file directly. Use the working-tree diff to identify the user-facing change. Prefer staged files when they exist, but include relevant unstaged files in the review.

## Workflow

1. Inspect the changed files:
   ```bash
   git status --short
   git diff --stat
   git diff --staged --stat
   ```
2. Read the relevant diff and identify only the new user-facing behavior.
3. Skip the Changeset for release tooling, CI, tests, refactors, or internal-only changes.
4. Choose the smallest SemVer bump:
   - `patch`: bug fixes, documentation changes shipped with the package, and backward-compatible corrections.
   - `minor`: new commands, options, resources, or other backward-compatible capabilities.
   - `major`: breaking command behavior, flags, output, or API changes.
5. Create a short lowercase filename under `.changeset/`.
6. Write one Changeset with this shape:

   ```md
   ---
   "@tifan/hevy": patch
   ---

   Fix incorrect workout output for paginated responses.
   ```

7. Keep the summary user-facing. Name commands or behavior, not implementation details.

Do not change `package.json` versions, publish packages, or edit existing Changeset files. Do not use the interactive `bun changeset` flow unless the user explicitly asks for it.

Done means exactly one new correctly scoped `.changeset/*.md` file exists, or no file is created because the diff has no user-facing package change.
