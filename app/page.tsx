import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropletIcon,
  MapPinIcon,
  FileTextIcon,
  BellIcon,
  Database,
  TrendingUp,
  Users,
  Scale,
  FlaskConical,
  Zap,
  CheckCircle2,
  ArrowRight,
  Github,
  AlertTriangle,
  Clock
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <header className="relative overflow-hidden border-b bg-gradient-to-br from-background via-background to-primary/5">
        <div className="absolute inset-0 data-grid opacity-30" />
        <div className="container relative mx-auto px-6 py-20 lg:py-32">
          <div className="mx-auto max-w-4xl text-center space-y-8 slide-in-bottom">
            {/* Live Monitoring Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="uppercase tracking-wide text-primary">Live Monitoring</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              California Stormwater
              <br />
              <span className="text-gradient">Command Center</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Transform public water quality data into actionable intelligence for environmental enforcement and community protection.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4" style={{ animationDelay: "0.1s" }}>
              <Button asChild size="lg" className="text-base px-8 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
                <Link href="/dashboard">
                  View Dashboard
                  <ArrowRight className="ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8">
                <Link href="/subscriptions">
                  <BellIcon className="mr-2 h-4 w-4" />
                  Set Up Alerts
                </Link>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 max-w-3xl mx-auto" style={{ animationDelay: "0.2s" }}>
              {[
                { value: "1.2M+", label: "Water Quality Samples" },
                { value: "Weekly", label: "Automated Data Sync" },
                { value: "5+", label: "Public Data Sources" },
                { value: "100%", label: "Free & Open Source" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Problem Statement */}
        <section className="container mx-auto px-6 py-20 lg:py-28">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12 slide-in-bottom">
              <h2 className="text-4xl font-bold mb-4">The Data Exists. The Tools Don't.</h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                California generates millions of stormwater quality measurements each year, but that data sits in disconnected spreadsheets—inaccessible to the communities and advocates who need it most.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mt-12">
              {[
                {
                  icon: FileTextIcon,
                  title: "Manual Spreadsheet Work",
                  description: "Environmental attorneys spend hours downloading CSV files, cross-referencing permits, and manually calculating exceedances—work that should be automated.",
                },
                {
                  icon: MapPinIcon,
                  title: "Missing Context",
                  description: "Raw data doesn't tell you if a facility discharges to an impaired water body, sits in a disadvantaged community (DAC), or has a pattern of repeat violations.",
                },
                {
                  icon: AlertTriangle,
                  title: "Justice Gap",
                  description: "Communities bearing the greatest burden from pollution often lack the technical capacity to identify and act on violations affecting their watersheds.",
                },
              ].map((item, i) => (
                <Card key={i} className="fade-in-scale hover:shadow-lg transition-all" style={{ animationDelay: `${i * 0.1}s` }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="rounded-lg bg-primary/10 p-3">
                        <item.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="bg-muted/30 border-y">
          <div className="container mx-auto px-6 py-20 lg:py-28">
            <div className="mx-auto max-w-4xl">
              <div className="text-center mb-12 slide-in-bottom">
                <h2 className="text-4xl font-bold mb-4">Built for Action, Not Just Analysis</h2>
                <p className="text-xl text-muted-foreground">
                  From courtrooms to community meetings, Stormwater Watch serves the full spectrum of water quality advocacy.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    icon: Scale,
                    role: "Environmental Attorney",
                    scenario: "Building a Citizen Suit",
                    description: "Generate attorney-ready case packets with precipitation context, facility location data, watershed information, and DAC status—all automatically compiled from verified public sources. Download PDFs with full data provenance for court submissions.",
                  },
                  {
                    icon: Users,
                    role: "Watershed NGO",
                    scenario: "Monitoring Your Region",
                    description: "Draw a custom boundary around your watershed (HUC12) and receive weekly alerts whenever a facility inside that area exceeds permit limits. Track repeat offenders discharging to impaired waters like the San Francisco Bay or Ballona Creek.",
                  },
                  {
                    icon: DropletIcon,
                    role: "Concerned Resident",
                    scenario: "Checking Local Facilities",
                    description: "Search for industrial facilities near your home, school, or park. See their compliance history, what pollutants they monitor (copper, zinc, pH), and whether they've had recent violations. Understand your local water quality without needing a science degree.",
                  },
                  {
                    icon: FlaskConical,
                    role: "Water Quality Researcher",
                    scenario: "Analyzing Long-Term Trends",
                    description: "Access 1.2M+ eSMR samples spanning 2006-2025. Filter by parameter, region, or time period. Export data for statistical analysis, identify seasonal patterns, and study the effectiveness of enforcement actions over time.",
                  },
                ].map((useCase, i) => (
                  <Card key={i} className="fade-in-scale" style={{ animationDelay: `${i * 0.1}s` }}>
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-primary/10 p-2.5">
                          <useCase.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-primary uppercase tracking-wide">{useCase.role}</div>
                          <CardTitle className="text-lg mt-1">{useCase.scenario}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{useCase.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="container mx-auto px-6 py-20 lg:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12 slide-in-bottom">
              <h2 className="text-4xl font-bold mb-4">Mission-Critical Capabilities</h2>
              <p className="text-xl text-muted-foreground">
                Every feature designed to turn raw data into enforcement action.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: TrendingUp,
                  title: "Real-Time Violation Monitoring",
                  description: "Automated detection of permit exceedances with severity scoring. Know immediately when facilities exceed numeric action levels (NALs) or discharge limits.",
                  why: "Stop violations before they compound into environmental disasters.",
                },
                {
                  icon: MapPinIcon,
                  title: "Spatial Enrichment",
                  description: "Every facility automatically tagged with watershed (HUC12), county, MS4 jurisdiction, and CalEnviroScreen DAC status using USGS and Census data.",
                  why: "Understand environmental justice implications at a glance.",
                },
                {
                  icon: FileTextIcon,
                  title: "Case Packet Generation",
                  description: "One-click PDF exports with facility details, violation timeline, sample data, precipitation context, and legal review checklists.",
                  why: "Hours of paralegal work reduced to seconds—with full data provenance.",
                },
                {
                  icon: BellIcon,
                  title: "Intelligent Alert Subscriptions",
                  description: "Polygon-based, buffer radius, or jurisdiction-based alerts. Set thresholds for minimum exceedance ratio, repeat offender count, or impaired water discharge.",
                  why: "Your inbox becomes a violation detection system, not a data firehose.",
                },
                {
                  icon: Database,
                  title: "1.2M+ eSMR Samples",
                  description: "Complete electronic Self-Monitoring Reports (eSMR) from 2006-2025. All parameters, all regions, all facilities—indexed and searchable in milliseconds.",
                  why: "The largest California stormwater dataset ever assembled for public use.",
                },
                {
                  icon: Clock,
                  title: "Weekly Automated Sync",
                  description: "Nightly jobs fetch new eSMR submissions, enrich with spatial context, match against subscriptions, and send alerts—no human intervention required.",
                  why: "Data freshness matters when enforcement windows are time-limited.",
                },
              ].map((feature, i) => (
                <Card key={i} className="fade-in-scale group hover:shadow-lg transition-all" style={{ animationDelay: `${i * 0.05}s` }}>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2.5 group-hover:bg-primary/20 transition-colors">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{feature.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{feature.description}</p>
                    <div className="flex items-start gap-2 text-xs font-medium text-primary">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span className="leading-relaxed">{feature.why}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-muted/30 border-y">
          <div className="container mx-auto px-6 py-20 lg:py-28">
            <div className="mx-auto max-w-4xl">
              <div className="text-center mb-12 slide-in-bottom">
                <h2 className="text-4xl font-bold mb-4">From Data to Action in Four Steps</h2>
                <p className="text-xl text-muted-foreground">
                  Automated pipeline that never sleeps, never misses a violation.
                </p>
              </div>

              <div className="relative">
                {/* Connection Line */}
                <div className="absolute left-8 top-12 bottom-12 w-0.5 bg-border hidden md:block" />

                <div className="space-y-12">
                  {[
                    {
                      step: "01",
                      title: "Data Ingestion",
                      description: "Weekly automated pulls from California's eSMR system, CIWQS/SMARTS violation databases, and USGS/EPA environmental datasets. All data verified against original sources.",
                      detail: "Sources: eSMR (1.2M+ samples), CIWQS violation reports, USGS HUC12 watersheds, CalEnviroScreen 4.0, EPA 303(d) impaired waters list.",
                    },
                    {
                      step: "02",
                      title: "Spatial Enrichment",
                      description: "Point-in-polygon matching assigns each facility to its watershed, county, MS4 jurisdiction, and DAC status. Turf.js geospatial operations run in milliseconds.",
                      detail: "Enrichment adds context that turns coordinates into community impact stories.",
                    },
                    {
                      step: "03",
                      title: "Violation Detection & Matching",
                      description: "Exceedance calculations against permit limits. Subscription matcher tests each new violation against spatial boundaries, filters, and thresholds you've configured.",
                      detail: "Supports polygon areas, buffer radii, and jurisdictions—with combinable filters for pollutant type, severity, and repeat offender status.",
                    },
                    {
                      step: "04",
                      title: "Alerts & Case Packets",
                      description: "Matching violations trigger email alerts with facility details and direct links. Generate PDF case packets with precipitation context, legal checklists, and full data provenance.",
                      detail: "From detection to action-ready documentation in under 10 seconds.",
                    },
                  ].map((step, i) => (
                    <div key={i} className="relative flex gap-8 fade-in-scale" style={{ animationDelay: `${i * 0.1}s` }}>
                      {/* Step Number Circle */}
                      <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground font-bold text-lg">
                        {step.step}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-8">
                        <h3 className="text-2xl font-semibold mb-2">{step.title}</h3>
                        <p className="text-muted-foreground leading-relaxed mb-2">{step.description}</p>
                        <p className="text-sm text-primary/80 leading-relaxed">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Data Sources & Transparency */}
        <section className="container mx-auto px-6 py-20 lg:py-28">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12 slide-in-bottom">
              <h2 className="text-4xl font-bold mb-4">Trusted Data, Transparent Process</h2>
              <p className="text-xl text-muted-foreground">
                Every data point traceable to its source. Every calculation verifiable.
              </p>
            </div>

            <Card className="fade-in-scale">
              <CardHeader>
                <CardTitle>Public Data Sources</CardTitle>
                <CardDescription>All data is public, verified, and updated regularly</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      source: "eSMR (Electronic Self-Monitoring Reports)",
                      description: "1.2M+ water quality samples from industrial stormwater facilities, 2006-2025",
                      update: "Weekly automated sync",
                      status: "✓ Functional",
                      statusColor: "text-green-600",
                    },
                    {
                      source: "CIWQS/SMARTS Interactive Violation Reports",
                      description: "Formal enforcement actions, permit violations, compliance status",
                      update: "Manual import",
                      status: "⚙ In Development",
                      statusColor: "text-orange-600",
                    },
                    {
                      source: "CalEnviroScreen 4.0",
                      description: "Disadvantaged Community (DAC) designations, pollution burden scores",
                      update: "Spatial enrichment",
                      status: "✓ Functional",
                      statusColor: "text-green-600",
                    },
                    {
                      source: "USGS Watershed Boundary Dataset",
                      description: "HUC12 watershed polygons for spatial context",
                      update: "Spatial enrichment",
                      status: "✓ Functional",
                      statusColor: "text-green-600",
                    },
                    {
                      source: "EPA 303(d) Impaired Waters List",
                      description: "California water bodies impaired by pollutants",
                      update: "Receiving water analysis",
                      status: "○ Planned",
                      statusColor: "text-muted-foreground",
                    },
                    {
                      source: "NOAA/NWS Precipitation Data",
                      description: "Observed rainfall for wet weather discharge context",
                      update: "Case packet generation",
                      status: "✓ Functional",
                      statusColor: "text-green-600",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                      <Database className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-1">
                          <h4 className="font-semibold">{item.source}</h4>
                          <div className="flex items-center gap-3 text-xs">
                            <span className={`font-semibold ${item.statusColor}`}>{item.status}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground">{item.update}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="text-sm leading-relaxed">
                      <strong className="text-foreground">Full Data Provenance:</strong> Every case packet includes data source citations, retrieval timestamps, and calculation methodologies. Courts and regulatory agencies can independently verify all findings.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Roadmap */}
        <section className="bg-muted/30 border-y">
          <div className="container mx-auto px-6 py-20 lg:py-28">
            <div className="mx-auto max-w-4xl">
              <div className="text-center mb-12 slide-in-bottom">
                <h2 className="text-4xl font-bold mb-4">Where We're Headed</h2>
                <p className="text-xl text-muted-foreground">
                  Building the infrastructure for environmental enforcement—one feature at a time.
                </p>
              </div>

              <div className="space-y-6">
                {[
                  {
                    timeline: "Near-Term (Q1 2026)",
                    title: "SMARTS Violation Import Automation",
                    description: "Currently manual; automating weekly sync of formal enforcement actions from CIWQS/SMARTS Interactive Violation Reports.",
                    status: "In Development",
                  },
                  {
                    timeline: "Medium-Term (Q2-Q3 2026)",
                    title: "Predictive Analytics & AI Severity Scoring",
                    description: "Machine learning models to predict which violations are most likely to result in environmental harm. Prioritize enforcement resources on high-risk facilities.",
                    status: "Planned",
                  },
                  {
                    timeline: "Medium-Term (Q3-Q4 2026)",
                    title: "Community Data Validation Network",
                    description: "Enable community scientists to submit field observations, photos, and water quality measurements to supplement official data—with verification workflows.",
                    status: "Planned",
                  },
                  {
                    timeline: "Long-Term (2027+)",
                    title: "Multi-State Expansion",
                    description: "Extend platform to Oregon, Washington, and other states with public stormwater data. Build national coalition of water quality advocates.",
                    status: "Vision",
                  },
                ].map((item, i) => (
                  <Card key={i} className="fade-in-scale" style={{ animationDelay: `${i * 0.1}s` }}>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-primary uppercase tracking-wide mb-1">{item.timeline}</div>
                          <CardTitle>{item.title}</CardTitle>
                        </div>
                        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          item.status === "In Development"
                            ? "bg-primary/10 text-primary border-primary/20"
                            : item.status === "Planned"
                            ? "bg-accent/10 text-accent border-accent/20"
                            : "bg-muted text-muted-foreground border-border"
                        }`}>
                          {item.status}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Have ideas or feature requests?{" "}
                  <a href="https://github.com/TyLuHow/stormwater-watch/issues" className="text-primary hover:underline font-medium">
                    Open an issue on GitHub
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="container mx-auto px-6 py-20 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="slide-in-bottom">
              <h2 className="text-4xl font-bold mb-4">Ready to Monitor Your Watershed?</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Free, open-source, and built for environmental justice. Start tracking violations today.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="text-base px-8 shadow-lg shadow-primary/20">
                  <Link href="/dashboard">
                    Explore the Dashboard
                    <ArrowRight className="ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base px-8">
                  <Link href="/subscriptions">
                    <BellIcon className="mr-2 h-4 w-4" />
                    Create Alert Subscription
                  </Link>
                </Button>
              </div>

              <div className="mt-12 p-6 rounded-lg border bg-card">
                <h3 className="font-semibold text-lg mb-4">Open Source & Community Powered</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Stormwater Watch is MIT licensed and built in public. Contribute code, report bugs, or suggest features on GitHub.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button asChild variant="outline">
                    <a href="https://github.com/TyLuHow/stormwater-watch" target="_blank" rel="noopener noreferrer">
                      <Github className="mr-2 h-4 w-4" />
                      View on GitHub
                    </a>
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href="/esmr">
                      <Database className="mr-2 h-4 w-4" />
                      Explore eSMR Data
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* About */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase tracking-wide">About</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/dashboard" className="hover:text-foreground transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/esmr" className="hover:text-foreground transition-colors">
                    eSMR Data Explorer
                  </Link>
                </li>
                <li>
                  <Link href="/subscriptions" className="hover:text-foreground transition-colors">
                    Alert Subscriptions
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase tracking-wide">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="https://github.com/TyLuHow/stormwater-watch" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                    GitHub Repository
                  </a>
                </li>
                <li>
                  <a href="https://github.com/TyLuHow/stormwater-watch/issues" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                    Report an Issue
                  </a>
                </li>
                <li>
                  <a href="https://github.com/TyLuHow/stormwater-watch/blob/main/FEATURES.md" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                    Documentation
                  </a>
                </li>
              </ul>
            </div>

            {/* Data Sources */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase tracking-wide">Data Sources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="https://ciwqs.waterboards.ca.gov" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                    CIWQS/SMARTS
                  </a>
                </li>
                <li>
                  <a href="https://oehha.ca.gov/calenviroscreen" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                    CalEnviroScreen
                  </a>
                </li>
                <li>
                  <a href="https://www.usgs.gov/national-hydrography" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                    USGS HUC12
                  </a>
                </li>
                <li>
                  <a href="https://www.epa.gov/waterdata/attains" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                    EPA 303(d) List
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase tracking-wide">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="https://github.com/tylerjrbuell/stormwater-watch/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                    MIT License
                  </a>
                </li>
                <li>
                  <span className="text-muted-foreground/60">
                    Free & Open Source
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>
              Built with <span className="text-primary">♥</span> for environmental advocates, by environmental advocates.
            </p>
            <p className="mt-2">
              © {new Date().getFullYear()} Stormwater Watch. A nonprofit civic tech platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
