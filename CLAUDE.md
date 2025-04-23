# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- Build: `yarn build`
- Dev server: `yarn dev` or `yarn verbose-dev` for more logs
- Lint: `yarn lint` (fix with `yarn lint:fix`)
- Type check: `yarn type-check`
- Test all: `yarn test`
- Test single file: `yarn jest path/to/file.test.ts`
- Watch tests: `yarn jest --watch`
- Format code: `yarn prettier-project`

## Code Style
- TypeScript with strict typing
- Prettier formatting: no semicolons, double quotes, trailing commas
- Use camelCase for variables, PascalCase for types/interfaces
- Avoid any when possible, but allowed when necessary
- Unused variables should be prefixed with `_`
- Jest for testing with descriptive test names
- GraphQL queries use the `gql` tag from lib/gql
- Organize imports logically (internal vs external)
- Follow React best practices for component structure
