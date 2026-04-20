# Neurra games audit

**Status:** DRAFT — ratings unfilled
**Started:** _YYYY-MM-DD_
**Completed:** _YYYY-MM-DD_

Honest assessment of the 11 games against category leaders (Lumosity, Peak, Elevate). The audit's output is a single decision: is game work sprint-scale (Kova bet still viable, resume Phase 1 planning) or quarter-scale (Kova pauses, this quarter becomes game work)?

---

## How to use this document

This is a self-administered audit. Claude scaffolds; Addi rates and judges. The doc gates the next decision — pricing, reviewer, voice doc lock, all parked until this is signed off.

**Locking rule:** the audit is locked when sections 4 (per-game entries), 5 (rollup), and 6 (decision) are complete and section 7 (sign-off) is signed. Once locked, the verdicts drive the next planning gate; un-locking happens only if new evidence emerges (e.g., a comparable was misidentified).

---

## 1. Audit rules

These are non-negotiable. Quote them back at me if I try to skip one.

1. **I do the ratings, not Claude.** Claude scaffolds, asks clarifying questions, enforces rule violations. Claude does not assign concept or execution scores.
2. **Specific category comparable required.** Every game must name an actual game from Lumosity, Peak, or Elevate (or another credible competitor). "Vibes" or "feels like Lumosity in general" is not allowed. If no comparable exists, that's a real datum — flag it explicitly and consider whether the game is novel-without-prior-art (positive) or invented-without-validation (negative).
3. **"Fine as-is" requires written justification.** Not "feels okay." Concrete: "the mechanic produces a clear strategy tradeoff that the comparable doesn't have," "the visual design is at parity," "I'd pay to play this." If you can't write a sentence defending it, it's not fine.
4. **Concept ≥8 and execution ≤5 → iteration territory.** The idea is good; you haven't built it well yet. Verdict: salvageable.
5. **Concept ≤5 → execution rating doesn't matter.** Concept weakness cannot be executed around. Verdict: replacement or cut. Don't waste a row debating execution polish on a weak concept.
6. **Rating without playing the game in current state is invalid.** Both yours and the comparable. If you haven't played both within the last 48 hours, the rating is stale.
7. **Calibration anchors before rating.** Before scoring any of the 11, anchor your 1–10 scale on 2–3 reference games outside the category (suggested: Wordle, 2048, Threes!). Otherwise everything trends to 6–7.

---

## 2. Verdict matrix (sanity check, not gospel)

Use this as a check on your verdict, not as an automatic mapping. If your verdict disagrees with the matrix, write down why.

| Concept | Execution | Suggested verdict |
| --- | --- | --- |
| ≥8 | ≥7 | Fine as-is _(if justified per rule 3)_ |
| ≥8 | 5–6 | Salvageable with iteration |
| ≥8 | ≤4 | Salvageable with iteration (heavy) |
| 6–7 | ≥7 | Fine as-is _or_ polish (judgment call) |
| 6–7 | ≤6 | Salvageable with iteration |
| ≤5 | any | Concept weak — replace or cut |

---

## 3. Per-game entry template

Every game uses this shape. Don't skip fields. If a field doesn't apply, write "N/A" and explain.

```
### <Name> (<brain area>)

**Cognitive skill (verify or correct):** <e.g., working memory, attention,
processing speed, cognitive flexibility, divergent thinking>

**Current status:** <shipped / in-progress / has known bugs / etc.>

**Concept rating (1–10):** <fill — rate the IDEA, ignoring your build quality>

**Execution rating (1–10):** <fill — rate how well you've built that idea
vs. the comparable. SKIP if concept ≤5.>

**Closest category comparable:** <name a specific game by name. Not "Lumosity
memory games" — name the specific Lumosity title.>

**What that comparable does that mine doesn't:** <concrete mechanics, not
generalities. "Adaptive difficulty per round," "haptic feedback on streak,"
"clearer failure state," etc.>

**Specific weaknesses (concrete, not vibes):**
- <weakness 1>
- <weakness 2>
- <weakness 3>

**Verdict:** <one of: fine as-is / salvageable with iteration /
concept weak — needs replacement / cut entirely>

**Justification:**
- If "fine as-is": <why? Concrete defense.>
- If "iteration": <what specifically would close the gap? Hour estimate.>
- If "replacement": <what cognitive task could replace this that's
  underserved in the category? Why is the slot worth keeping?>
- If "cut": <why is the slot better empty than weak?>
```

---

## 4. Per-game entries

Eleven games. Order is alphabetical to remove "I'll rate the easy ones first" bias.

