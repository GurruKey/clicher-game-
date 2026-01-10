# Project Rules

- **Language:** Always communicate in Russian.
- **Project Structure:**
  - `constructor/`: Tool for configuring game data (stats, items, perks, etc.). This is where the game is "built" and balanced.
  - `src/`: The core game engine and UI (React). This is the client-side game that players interact with.
- **Code Quality:** Keep files small and focused from the start; avoid bloating files by splitting responsibilities early.
- **Refactoring Safety:** When moving files or modifying the architecture, **always update all file paths and imports** (including those in documentation and configuration) to prevent breaking the codebase.
- **UI Consistency (Constructor):** When working on the `constructor/` UI, strictly adhere to the styles defined in `constructor/ui/theme.py`. Use provided Modern components (`ModernButton`, `ScrollableFrame`, etc.) and color constants (`BG_COLOR`, `ACCENT_COLOR`, etc.) to maintain a consistent dark theme.
- **Intent Recognition:** Distinguish between a **request for information/analysis** and a **request for action**:
  - If the user asks a question or asks to check something ("How does X work?", "Find Y"), provide a detailed analysis and answer without modifying any files.
  - Only perform modifications when there is a clear **instruction to act** ("Implement X", "Change Y", "Fix Z").
  - If the intent is ambiguous, always ask for clarification before editing code.
