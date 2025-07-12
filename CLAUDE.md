# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Build**: `npm run build` or `yarn build` - Compiles TypeScript to JavaScript in `dist/` directory
- **Development**: `npm run dev` or `yarn dev` - Runs TypeScript compiler in watch mode
- **Test**: `npm run test` or `yarn test` - Runs prettier, xo (ESLint), and ava tests
- **Lint**: XO is used for linting (ESLint with React config)

## Architecture

This is a command-line music player built with:

- **React + Ink**: Terminal-based UI using React components rendered in the terminal
- **Audio playback**: Uses `play-sound` library to play MP3 files from the `music/` directory
- **Process management**: Spawns and manages child processes for user commands while playing music
- **CLI framework**: Built with `meow` for command-line argument parsing

### Core Components

- `source/cli.tsx`: Entry point that sets up CLI with meow and renders the main App
- `source/app.tsx`: Main React component handling:
  - Audio playback with random track selection
  - User command execution and output capture
  - Interactive controls (play/stop/new song/exit)
  - Process cleanup on exit/signals
- `source/playlist.ts`: Track definitions and playlist data

### Key Behaviors

- Plays music continuously while executing user commands
- Prevents same track from playing twice in a row
- Captures both stdout and stderr from user commands
- Comprehensive cleanup of audio and command processes on exit
- Interactive terminal interface for music control

The application structure follows the pattern: CLI entry → React App → Audio + Command execution with cleanup handlers.