### Chain Reaction (speed)

_(use template above)_

---

### Face Place (memory)

_(use template above)_

---

### Ghost Kitchen (memory)

_(use template above)_

---

### Mind Drift (memory)

_(use template above)_

---

### Mirrors (flexibility)

_(use template above)_

---

### Pulse (focus)

_(use template above)_

---

### Rewind (memory)

_(use template above)_

---

### Signal & Noise (focus)

_(use template above)_

---

### Split Focus (flexibility)

_(use template above)_

---

### Word Weave (creativity)

_(use template above)_

---

### Zen Flow (focus)

_(use template above)_

---

## 5. Aggregate rollup

Filled after all 11 entries are complete.

### 5.1 By verdict

| Verdict | Count | Games |
| --- | --- | --- |
| Fine as-is | _(fill)_ | _(list)_ |
| Salvageable with iteration | _(fill)_ | _(list)_ |
| Concept weak — needs replacement | _(fill)_ | _(list)_ |
| Cut entirely | _(fill)_ | _(list)_ |

### 5.2 By brain area coverage

If you cut or flag games for replacement, check brain-area coverage doesn't collapse. Memory currently has 4 games (Ghost Kitchen, Face Place, Mind Drift, Rewind), Focus has 3, Flexibility has 2, Creativity has 1, Speed has 1.

| Brain area | Games before audit | Games after (verdict-applied) | At-risk? |
| --- | --- | --- | --- |
| Memory | 4 | _(fill)_ | _(fill)_ |
| Focus | 3 | _(fill)_ | _(fill)_ |
| Flexibility | 2 | _(fill)_ | _(fill)_ |
| Creativity | 1 | _(fill)_ | _(fill — already at 1)_ |
| Speed | 1 | _(fill)_ | _(fill — already at 1)_ |

If Creativity or Speed coverage drops to zero, that's a category gap that may force a replacement even if the verdict was "cut."

### 5.3 Time estimates

| Action | Per-game | Count | Subtotal |
| --- | --- | --- | --- |
| Iterate on a "salvageable" game | ~_(estimate)_ hrs | _(count)_ | _(sum)_ |
| Replace a "needs replacement" game (design + build) | ~_(estimate)_ hrs | _(count)_ | _(sum)_ |
| Cut a game (UI removal, redirect, settings cleanup) | ~_(estimate)_ hrs | _(count)_ | _(sum)_ |
| **Total estimated game work** | | | **_(sum)_ hrs** |

Compare to your realistic bandwidth — 15–20 hrs/week. _(total ÷ 17.5 ≈ weeks of work)_

---

## 6. Decision

Filled after rollup is complete. The decision is binary at the top, with reasoning below.

### 6.1 Game work scale

Pick one:

- [ ] **Sprint-scale** — game work is ≤80 hours total (≤~5 weeks at 15–20 hrs/wk). Kova bet is still viable. Game fixes happen in parallel during Kova phases or in a dedicated sprint after Phase 1.
- [ ] **Quarter-scale** — game work is >80 hours total OR concept weakness is foundational across most games. Kova pauses for this quarter. Quarter becomes game work.

### 6.2 Reasoning

_(2–4 sentences. What signal in the rollup pushed the decision to that side? Be specific.)_

### 6.3 If sprint-scale: what changes downstream?

- [ ] Pricing decision proceeds as analyzed.
- [ ] Reviewer plan proceeds as committed.
- [ ] Voice doc lock proceeds at end of week 3.
- [ ] Phase 1 starts on _YYYY-MM-DD_.
- [ ] Game iteration sprint scheduled for _<when>_.

### 6.4 If quarter-scale: what changes downstream?

- [ ] Pricing analysis parked (preserved in chat history; revisit when game work is done).
- [ ] Reviewer gig not posted.
- [ ] Voice doc stays at scaffold (committed but not filled).
- [ ] New scaffold needed: game-redesign plan at `docs/audit/games-redesign-plan.md`.
- [ ] Re-evaluation of Kova bet at end of game-redesign quarter.

---

## 7. Sign-off

| Field | Value |
| --- | --- |
| Audit completed by | Addi |
| Date completed | _YYYY-MM-DD_ |
| Total time spent on audit | _<hours>_ |
| Decision | _Sprint-scale / Quarter-scale_ |
| Next gate scheduled | _<date or trigger>_ |

**Lock commit message (when ready):** `audit: lock games audit — verdict <sprint-scale | quarter-scale>`

---

## Appendix: change log

Append-only. Most recent at top.

- _YYYY-MM-DD — initial scaffold_
