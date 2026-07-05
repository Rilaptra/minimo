# Changelog

## [0.2.0] - 2026-07-05
- 🚀 Added 'AppServer' class to handle dynamic module loading, static asset serving, and React SSR.
- ⚙️ Integrated HMR (Hot Module Replacement) support for development environments to improve DX.
- 📦 Implemented 'DatabaseService' singleton using Drizzle ORM with auto-migration capabilities.
- 🧹 Removed manual asset embedding in 'embedded-assets.ts' as the file is now auto-generated.
- 🛠️ Configured production-grade asset serving with optimized headers for static files.

## [0.1.0] - 2026-07-05
- 🚀 [Release] Add GitHub Actions workflow for building and releasing binaries for Windows, Linux, and macOS.
- 📖 [Docs] Create README.md detailing project structure, stack, database schema, and deployment instructions.
- 🧹 [Config] Update .gitignore to exclude build artifacts, logs, environment files, and IDE configuration.
- ⚙️ [Config] Add CSS linting ignore rule to .vscode/settings.json.
