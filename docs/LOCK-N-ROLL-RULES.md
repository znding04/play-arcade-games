# Lock-n-Roll Official Rules

Based on research from the original jayisgames/Kongregate game.

## Game Overview

Lock-n-Roll is a dice puzzle game where you roll 4 dice and place them on a 4x4 grid.
Once placed, dice are locked. Score points by forming color and number patterns within
scoring groups. Only the most difficult combinations clear dice from the board — all
others score points but stay locked.

## Dice

- **Numbers**: 1–4 (no fives or sixes)
- **Colors**: 6 colors — red, blue, green, yellow, white, black
- **Dice per roll**: 4

## Grid

- **Size**: 4x4 (16 cells)
- Once placed, dice are permanently locked

## Scoring Groups (15 total)

Dice are evaluated in overlapping groups of 4. A single die can participate in up to
7 different groups.

| Group Type       | Count | Description                                     |
|------------------|-------|-------------------------------------------------|
| Rows             | 4     | Each horizontal row of 4                        |
| Columns          | 4     | Each vertical column of 4                       |
| Diagonals        | 2     | Top-left to bottom-right, top-right to bottom-left |
| 2x2 Quadrants    | 4     | Four non-overlapping 2x2 squares                |
| Four Corners     | 1     | The 4 corner cells                              |

### Group membership by position

- **Corner cells** (0,3,12,15): 5 groups each
- **Edge cells** (1,2,4,7,8,11,13,14): 4 groups each
- **Center cells** (5,6,9,10): 7 groups each

## Combinations That CLEAR (removed from board)

These 4 "prime combos" require all 4 cells in a group to be filled. They score points
AND clear the dice, freeing board space.

| Combination                              | Points | Description                        |
|------------------------------------------|--------|------------------------------------|
| Same color + same number                 | 100    | All 4 dice identical               |
| Same color + all different numbers       | 80     | Same color, numbers 1-2-3-4        |
| All different colors + same number       | 70     | 4 different colors, same number    |
| All different colors + all different numbers | 60  | 4 different colors, numbers 1-2-3-4 |

## Combinations That ONLY SCORE (stay on board)

These partial patterns score points but do NOT clear dice.

| Combination          | Points | Description                          |
|----------------------|--------|--------------------------------------|
| 4 same number        | 30     | All 4 same number, mixed colors      |
| 4 same color         | 30     | All 4 same color, mixed numbers      |
| 3 same number        | 15     | 3 of 4 dice share a number           |
| 3 same color         | 15     | 3 of 4 dice share a color            |
| 2 pairs (number)     | 10     | Two different pairs of numbers       |
| 2 pairs (color)      | 10     | Two different pairs of colors        |
| 1 pair (number)      | 5      | One pair of matching numbers         |
| 1 pair (color)       | 5      | One pair of matching colors          |

Note: Within a group, only the best matching combination scores (no double-counting).
Number patterns and color patterns are evaluated independently — a group can score
from both a number pattern AND a color pattern.

## Joker Rules

- **Earned**: First joker at 250 points; subsequent jokers at increasing intervals
- **Max**: 3 jokers
- **Usage**: Wildcard — counts as whatever number/color makes the best combination
- **Penalty**: Each joker in a combination reduces its point value by 25%
- **Display**: Shown as "J" in gold on the grid
- **Placement**: Can be placed on any empty cell at any time

## Game Over Condition

The game ends when there are fewer than 4 empty cells remaining on the board
(not enough room to place the next roll of 4 dice).

## Sources

- jayisgames.com review: https://jayisgames.com/review/lock-n-roll.php
- Kongregate game page: https://www.kongregate.com/en/games/jayisgames/lock-n-roll
