# Project Context

This document describes the overall context of the project based on an analysis of the codebase.

## Overview

The project appears to be a web-based game, likely a "clicker" or incremental game, with a separate Python-based tool for managing game data and configuration.

## Frontend (`src/`)

The frontend is a React application built with Vite. Key features suggested by the file structure include:

- **Game Loop:** The presence of `useGameController.js` and `useLootEngine.js` suggests a core game loop involving player actions and rewards.
- **Character Management:** The `src/hooks/character` and `src/components/panels/CharacterPanel.jsx` files indicate that players can manage characters with stats, perks, and inventory.
- **Inventory System:** A detailed inventory system is suggested by the numerous hooks in `src/hooks/inventory` for managing items, bags, and drag-and-drop functionality.
- **Game World:** The game world seems to be composed of locations, as indicated by `src/data/locations` and `src/components/dialogs/LocationDialog.jsx`.
- **UI:** The UI is built with React components and includes features like dialogs, tooltips, and context menus.

## Backend/Tooling (`constructor/`)

The `constructor/` directory contains a Python application that appears to be a tool for developers or game designers to create and manage the game's content. The name "constructor" and the Flet-based UI (`constructor/ui/`) suggest a visual tool for editing game data such as:

- Avatars
- Items
- Locations
- Races
- Stats and Perks

This tool likely generates the data files that are then used by the React frontend.

## High-Level Workflow

1.  **Content Creation:** Game content (items, characters, etc.) is created and edited using the Python-based constructor tool.
2.  **Data Export:** The constructor tool exports the game data into a format that can be used by the React application (likely JavaScript or JSON files).
3.  **Game Client:** The React application loads the game data and provides the user interface and game logic for players to interact with the game.
