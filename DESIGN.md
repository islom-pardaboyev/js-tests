# JSTests design: Type-only statement

The first screen is made only of words, colour and space: the headline set at the width of the page, one lime action, nothing else. Pictures and the live product arrive below, large and few. The exam stays calm; the type and one flat lime field carry the character.

## Palette
- Dark default. Ground `#15150f`, surfaces `#201f18` / `#2a291f` / `#35342a`, ink `#f1efe6`, muted `#a8a597`.
- One accent, lime `#d5ff3f` (`--lime`, ink on it `#15150f`). It fills the primary action, every selected state (command row, open FAQ tile, slider thumb, chosen answer) and one full-width statement field per page.
- Light theme: warm paper `#ecebe4`, ink buttons, the same lime fields. Success teal, error coral, warning amber.
- No gradients, no resting shadows, no violet, no pink. Surfaces separate by tone steps; borders only inside the live product fragments and form fields.

## Type
League Spartan 800, uppercase, tracking about -0.05em, leading 0.84 to 0.92 for display. Figtree for text. JetBrains Mono only inside code and the exam timer. Headlines are two to three short lines; running text is 16px or more.

## Components
- Hero: headline across the page width, supporting sentence bottom-left, one lime button bottom-right. Lines rise from behind their baseline on load.
- Command list: the product's own menu set at display size; the selected row is a lime block.
- Stages: one range slider drives a clause and a product fragment.
- FAQ: filled tiles, one open at a time, the open tile turns lime.
- Footer: one quiet line, no block.
- Status screens (404, offline) use a dot-matrix drawing in the dot colours.

## Rules
- Never reveal answer correctness during the exam (the landing demo is a preview and does).
- Motion respects `prefers-reduced-motion`: content stays, travel is dropped.
- The certificate keeps its own dot pattern, shared with the PDF.
