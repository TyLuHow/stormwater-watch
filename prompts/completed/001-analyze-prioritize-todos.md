<objective>
Research, cross-reference, and deeply analyze each todo item in TO-DOS.md to break them into more manageable chunks and prioritize them based on impact-to-effort ratio.

The goal is to create a clear, actionable roadmap that helps focus on high-impact work first while understanding dependencies, effort requirements, and technical complexity.
</objective>

<context>
Stormwater Watch is a civic tech platform for California water quality monitoring. The project has 7 active todos covering:
- UI improvements (map light mode)
- Database fixes (eSMR explorer)
- Data infrastructure (CalEnviroScreen DAC, USGS HUC12, NOAA precipitation)
- Data imports (SMARTS violations, EPA 303(d))

These todos were identified after creating a landing page that revealed gaps between "Infrastructure Ready" and "Functional" status.

Current todo file: @TO-DOS.md

Tech stack: Next.js 16, React 19, Prisma 6, PostgreSQL (Supabase), Vercel
</context>

<requirements>
For each of the 7 todos, research and analyze:

1. **Break down into subtasks**
   - Identify atomic steps required to complete
   - Call out any research/learning required
   - Note file modifications needed
   - Highlight any blockers or dependencies

2. **Estimate effort**
   - Simple (< 1 hour): Quick fixes, config changes
   - Medium (1-4 hours): Feature implementation, API integration
   - Complex (4+ hours): Data pipeline, multi-file refactoring
   - Consider learning curve for unfamiliar tools/APIs

3. **Assess impact**
   - High: Unblocks other work, critical for users, highly visible
   - Medium: Improves UX, adds valuable feature
   - Low: Nice-to-have, polish, future-proofing

4. **Identify dependencies**
   - What must be done before this?
   - What does this unblock?
   - Are there circular dependencies?

5. **Technical complexity**
   - Rate: Low / Medium / High
   - Note unfamiliar technologies
   - Identify potential risks or unknowns
</requirements>

<research>
For each todo, thoroughly examine:

1. **Map light mode** - Check @components/dashboard/map.tsx, research next-themes integration patterns

2. **eSMR database connection** - Examine @app/esmr/page.tsx, @app/api/esmr/stats/route.ts, understand SSR fetch issues

3. **CalEnviroScreen DAC geodata** - Read @public/geodata/README.md:40-59, understand download/conversion workflow

4. **USGS HUC12 watersheds** - Read @public/geodata/README.md:22-38, assess file size concerns

5. **NOAA precipitation** - Review @lib/providers/precipitation.ts, check case packet integration @lib/case-packet/generator.tsx

6. **SMARTS violations** - List sample files in data/samples/, understand current import patterns from eSMR implementation

7. **EPA 303(d)** - Research EPA ATTAINS API, understand impaired waters data structure

Use Grep, Read, and Bash tools as needed to gather information.
</research>

<analysis_approach>
After researching each todo:

1. **Cross-reference** - Look for shared patterns, reusable code, common blockers

2. **Calculate impact-to-effort ratio**
   - High Impact + Low Effort = Quick wins (priority 1)
   - High Impact + Medium Effort = Strategic (priority 2)
   - High Impact + High Effort = Major projects (priority 3)
   - Medium/Low Impact + Any Effort = Backlog (priority 4)

3. **Identify dependencies**
   - What's the critical path?
   - Which todos can be parallelized?
   - What requires external downloads/setup?

4. **Consider strategic value**
   - Does this unblock future work?
   - Does this make the landing page more honest?
   - Does this improve developer experience?
</analysis_approach>

<output>
Create a comprehensive analysis document: `./TODO-ANALYSIS.md`

Structure:
```markdown
# Todo Analysis & Prioritization

## Executive Summary
- Total todos: 7
- Priority 1 (Quick Wins): [count]
- Priority 2 (Strategic): [count]
- Priority 3 (Major Projects): [count]
- Priority 4 (Backlog): [count]

## Prioritized Roadmap
[List todos in priority order with one-line rationale]

---

## Detailed Analysis

### [Todo #1: Title]

**Current Status:** [From TO-DOS.md]

**Impact:** High/Medium/Low
- [Why this matters]
- [User/developer benefit]

**Effort:** Simple/Medium/Complex ([time estimate])
- [Main steps required]

**Complexity:** Low/Medium/High
- [Technical challenges]
- [Unfamiliar tech/APIs]

**Dependencies:**
- Blocks: [what this unblocks]
- Blocked by: [what must happen first]

**Subtasks:**
1. [Atomic step 1]
2. [Atomic step 2]
...

**Files to modify:**
- `path/to/file.ts:line` - [what changes]

**Risks/Unknowns:**
- [Potential issues]

**Recommendation:** Priority [1-4]
- [One-sentence why]

---

[Repeat for each todo]
```
</output>

<verification>
Before declaring complete:

1. All 7 todos have been analyzed
2. Each todo has: impact, effort, complexity, dependencies, subtasks
3. Priority assignments are clear and justified
4. Dependencies don't create circular loops
5. Quick wins (P1) are genuinely high-impact + low-effort
6. Analysis is grounded in actual code/file examination, not speculation
</verification>

<success_criteria>
- Comprehensive analysis document created at ./TODO-ANALYSIS.md
- All todos broken into subtasks (3-8 steps each)
- Clear priority ranking (1-4) based on impact-to-effort
- Dependencies mapped out
- Technical complexity assessed honestly
- Effort estimates are realistic
- Ready to pick up any todo and start work immediately
</success_criteria>
