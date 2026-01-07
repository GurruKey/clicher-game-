# Project Rules

- **Single Source of Truth:** The `info/` folder is the single source of truth for documentation.
- **Search Order:**
  1. **Check `info/` first:** Always consult the documentation files to understand context, architecture, and logic.
  2. **Search Codebase:** Only if the information is missing in `info/`, analyze the source code.
- **Update Loop:** If you had to analyze the code because the `info/` documentation was missing or outdated, **you must update the relevant `info/` files** with your findings immediately after the task.
- **Code Quality:** Keep files small and focused from the start; avoid bloating files by splitting responsibilities early.
- **Refactoring Safety:** When moving files or modifying the architecture, **always update all file paths and imports** (including those in documentation and configuration) to prevent breaking the codebase.
