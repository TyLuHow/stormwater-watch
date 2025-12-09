<objective>
Create a compelling landing page for Stormwater Watch that clearly communicates the platform's purpose, use-cases, functionality, and future direction to a mixed audience of environmental professionals (NGOs, attorneys) and concerned citizens.

The landing page should balance professional credibility with accessibility, making complex water quality compliance topics understandable while maintaining the "mission control" design aesthetic established in the project.
</objective>

<context>
Stormwater Watch is a nonprofit civic tech platform for monitoring California stormwater permit violations using public data (CIWQS/SMARTS/eSMR). The platform serves:

1. **Environmental NGOs and attorneys** - Need tools to identify, track, and prosecute violations systematically
2. **Concerned citizens** - Want to understand water quality in their communities

The app features:
- Real-time violation monitoring with interactive maps
- Automated spatial enrichment (watersheds, DACs, impaired waters)
- Attorney-ready case packet generation with precipitation context
- Spatial alert subscriptions (polygon/buffer/jurisdiction)
- 1.2M+ water quality samples from eSMR data (2006-2025)
- Weekly automated data syncs

Current design system:
- "Mission control" aesthetic (dark mode, OKLCH colors, purposeful animations)
- Designed to feel serious and urgent, not consumer-friendly
- See @DESIGN_SYSTEM.md for complete design philosophy

Tech stack: Next.js 16, React 19, Tailwind CSS v4, deployed on Vercel

Before starting, read @README.md, @FEATURES.md, @MVP_COMPLETE.md, and @DESIGN_SYSTEM.md to understand the platform's capabilities and design language.
</context>

<requirements>
The landing page must include these sections:

1. **Hero Section**
   - Clear, compelling headline that immediately communicates the problem being solved
   - Subheadline explaining what Stormwater Watch does
   - Primary CTA (e.g., "View Dashboard" or "Explore Violations")
   - Secondary CTA (e.g., "Learn More" or "Get Alerts")
   - Visual element that hints at the platform (consider using a subtle gradient or animation, not a screenshot since we want text/CTAs focus)

2. **Problem Statement**
   - Why this platform exists
   - The gap between available data and actionable information
   - Environmental justice angle (DACs, impaired waters)

3. **Use Cases** (3-4 scenarios)
   - Environmental attorney building a case
   - NGO monitoring their watershed
   - Concerned citizen checking local facilities
   - Water quality researcher analyzing trends
   - Each use case should be concise (2-3 sentences) and specific

4. **Key Features** (highlight 4-6 core capabilities)
   - Real-time violation monitoring
   - Spatial enrichment and context
   - Attorney-ready case packets
   - Automated alerts
   - 1.2M+ water quality samples
   - Weekly automated data syncs
   - Each feature should explain WHY it matters, not just WHAT it does

5. **How It Works** (simplified 3-4 step flow)
   - Data ingestion → Enrichment → Monitoring → Action
   - Make it understandable to non-technical users

6. **Data Sources & Transparency**
   - List public data sources (eSMR, CIWQS/SMARTS, CalEnviroScreen, USGS, EPA 303d)
   - Emphasize that all data is public and verified
   - Explain update cadence (weekly eSMR sync)

7. **Roadmap / Where We're Headed**
   - Near-term: SMARTS violation import automation
   - Medium-term: Predictive analytics, AI-powered severity scoring
   - Long-term: Multi-state expansion, community data validation
   - Keep aspirational but realistic

8. **Call to Action**
   - Encourage exploration (link to dashboard)
   - Option to sign up for alerts (link to subscriptions)
   - Open source / community contribution mention

9. **Footer**
   - Links to key pages (Dashboard, About, Contact, GitHub)
   - License information (MIT)
   - Contact info
</requirements>

<implementation>
1. Create the landing page as the root route: `./app/page.tsx`

2. Follow the existing design system:
   - Use OKLCH colors from globals.css
   - Incorporate mission control aesthetic (dark mode first, subtle animations)
   - Use animations sparingly: slide-in-bottom for sections, fade-in-scale for cards
   - Reference existing components from @components/ where appropriate (Card, Button, etc.)

3. Writing style:
   - **Accessible but not dumbed down** - Explain technical terms (HUC12, NAL, DAC) on first use
   - **Action-oriented language** - Focus on what users can DO, not just what data exists
   - **Empathetic framing** - Acknowledge the frustration of manual spreadsheet work
   - **Mission-driven tone** - This is civic infrastructure, not a SaaS product
   - Avoid jargon where possible; where unavoidable, provide brief inline explanations

4. Structure:
   - Use semantic HTML (header, main, section, footer)
   - Each section should be a distinct `<section>` with appropriate spacing
   - Add staggered animations for progressive disclosure (use animation delays)
   - Ensure responsive design (mobile-first, enhances to desktop)

5. What to avoid:
   - Don't use generic stock photos or placeholder images
   - Don't make promises the platform can't deliver yet (stick to shipped features for "Features" section, use "Roadmap" for future plans)
   - Don't overwhelm with technical details - save those for documentation
   - Don't use dark patterns or aggressive CTAs - this is a public good, not a conversion funnel

6. Ensure the page loads quickly:
   - Use Next.js Server Components where possible
   - Avoid heavy client-side JavaScript
   - Optimize any animations to use transform/opacity only (GPU-accelerated)
</implementation>

<output>
Create or modify these files:

- `./app/page.tsx` - The landing page component (will replace the current minimal placeholder)
- Optionally create `./components/landing/*.tsx` if you want to extract reusable landing page sections

The page should be production-ready and consistent with the existing design system.
</output>

<verification>
Before declaring complete:

1. Check that all 9 required sections are present and well-structured
2. Verify the page follows the mission control design aesthetic (dark mode, OKLCH colors)
3. Ensure accessibility (semantic HTML, proper heading hierarchy, keyboard navigation)
4. Test responsiveness (mobile, tablet, desktop breakpoints)
5. Confirm CTAs link to actual routes (/dashboard, /subscriptions, etc.)
6. Read through the copy - does it make water quality compliance understandable to non-experts while remaining credible to professionals?
</verification>

<success_criteria>
- Landing page clearly explains WHAT Stormwater Watch does, WHY it exists, and WHO it's for
- Mixed audience (professionals + citizens) can both understand the value proposition
- Design is consistent with mission control aesthetic
- All 9 sections are present with accurate, compelling content
- CTAs are clear and functional
- Page loads quickly and is fully responsive
- Copy strikes the right balance: accessible but not patronizing, urgent but not alarmist
</success_criteria>
