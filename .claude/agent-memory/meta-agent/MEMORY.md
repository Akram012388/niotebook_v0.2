# Meta-Agent Memory

## Agent Inventory (as of 2026-02-09)

15 agents in `.claude/agents/`:

| Agent | Color | Model | Purpose |
|-------|-------|-------|---------|
| architect | blue | opus | Architecture decisions, ADRs, design reviews (no code) |
| backend-engineer | ? | ? | Backend/Convex development |
| business-analyst | yellow | opus | Business analysis, market research, competitive intelligence, strategy |
| code-reviewer | cyan | opus | Code quality, security, maintainability review |
| code-simplifier | ? | ? | Code simplification and complexity reduction |
| debugger | ? | ? | Bug diagnosis and debugging |
| dx-advocate | ? | ? | Developer experience improvements |
| frontend-designer | ? | ? | Frontend/UI development |
| meta-agent | ? | ? | Agent builder (this agent) |
| performance-analyst | green | opus | Performance profiling and optimization |
| scout | pink | opus | Codebase exploration and mapping |
| test-writer | ? | ? | Test creation |
| ceo | blue | opus | Mark Cuban persona. Product strategy, growth, competitive warfare, brand |
| cfo | green | opus | Kevin O'Leary persona. Financial strategy, unit economics, pricing |
| visionary | magenta | opus | Steve Jobs persona. Product vision, simplicity, taste, design philosophy |

## Business Agent Personas

- CEO channels Mark Cuban (sweat equity, earned growth, bootstrap mentality)
- CFO channels Kevin O'Leary (financial discipline, every dollar is a soldier)
- Visionary channels Steve Jobs (simplicity, taste, reality distortion field, category creation)
- Business Analyst has no persona (pure analytical rigor)

## Format Conventions

- No number prefixes in filenames (use descriptive kebab-case names)
- YAML frontmatter: name, description (with examples), model, color, memory
- Description field contains user/assistant example pairs with `<commentary>` tags
- Colors used: blue, cyan, green, magenta, orange, pink, purple, red, yellow
- Model: `opus` for high-reasoning agents
- Memory: `project` for agents that benefit from persistent context
- System prompts are detailed (hundreds of words), not capped at 200
- Each agent has a Persistent Agent Memory section pointing to `.claude/agent-memory/<name>/`

## Coverage Gaps

- No dedicated agent for: documentation writing, dependency management, migration execution, accessibility review, i18n/l10n
