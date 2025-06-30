# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Building and Development
- `npm run dev` - Start Next.js development server with hot reload
- `npm run dev:debug` - Start development server with Node.js debugging enabled
- `npm run build` - Production build with Next.js optimization
- `npm run start` - Start production server
- `npm run lint` - Run ESLint on app directory (.js,.jsx,.ts,.tsx files)
- `npm run type-check` - Run TypeScript type checking without emitting files

### Testing
- `npm test` - Run all Jest tests
- `npm run test:watch` - Run tests in watch mode for development
- `npm run test:coverage` - Run tests with coverage reporting
- Test files: Located in `tests/` directory and `tests/__tests__/` subdirectory
- Run single test: `npx jest <test-file-name>` or `npx jest --testNamePattern="<test name>"`

### Package Management
This project uses npm as the package manager. Run `npm install` to install dependencies.

### Project Identity (v2.0.0)
- **Package Name**: `pptx2pptistjson` (changed from `pptxtojson`)
- **Primary Focus**: PPTist-compatible JSON output format
- **Target Integration**: [PPTist](https://github.com/pipipi-pikachu/PPTist) presentation editor

## Development Best Practices

### Post-Modification Verification
- **Comprehensive Checks**: After each modification, verify multiple command executions:
  - `npm run build` - Ensures production build integrity
  - `npm run type-check` - Validates TypeScript type consistency
  - `npm run lint` - Checks code quality and style guidelines
  - `npm run test` - Confirms all test cases pass successfully
  - Each command must complete without errors to confirm code quality and readiness

[... rest of the existing content remains unchanged ...]