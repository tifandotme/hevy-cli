# Changesets

This directory holds [Changesets](https://github.com/changesets/changesets). Each `.md` file describes intent to bump the package version and adds a changelog summary.

Run `bun changeset` to author one. Commit the resulting file alongside the code change.

The Release workflow consumes these files: it opens a `Version Packages` pull request that bumps `@tifan/hevy` and updates `CHANGELOG.md`, then publishes to npm when that pull request is merged.
