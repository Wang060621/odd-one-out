# Odd One Out

A local multiplayer word game for **3–8 players**, with an illustrated eight-character clubhouse. Most players receive the same word; one receives a different word. Give clues, discuss them, and vote for the player who seems different.

The initial playable version is complete and runs locally. Visual details, animations, responsive layouts, and the overall experience are still being refined.

## Requirements

- **Node.js 22.13 or later**, with npm available in your terminal.
- A modern browser. No microphone permissions are needed.
- An internet connection when installing dependencies for the first time.

## Start locally

Open a terminal in the project folder. On Windows PowerShell:

```powershell
Set-Location 'C:\path\to\odd-one-out'
```

If `node_modules` is missing, install dependencies first:

```sh
npm ci
```

Start the frontend and backend together:

```sh
npm start
```

The startup script builds the application when needed, applies pending local database migrations, and starts the server. Wait for the server to report that it is ready, then open **http://127.0.0.1:5176/**.

Keep the terminal running. Press **Ctrl+C** in that terminal to stop the server. No separate frontend or backend command is needed. If `node` or `npm` is not recognized, install Node.js and reopen the terminal.

If port 5176 is occupied, use the existing game server or select another port:

```sh
npm start -- --port 5177
```

Then open `http://127.0.0.1:5177/`.

## Play on the same network

```sh
npm run start:lan
```

Players on the same network can open this computer's actual LAN address with port 5176, for example `http://192.168.1.100:5176/`. Replace the example address with the host computer's address and keep the server running. Other devices cannot reach this computer through `127.0.0.1`.

Text gameplay works over LAN HTTP.

## How to play

1. Choose **Create a room**, enter a nickname, select a character and word pack, and set the discussion duration.
2. Share the game address and six-character room code. Other players choose **Join a room** and enter the code. At least three players are needed to start.
3. The host starts the round. Each player privately reads their word and confirms they are ready.
4. Players give clues in order, using text. Each turn lasts up to 60 seconds, starting when the turn begins. Describe the word without naming it. Submit a clue early, or let the deadline automatically advance to the next player.
5. After everyone has given a clue, discuss freely using text messages.
6. Select a player at the table or in the voting list, then choose **Lock in my vote**. Votes remain private until voting finishes.
7. Review the words, votes, and scores, then play another round or return to the lobby.

If the vote identifies the odd player, the majority wins; otherwise the odd player wins. Tied votes are repeated among the tied candidates. Three tied ballots produce a draw. Each winner earns one point.

Discussion can last **15 seconds, 30 seconds, 1 minute, or have no time limit**. Timed discussion starts after the last clue and automatically moves to voting at the deadline. The host can start voting early; unlimited discussion ends when the host starts voting.

For a quick text-only demonstration, open three separate browser tabs and join the same room as three players.

## Characters and visuals

- Eight characters are available: **Sage, Amber, Mint, Blue, Violet, Coral, Pearl, and Rust**. Different players may choose the same character.
- Choose a character in the create/join form, or use **Change character** in room settings before the game starts. Character changes are locked during a round.
- Choices synchronize across the room, including table characters, the player list, and voting avatars. The browser remembers the most recent choice for future visits. Older room records without a character receive a default.
- The home scene displays all eight characters, greeting interactions, and ambient animation. Character selection is accessed through the forms and room settings.
- The live room displays actual players and open seats. Separate background, table, and character layers give the back row the correct table occlusion. Mobile layouts share the same scene coordinates.
- The interface supports desktop and mobile layouts and respects reduced-motion preferences.

## Timed text clues

Each player has 60 seconds to submit a text clue. The current nameplate glows gold, with a warning in the last 10 seconds. The server owns the deadline: refreshing does not reset it. Submitting a clue advances immediately; timeouts are recorded and advance automatically. Discussion timing is separate.

## Local data and moving the project

This copy uses port **5176** and stores its local database in **`data/`**. Room state belong to this project copy. Preserve `data/` to retain local rooms when moving the project or restarting the server.

Rooms expire 24 hours after creation. Refreshing the same browser tab can restore the player session; closing the tab may lose that identity. If a disconnected player stalls a round, the host can end the round and remove that player in the lobby.

To move the game to another computer, copy the project, install Node.js, run `npm ci` if dependencies are absent, then run `npm start`. Source archives omit dependencies, local room data, and build caches. This project copy is intended for local use.

## Technology and source files

The frontend uses **React, TypeScript, CSS, Lucide icons, and GSAP**. The backend uses **JavaScript/TypeScript API routes through Vinext**. **Cloudflare D1 (SQLite)** runs locally through Wrangler. The startup script serves the frontend and APIs together.

| Path | Purpose |
| --- | --- |
| `app/game-client.tsx` | Game interface and player actions |
| `app/painted-lobby.tsx` / `app/painted-lobby.css` | Illustrated home scene and related styles |
| `app/room-scene.tsx` | Live room, player positions, nameplates, and table status |
| `app/club-scene.tsx` | Shared character rendering and legacy scene |
| `app/game-motion.tsx` | Game transitions and animation lifecycle |
| `app/character-picker.tsx` / `lib/characters.mjs` | Character selection and character registry |
| `app/api/game/route.ts` / `lib/game.mjs` | Game API, authentication, and rules |
| `lib/discussion.mjs` | Discussion timing and phase transitions |
| `public/lobby-art/` | Illustrated backgrounds, tables, and character assets |
| `drizzle/` | Database migrations |
| `scripts/local-start.mjs` | Build, migration, and local server startup |
| `tests/` | Rules and API checks |

## Development and checks

```sh
npm test
npx tsc --noEmit
```

Prepare the local build and database without starting a server:

```sh
node scripts/local-start.mjs --build-only
```

With the server running, run API checks against this copy. In PowerShell:

```powershell
$env:GAME_TEST_URL = 'http://127.0.0.1:5176'
node tests/api-smoke.mjs
node tests/character-api-smoke.mjs
node tests/discussion-timer-api.mjs
node tests/clue-timer-api.mjs
```

API checks create temporary test rooms. The game currently has no account system, global leaderboard, automatic scheduled deletion of expired room records.
