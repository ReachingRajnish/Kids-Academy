# Maths Adventure: plan

A maths game for kids, modelled on how Todo Math is put together. It uses our own characters and art.
It's a static site that works when opened straight from the folder and on GitHub Pages.

## Decisions

- **Name:** Maths Adventure.
- **Money:** Indian rupees (₹ coins and notes).
- **No fixed curriculum.** There is one long skill ladder that starts at "adding to 10" and keeps going past
  Grade 2 (times tables, division, missing numbers, 3-digit numbers). A kid can move up as fast as they can.
  A level that isn't open yet can still be played as a 🚀 skip-ahead challenge. 3 stars there opens it.
- **More than one kid.** Each kid has their own profile with their own stars, levels and settings.

## Areas

| Area | Based on Todo Math's | What it is |
|---|---|---|
| 🗺️ Adventure | Daily Adventure + Mission | A skill map with stops, locks and treasure, plus a daily playlist |
| 🎮 Play | Free Choice | Every game on shelves by topic |
| ⚡ Practice | AI Practice + Times Tables | Fact drills (Basic or Timed) and the times tables notebook |
| 🧩 Brain Games | Brain Power | Logic and memory puzzles |
| 🏆 Collection | Collection + Challenge | Creature cards and medals |
| 🔒 Grown-ups | Parents | Progress by skill, weak spots, settings |

## The game engine (shared by every game)

- **Every game screen looks the same:** an exit button, the game name and level, 10 progress dots and a 🔊 button.
- **A short title card** plays before each round.
- **A round is 10 problems.**
  - Wrong once: "Try again" and a hint.
  - Wrong twice: "Show me" works through the answer step by step.
- **Stars per round:** 3 stars for 8 or more right first time, 2 stars for 6 or more, otherwise 1 star.
  3 stars opens the next level.
- **Two misses in a row** gives an easier problem next.
- **Missed facts come back** in later rounds, in every game.
- **Every game is a small file** in `games/`. It makes a problem, draws it and checks the answer.

## Phases

0. **The basics.** Profiles, the main menu, the engine, sound and voice, the keypad, and two games:
   Froggy Hop (tap the lily pad) and Quick Facts (keypad).
1. **Numbers and adding/subtracting.** Rocket Launch (place value blocks), Stacked Addition and Subtraction
   with step-by-step carrying, Equation Maker, Number Line Hop, Hundred Puzzle, Compare & Order,
   and Make 10 / Make 100.
2. **Adventure.** The skill map, the daily playlist and today's goals, stars and gems, and creature cards.
3. **Measuring, time, money, graphs and shapes.** Ruler, Clock Tower, Shop (₹), picture and bar graphs,
   Shape Hunt, Pizza Party (equal shares) and Calendar.
4. **Times tables and sharing.** The times tables notebook, Array Garden, sharing as division,
   and Practice mode (Basic and Timed).
5. **Brain games.** 4×4 Sudoku, Memory Tap, Tangram, Mirror Match and Cube Count.
6. **Challenges and grown-ups.** Word problems, the True/False robot, boss challenges, the grown-ups page,
   and a final polish pass.
