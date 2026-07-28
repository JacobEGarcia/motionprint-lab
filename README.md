# Motionprint

**Motionprint** is an interactive animation-research prototype that transforms a person’s pointer gesture into a stylized character performance.

The project explores a simple question: if rhythm, hesitation, curvature, and imperfection are part of human authorship, can an animation tool preserve those signals while adding readable animation principles?

## The experiment

Draw a gesture with a mouse, pen, or finger. Motionprint presents three simultaneous layers:

- **Raw** — the original human gesture
- **Cleaned** — a smoothed trajectory that retains major timing and direction changes
- **Styled** — a reversible performance layer with anticipation, overshoot, and settle

Choose an emotional point of view—Curious, Brave, Tender, or Chaotic—and tune the exaggeration to see how a character can interpret the same authored path differently.

## Why it exists

Motionprint is inspired by [Humanico](https://jacobegarcia.github.io/humanico/), an earlier experiment by Jacob E. Garcia that considered timing error, rhythm, cursor entropy, and hand tremor as organic human signals. Motionprint reframes the same idea for creative tools: not proof of humanity, but proof of feeling.

## Design principles

1. **Artist in the loop** — results should remain inspectable, editable, and explainable.
2. **Layer, don’t replace** — the source gesture is preserved alongside every transformation.
3. **Expression over realism** — the goal is readable intent, not a claim of physical simulation.

## Run locally

```bash
npm install
npm run dev
```

The production build is created with:

```bash
npm run build
```

## Status

Motionprint is a portfolio research prototype, not a production animation system. It is not affiliated with Pixar or The Walt Disney Company.

## Author

Jacob E. Garcia — [LinkedIn](https://www.linkedin.com/in/jacob-emmanuel-garcia-26587a265)

