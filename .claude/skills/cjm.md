# /cjm — Map Customer Journey

Create a Customer Journey Map for a user flow, connecting ДКЦП conflict analysis to concrete screen touchpoints.

## Usage

`/cjm [journey name or user goal]`

## Steps

1. Identify the ДКЦП segment and motivational conflict for this journey
2. Map each step: Action → Touchpoint → Screen → Thought → Emotion → Pain Point → Opportunity
3. Identify the resolution moment (where the conflict is resolved)
4. Identify failure modes (where the user might abandon)
5. Write the CJM document to `docs/cjm/[journey-name].md`
6. Generate an opportunity backlog (improvements per step)
7. Link each touchpoint to existing components or flag as "needs mockup"

Uses the `cjm-analyst` agent personality. Output is in Russian for user-facing content.

## Lua Critical Journeys (already identified)

1. First Launch → Active User
2. Core Action Loop: Log Period
3. Review Cycle History
4. Return After Absence
