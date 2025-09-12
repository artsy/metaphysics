# Automated GraphQL Schema Updates

This document explains how Metaphysics automatically updates GraphQL schemas across Artsy's ecosystem when changes are merged into the `main` branch.

## Overview

When code is merged into the `main` branch of Metaphysics, an automated process generates and distributes the updated GraphQL schema to dependent repositories. This ensures all client applications stay in sync with the latest schema changes without manual intervention.

## The Automated Process

This describes the step-by-step flow that occurs automatically when code is merged into the main branch.

### 1. Trigger Event

- **When**: Code is merged into the `main` branch
- **Where**: CircleCI workflow (see `push-schema-changes` job in [.circleci/config.yml](https://github.com/artsy/metaphysics/blob/7a68c5fda8878db3d6035196f45b7fb9cb9bdfb6/.circleci/config.yml#L125-L130))

### 2. Deploy to Staging

After tests pass and the staging deployment completes, the schema update process begins.

### 3. Schema Generation

The automation runs `yarn dump:staging` to create the latest schema from the staging environment.

**Key Files:**

- [`scripts/dump-staging-schema.js`](https://github.com/artsy/metaphysics/blob/7a68c5fda8878db3d6035196f45b7fb9cb9bdfb6/scripts/dump-staging-schema.js) - Pulls staging environment variables and generates schema
- [`scripts/dump-schema.ts`](https://github.com/artsy/metaphysics/blob/7a68c5fda8878db3d6035196f45b7fb9cb9bdfb6/scripts/dump-schema.ts) - Core schema generation logic
- `_schemaV2.graphql` - The generated schema file (644KB+ in size)

### 4. Automated PR Creation

**Script**: [`scripts/push-schema-changes.js`](https://github.com/artsy/metaphysics/blob/7a68c5fda8878db3d6035196f45b7fb9cb9bdfb6/scripts/push-schema-changes.js)

**Process:**

1. **Parallel Processing**: Uses CircleCI parallelization (6 nodes) to distribute schema updates across repositories
2. **Repository Updates**: For each supported repository:
   - Creates a new branch: `artsyit/update-schema`
   - Copies the updated schema file(s)
   - Runs Relay compiler if needed
   - Formats files with Prettier
   - Creates a PR with title: "chore: update metaphysics graphql schema"

**Supported Repositories:**

- `eigen` - Mobile app (includes `#nochangelog` in PR body)
- `energy` - Partner CMS
- `prediction` - ML services
- `force` - Web application
- `forque` - Force queue processor
- `volt` - Rails application (uses custom destinations: `vendor/graphql/schema/`)

### 5. PR Details

**Automated PRs include:**

- **Title**: "chore: update metaphysics graphql schema"
- **Branch**: `artsyit/update-schema`
- **Target**: `main` branch
- **Assignee**: `artsyit` (bot user)
- **Labels**: `["Squash On Green"]` (auto-merge when CI passes)
- **Body**: "Greetings human 🤖 this PR was automatically created as part of metaphysics' deploy process."

## Development Workflow Validation

While the main automation handles schema updates when code merges to `main`, there's also a CI check that ensures developers update schemas appropriately during development.

**Script**: [`scripts/ensure-schema-update.sh`](https://github.com/artsy/metaphysics/blob/7a68c5fda8878db3d6035196f45b7fb9cb9bdfb6/scripts/ensure-schema-update.sh)

- Runs on non-main branches in CI (see `ensure-schema-update` job in [.circleci/config.yml](https://github.com/artsy/metaphysics/blob/7a68c5fda8878db3d6035196f45b7fb9cb9bdfb6/.circleci/config.yml#L107-L110))
- Validates that developers have updated the schema if needed
- **Process**:
  1. Runs `yarn dump:staging`
  2. Checks if `_schemaV2.graphql` has changes
  3. Fails CI if schema is outdated with message: "Schema is outdated. You might want to run `yarn dump:staging` and commit the changes."

## File Locations

Reference guide to the key files and scripts involved in the automated schema update system.

### Configuration Files

- [`.circleci/config.yml`](https://github.com/artsy/metaphysics/blob/7a68c5fda8878db3d6035196f45b7fb9cb9bdfb6/.circleci/config.yml) - Main workflow automation
- [`package.json`](https://github.com/artsy/metaphysics/blob/7a68c5fda8878db3d6035196f45b7fb9cb9bdfb6/package.json) - Schema-related npm scripts and pre-commit hooks

### Scripts

- [`scripts/push-schema-changes.js`](https://github.com/artsy/metaphysics/blob/7a68c5fda8878db3d6035196f45b7fb9cb9bdfb6/scripts/push-schema-changes.js) - Main automation script for PR creation
- [`scripts/dump-staging-schema.js`](https://github.com/artsy/metaphysics/blob/7a68c5fda8878db3d6035196f45b7fb9cb9bdfb6/scripts/dump-staging-schema.js) - Staging environment schema generation
- [`scripts/dump-schema.ts`](https://github.com/artsy/metaphysics/blob/7a68c5fda8878db3d6035196f45b7fb9cb9bdfb6/scripts/dump-schema.ts) - Core schema generation logic
- [`scripts/ensure-schema-update.sh`](https://github.com/artsy/metaphysics/blob/7a68c5fda8878db3d6035196f45b7fb9cb9bdfb6/scripts/ensure-schema-update.sh) - Development schema validation

### Generated Files

- `_schemaV2.graphql` - The main GraphQL schema file (auto-generated, committed to repo)

## Manual Operations

These are commands and tools available for developers to work with schemas locally, separate from the automated process.

### Generate Schema Locally

```bash
yarn dump:local    # From local environment
yarn dump:staging  # From staging environment (recommended)
```

### Pre-commit Hook

The repository includes a Git pre-commit hook that automatically updates the schema during development:

```json
"pre-commit": "lint-staged; yarn dump:staging; git add _schemaV2.graphql"
```

This ensures the schema is always up-to-date when developers commit changes.

### Check Schema Status

```bash
git status _schemaV2.graphql  # Check if schema has uncommitted changes
```

### Troubleshooting

If the automated process fails:

1. Check CircleCI build logs for the `push-schema-changes` job
2. Verify staging environment is accessible
3. Manually run `yarn dump:staging` to test schema generation
4. Check dependent repositories for any integration issues

## Architecture Notes

- **Environment Variables**: Staging environment variables are pulled via `hokusai staging env get`
- **Parallel Processing**: Schema updates are distributed across multiple CI nodes for efficiency
- **Error Handling**: Process exits with error code 1 on failures to prevent incomplete deployments
- **Security**: Uses Artsy's `@artsy/update-repo` package for secure GitHub API interactions

This automation ensures that GraphQL schema changes are automatically propagated across the entire Artsy ecosystem, maintaining consistency and reducing manual maintenance overhead.
