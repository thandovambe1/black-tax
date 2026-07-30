import { AnimatedSection } from "@/components/animated-section";
import { BackToTop } from "@/components/back-to-top";
import { DonateForm } from "@/components/donate-form";
import { DonorWall } from "@/components/donor-wall";
import { LogoMark } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { AssistanceForm, ContactForm, MembershipForm, VolunteerForm } from "@/components/forms";
import { getHomepageData } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CircleDollarSign,
  MapPinned,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const navigation = [
  "Home",
  "About Us",
  "How It Works",
  "Transparency",
  "Projects",
  "Success Stories",
  "Get Help",
  "Volunteer",
  "Partner With Us",
  "News",
  "FAQs",
  "Contact",
  "Donate",
  "Member Login",
];

const paymentProviders = ["PayFast", "Peach Payments", "Ozow", "Debit Order", "Card Payments", "EFT", "Apple Pay", "Google Pay"];

const causes = [
  ["Education", ["School uniforms", "University bursaries", "School meals", "Stationery", "Libraries"]],
  ["Healthcare", ["Wheelchairs", "Medication", "Clinic support", "Mental health", "Eyecare"]],
  ["Housing", ["Roof repairs", "Flood assistance", "Fire victims", "Home rebuilding"]],
  ["Entrepreneurship", ["Small business grants", "Equipment", "Skills development", "Youth funding", "Women-owned businesses"]],
  ["Food Security", ["Community gardens", "Soup kitchens", "Emergency food parcels"]],
  ["Youth Development", ["Sports", "Coding", "Music", "Leadership", "Mentorship"]],
  ["Community Development", ["Road repairs", "Water access", "Public lighting", "Libraries", "Community halls"]],
] as const;

const faqItems = [
  ["What is Black Tax?", "Black Tax is a registered South African non-profit building a transparent, community-governed crowdfunding platform that turns small monthly contributions into large-scale impact."],
  ["Why only R10?", "Because accessibility matters. A contribution from just R10 makes membership inclusive while allowing millions of South Africans to participate collectively."],
  ["Can I cancel anytime?", "Yes. Members can pause or cancel contributions in their secure portal, subject to payment provider notice periods where applicable."],
  ["How do I know my money is safe?", "Every cent is tracked through public reporting, audited statements, governance controls and provider-based payment processing rather than direct debit simulation."],
  ["Who approves funding?", "Funding is reviewed through governance policies by authorised teams, community input structures and available-fund controls."],
  ["How are projects selected?", "Projects are assessed based on verified need, feasibility, impact potential, documentation, geographic equity and mission alignment."],
  ["Is the organisation audited?", "Yes. The platform is designed to publish annual audited statements, regular financial reports and governance updates publicly."],
  ["How are administrative costs controlled?", "Administrative expenditure is ring-fenced, publicly disclosed and benchmarked against impact delivery requirements."],
] as const;

const impactStatistics = [
  ["Members", "0"],
  ["Monthly Donations", "R0"],
  ["Total Donations Received", "R0"],
  ["Projects Funded", "0"],
  ["Lives Impacted", "0"],
  ["Volunteers", "0"],
  ["Corporate Partners", "0"],
  ["Applications Received", "0"],
  ["Applications Approved", "0"],
  ["Emergency Fund Balance", "R0"],
  ["Education Fund", "R0"],
  ["Healthcare Fund", "R0"],
  ["Entrepreneurship Fund", "R0"],
  ["Community Development Fund", "R0"],
  ["Housing Fund", "R0"],
  ["Food Security Fund", "R0"],
  ["Administration Costs", "R0"],
  ["Current Month Donations", "R0"],
] as const;

const expenditureCategories = [
  "Emergency Fund",
  "Education Fund",
  "Healthcare Fund",
  "Entrepreneurship Fund",
  "Community Development Fund",
  "Housing Fund",
  "Food Security Fund",
  "Administration Costs",
] as const;

const donationSnapshot = [
  ["Current Month", "R0"],
  ["Today's Donations", "R0"],
  ["This Year's Donations", "R0"],
  ["Largest Donation", "R0"],
  ["Recurring Members", "0"],
  ["One-Time Donations", "0"],
] as const;

const volunteerRoles = ["Doctor", "Lawyer", "Teacher", "Engineer", "Builder", "Electrician", "Plumber", "Mentor", "Tutor", "Community Leader"];

/** Safe funding percentage — guards against divide-by-zero / invalid values. */
function fundedPercent(funded: number, needed: number) {
  if (!Number.isFinite(funded) || !Number.isFinite(needed) || needed <= 0) return 0;
  const pct = Math.round((funded / needed) * 100);
  return Math.max(0, Math.min(100, pct));
}

function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/12 bg-white/[0.02] px-6 py-16 text-center">
      <svg viewBox="0 0 64 64" className="h-16 w-16 text-[#d6c3a1]/70" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="32" cy="32" r="26" strokeOpacity="0.35" />
        <path d="M22 40c0-6 4.5-10 10-10s10 4 10 10" strokeLinecap="round" />
        <circle cx="32" cy="24" r="6" />
        <path d="M14 50c3-4 7-6 11-7M50 50c-3-4-7-6-11-7" strokeLinecap="round" strokeOpacity="0.5" />
      </svg>
      <p className="mt-5 max-w-xl text-base font-medium text-white/80">{title}</p>
      {body ? <p className="mt-2 max-w-xl text-sm leading-7 text-white/50">{body}</p> : null}
    </div>
  );
}

export default async function HomePage() {
  const { projects, stories, metrics } = await getHomepageData();

  return (
    <main className="min-h-screen bg-[#060606] text-[#f3efe7]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#060606]/90 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a href="#home" className="flex items-center gap-3">
            <LogoMark className="h-12 w-12 sm:h-14 sm:w-14" />
            <span className="hidden sm:block leading-none">
              <span className="block text-sm font-semibold uppercase tracking-[0.32em] text-white">Black Tax</span>
              <span className="mt-1 block text-xs text-white/50">Small Contributions. <span className="text-[#d6c3a1]">Lasting Change.</span></span>
            </span>
          </a>
          <nav className="hidden flex-wrap items-center justify-end gap-5 lg:flex">
            {navigation.slice(0, 8).map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, "-")}`} className="text-sm text-white/60 transition hover:text-white">
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#d6c3a1]/40 hover:bg-white/[0.07] md:inline-flex">
              Member Login
            </Link>
            <a href="#donate" className="rounded-full border border-[#d6c3a1]/35 bg-[#f3efe7] px-5 py-3 text-sm font-semibold text-black shadow-[0_10px_40px_rgba(255,255,255,0.08)] transition hover:bg-white">
              Donate
            </a>
          </div>
        </div>
      </header>

      <section id="home" className="relative isolate overflow-hidden border-b border-white/6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.08),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(214,195,161,0.12),_transparent_26%),linear-gradient(180deg,_#050505_0%,_#0a0a0a_48%,_#050505_100%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <AnimatedSection className="relative z-10 flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#d6c3a1] shadow-sm backdrop-blur">
              <ShieldCheck className="h-4 w-4" /> Trusted, transparent, community-governed
            </span>
            <h1 className="mt-6 max-w-4xl text-[clamp(3rem,7vw,6.6rem)] font-semibold leading-[0.92] tracking-[-0.05em] text-white">
              Together We Can Carry the Weight.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70 sm:text-xl">
              No one should struggle alone. By contributing from just <strong className="text-white">R10 per month</strong>, South Africans can collectively fund education, healthcare, entrepreneurship, emergency relief, food security and community development.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="#donate" className="inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-6 py-3.5 text-sm font-semibold text-black shadow-[0_15px_50px_rgba(255,255,255,0.08)] transition hover:bg-white">
                Join Black Tax <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#about-us" className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/8">
                Learn More
              </a>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ["Members", `${metrics.members}`],
                ["Projects Funded", `${metrics.projects}`],
                ["Total Donations", formatCurrency(metrics.donationsReceived)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl">
                  <p className="text-2xl font-semibold text-white">{value}</p>
                  <p className="mt-1 text-sm text-white/55">{label}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.15} className="relative">
            <div className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-black p-3 shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
              <img
                src="https://images.pexels.com/photos/7849436/pexels-photo-7849436.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1200"
                alt="Black community volunteers smiling together"
                className="h-[560px] w-full rounded-[1.75rem] object-cover grayscale contrast-110 brightness-[0.78]"
              />
            </div>
            <div className="absolute -bottom-6 left-6 right-6 rounded-[1.8rem] border border-white/10 bg-black/80 p-5 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6c3a1]">Live impact</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(metrics.donationsReceived)}</p>
                  <p className="text-sm text-white/55">Awaiting our first genuine donations</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-right">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40">{metrics.provincesSupported} provinces</p>
                  <p className="mt-1 text-lg font-semibold text-white">funded so far</p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <AnimatedSection id="statistics" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2.2rem] border border-white/8 bg-[#0d0d0d] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:p-8">
          <div className="mb-6 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d6c3a1]">Our Impact — Starting Today</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
              Every figure begins at zero and will grow with real members and donations.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {impactStatistics.map(([label, value]) => (
              <div key={label} className="rounded-[1.6rem] border border-white/7 bg-white/[0.03] p-5">
                <p className="text-3xl font-semibold text-white">{value}</p>
                <p className="mt-2 text-sm leading-5 text-white/50">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="about-us" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-center">
          <div className="overflow-hidden rounded-[2.25rem] border border-white/10 shadow-[0_24px_90px_rgba(0,0,0,0.4)]">
            <img src="https://images.pexels.com/photos/35753806/pexels-photo-35753806.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1200" alt="Black grandmother embracing her grandchildren at home" className="h-full min-h-[440px] w-full object-cover grayscale contrast-110 brightness-[0.8]" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d6c3a1]">About Us</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white">Built on Ubuntu, accountability and collective dignity.</h2>
            <p className="mt-6 text-lg leading-8 text-white/68">
              Inspired by the proverb <em className="text-white">“It takes a village to raise a child,”</em> Black Tax transforms the pressure many individuals carry into a shared national act of care. Instead of private sacrifice happening silently, we create a public system of trust where many people contribute a little so entire communities can rise.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                ["Registered NPO ready", "Prominent legal, compliance and governance disclosures."],
                ["Community governed", "Transparent funding rules and member participation pathways."],
                ["Financially accountable", "Reports, audits, dashboards and province-level allocation views."],
                ["Secure by design", "Provider-based recurring payments, protected data and POPIA-first handling."],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-[1.7rem] border border-white/8 bg-white/[0.03] p-5 shadow-sm">
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/55">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-8 rounded-[2.25rem] border border-[#d6c3a1]/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)] lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
          <div className="overflow-hidden rounded-[1.9rem] border border-white/10">
            <img
              src="https://images.pexels.com/photos/34984576/pexels-photo-34984576.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1200"
              alt="Black hands joined together in solidarity and community support"
              className="h-full min-h-[420px] w-full object-cover grayscale contrast-125 brightness-[0.72]"
            />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#d6c3a1]">Governed by code and ethics</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white">No political affiliation. Only accountability.</h2>
            <p className="mt-6 text-lg leading-8 text-white/68">
              Black Tax is an independent, registered South African non-profit. We are governed by our governing code, public ethics policies, audited reporting and community oversight — not by any political party, movement, government office or public figure.
            </p>
            <div className="mt-8 rounded-[1.7rem] border border-white/10 bg-black/30 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 text-[#d6c3a1]" />
                <p className="text-sm leading-7 text-white/62">
                  We do not endorse any political leader, candidate or ideology. All decisions are guided by transparent governance, financial controls, public reports and verified community needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="how-it-works" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d6c3a1]">How It Works</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white">A disciplined monthly commitment, structured for trust.</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-4">
          {[
            ["Step 1", "Become a Member", "Register securely and choose a contribution from R10, R50, R100, R250, R500 or a custom amount.", <Users key="users" className="h-6 w-6" />],
            ["Step 2", "Choose Debit Date", "Select the 1st, 7th, 15th, 20th, 25th or month end to fit your monthly cash flow.", <CircleDollarSign key="money" className="h-6 w-6" />],
            ["Step 3", "Secure Debit Order", "Black Tax is architected to integrate with licensed South African payment providers for authenticated recurring contributions.", <ShieldCheck key="shield" className="h-6 w-6" />],
            ["Step 4", "Track Your Impact", "Members see receipts, contribution history, funded projects, votes, updates and transparency data in a secure portal.", <BadgeCheck key="badge" className="h-6 w-6" />],
          ].map(([step, title, copy, icon]) => (
            <div key={title as string} className="rounded-[2rem] border border-white/8 bg-[#0d0d0d] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-[#f3efe7]">{icon}</div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-[#d6c3a1]">{step}</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/58">{copy}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          {paymentProviders.map((item) => (
            <span key={item} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/68 shadow-sm">
              {item}
            </span>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection id="transparency" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d6c3a1]">Transparency Dashboard</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white">Every cent should be visible.</h2>
          <p className="mt-4 text-lg leading-8 text-white/68">This platform is designed to publish public financial reporting, audited statements, live allocation views and project-by-project spending insights.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-white/8 bg-[#0d0d0d] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <div className="grid gap-4 sm:grid-cols-2">
              {expenditureCategories.map((label) => (
                <div key={label} className="rounded-[1.6rem] border border-white/7 bg-white/[0.03] p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white/55">{label}</p>
                    <p className="text-lg font-semibold text-white">R0</p>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-[#d6c3a1]" style={{ width: "0%" }} />
                  </div>
                  <p className="mt-2 text-xs text-white/35">0% allocated</p>
                </div>
              ))}
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-white/80">Fund allocation</p>
                <div className="mt-3 flex h-64 items-center justify-center rounded-[1.6rem] border border-dashed border-white/12 bg-white/[0.02] px-6 text-center text-sm text-white/45">
                  No financial data available yet.
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-white/80">Province breakdown</p>
                <div className="mt-3 flex h-64 items-center justify-center rounded-[1.6rem] border border-dashed border-white/12 bg-white/[0.02] px-6 text-center text-sm text-white/45">
                  No financial data available yet.
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-[#d6c3a1]/15 bg-[linear-gradient(180deg,#111111_0%,#090909_100%)] p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
              <p className="text-sm uppercase tracking-[0.18em] text-[#d6c3a1]/85">Financial reports</p>
              <div className="mt-4 rounded-[1.6rem] border border-dashed border-white/12 bg-white/[0.02] p-5 text-sm leading-7 text-white/55">
                Our first financial report will be published after the organisation begins operations.
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/8 bg-[#0d0d0d] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d6c3a1]">Governance and audit</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-white/62">
                <li>Independent annual audits and public financial statements.</li>
                <li>Monthly downloadable reports and board-approved funding summaries.</li>
                <li>POPIA-compliant consent, secure data handling and role-based admin controls.</li>
                <li>Clear disclaimer: all funding decisions remain subject to governance policy and available funds.</li>
              </ul>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="projects" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d6c3a1]">Projects</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white">Funding visible programmes across South Africa.</h2>
          </div>
          <p className="text-sm text-white/52">Approved, funded projects will appear here with full transparency.</p>
        </div>
        {projects.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="No community projects have been funded yet."
              body="Once donations begin, approved projects will appear here."
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {projects.map((project) => (
              <article key={project.id} className="overflow-hidden rounded-[2rem] border border-white/8 bg-[#0d0d0d] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <img src={project.imageUrl} alt={project.title} className="h-52 w-full object-cover grayscale contrast-110 brightness-[0.78]" />
                <div className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-[#d6c3a1]">{project.category}</span>
                    <span className="text-xs text-white/45">{project.province}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-white">{project.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/56">{project.summary}</p>
                  <div className="mt-5 h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-[#d6c3a1]" style={{ width: `${fundedPercent(project.amountFunded, project.amountNeeded)}%` }} />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-medium text-white">{formatCurrency(project.amountFunded)} funded</span>
                    <span className="text-white/45">{project.beneficiaries.toLocaleString("en-ZA")} lives</span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/56">{project.impact}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </AnimatedSection>

      <AnimatedSection id="donations" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d6c3a1]">Donations</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white">A live, transparent view of giving.</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {donationSnapshot.map(([label, value]) => (
            <div key={label} className="rounded-[1.6rem] border border-white/7 bg-[#0d0d0d] p-5">
              <p className="text-3xl font-semibold text-white">{value}</p>
              <p className="mt-2 text-sm leading-5 text-white/50">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-white/8 bg-[#0d0d0d] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d6c3a1]">Recent Donations</p>
            <div className="mt-4 rounded-[1.6rem] border border-dashed border-white/12 bg-white/[0.02] p-6 text-center text-sm text-white/50">
              No donations have been received yet.
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/8 bg-[#0d0d0d] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d6c3a1]">Donor Leaderboard</p>
            <div className="mt-4 rounded-[1.6rem] border border-dashed border-white/12 bg-white/[0.02] p-6 text-center text-sm text-white/50">
              No donor data available.
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="donor-wall" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d6c3a1]">Donor Wall</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white">A living wall of support, tributes and motivation.</h2>
          <p className="mt-4 text-lg leading-8 text-white/68">
            Alongside every contribution, members can leave a personal message. Watch the community&apos;s words of encouragement appear here in real time.
          </p>
        </div>
        <DonorWall />
      </AnimatedSection>

      <AnimatedSection id="beneficiaries" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d6c3a1]">Beneficiaries</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white">Every approved beneficiary, documented with dignity.</h2>
        </div>
        <EmptyState title="No beneficiaries have been approved yet." />
      </AnimatedSection>

      <AnimatedSection id="success-stories" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d6c3a1]">Success Stories</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white">Real people. Measurable dignity restored.</h2>
        </div>
        {stories.length === 0 ? (
          <EmptyState title="Success stories will appear once Black Tax begins funding community initiatives." />
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {stories.map((story) => (
              <article key={story.id} className="overflow-hidden rounded-[2rem] border border-white/8 bg-[#0d0d0d] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <img src={story.imageUrl} alt={story.name} className="h-64 w-full object-cover grayscale contrast-110 brightness-[0.8]" />
                <div className="p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d6c3a1]">{story.metric}</p>
                  <h3 className="mt-3 text-xl font-semibold text-white">{story.name}</h3>
                  <p className="mt-1 text-sm text-white/42">{story.title} · {story.location}</p>
                  <p className="mt-4 text-base leading-8 text-white/72">“{story.quote}”</p>
                  <p className="mt-4 text-sm leading-7 text-white/56">{story.outcome}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </AnimatedSection>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-white/8 bg-[#0d0d0d] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d6c3a1]">Causes</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {causes.map(([title, items]) => (
                <div key={title} className="rounded-[1.6rem] border border-white/7 bg-white/[0.03] p-5">
                  <h3 className="font-semibold text-white">{title}</h3>
                  <ul className="mt-3 space-y-2 text-sm text-white/55">
                    {items.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-[#d6c3a1]/15 bg-[linear-gradient(180deg,#151515_0%,#090909_100%)] p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d6c3a1]">Corporate Partnerships</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">CSI, payroll giving and BBBEE-aligned impact.</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                "CSI partnerships",
                "Payroll giving",
                "Employee matching",
                "Corporate dashboards",
                "Volunteer mobilization",
                "Province-level impact reporting",
              ].map((item) => (
                <div key={item} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 text-sm text-white/72">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[1.6rem] border border-dashed border-white/15 bg-white/[0.02] p-5 text-center text-sm text-white/60">
              We are currently welcoming our founding partners.
            </div>
            <div className="mt-6 flex items-center gap-3 text-white/65">
              <Building2 className="h-5 w-5 text-[#d6c3a1]" />
              <p className="text-sm">Structured for scalable corporate sponsorship, audited reporting and future employer-integrated contribution journeys.</p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="get-help" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d6c3a1]">Request Assistance</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white">A dignified application process for people who need support.</h2>
            <p className="mt-5 text-lg leading-8 text-white/68">Applicants can submit requests for medical, education, housing, business, emergency relief, food and disability support. Upload workflows can later connect to Supabase Storage or Cloudinary.</p>
            <div className="mt-8 rounded-[2rem] border border-white/8 bg-[#0d0d0d] p-6 shadow-sm">
              <p className="font-semibold text-white">Typical documents</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/55">
                {["ID", "Proof of income", "Quotation", "Photos", "Medical letters", "Supporting documents"].map((item) => (
                  <span key={item} className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2">{item}</span>
                ))}
              </div>
            </div>
          </div>
          <AssistanceForm />
        </div>
      </AnimatedSection>

      <AnimatedSection id="volunteer" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] border border-white/8 bg-[#0d0d0d] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d6c3a1]">Volunteer Portal</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white">Professionals and community leaders can give more than money.</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {volunteerRoles.map((role) => (
                <span key={role} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/68">{role}</span>
              ))}
            </div>
            <div className="mt-8 rounded-[2rem] border border-[#d6c3a1]/15 bg-[linear-gradient(180deg,#171717_0%,#101010_100%)] p-6 text-white">
              <div className="flex items-center gap-3">
                <MapPinned className="h-5 w-5 text-[#d6c3a1]" />
                <p className="font-medium">Volunteer opportunities map</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-white/68">This foundation can expand into location-based volunteering, scheduling, community event coordination and province-level emergency response mobilization.</p>
            </div>
            <div className="mt-6 rounded-[1.6rem] border border-dashed border-white/12 bg-white/[0.02] p-5 text-center text-sm text-white/55">
              No volunteers have registered yet.
            </div>
          </div>
          <VolunteerForm />
        </div>
      </AnimatedSection>

      <AnimatedSection id="news" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d6c3a1]">News</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white">Community updates, launches and media-ready reporting.</h2>
        </div>
        <EmptyState title="No news has been published yet." />
      </AnimatedSection>

      <AnimatedSection id="faqs" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d6c3a1]">FAQs</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white">Questions answered with clarity.</h2>
        </div>
        <div className="grid gap-4">
          {faqItems.map(([question, answer]) => (
            <details key={question} className="group rounded-[1.75rem] border border-white/8 bg-[#0d0d0d] p-6 shadow-sm">
              <summary className="cursor-pointer list-none text-lg font-semibold text-white">{question}</summary>
              <p className="mt-4 max-w-4xl text-sm leading-7 text-white/58">{answer}</p>
            </details>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection id="donate" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d6c3a1]">Donate / Join</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white">Give securely, from just R10.</h2>
            <p className="mt-5 text-lg leading-8 text-white/68">
              Make a once-off or monthly donation with your card, processed securely by Yoco. Every Rand is tracked
              transparently and released to verified community needs through licensed banking channels.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                ["Secure card payments", "Bank-grade checkout by Yoco. We never store your card details."],
                ["Transparent by default", "Every donation is recorded and reflected in the public dashboard."],
                ["Responsible payouts", "Funds are released to service providers via FNB with full audit trails."],
                ["Donor wall", "Optionally add a message of support alongside your gift."],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-[1.6rem] border border-white/8 bg-[#0d0d0d] p-5 shadow-sm">
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-7 text-white/55">{copy}</p>
                </div>
              ))}
            </div>
          </div>
          <DonateForm />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d6c3a1]">Debit-order membership</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white">Prefer a managed monthly membership?</h2>
            <p className="mt-5 text-lg leading-8 text-white/68">
              Register your membership intent and choose a debit date. Recurring debit orders are processed only through
              licensed South African payment providers; your pledge is reviewed and activated by our team.
            </p>
          </div>
          <MembershipForm />
        </div>
      </AnimatedSection>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-[#d6c3a1]/15 bg-[linear-gradient(180deg,#141414_0%,#090909_100%)] p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d6c3a1]">Member Login & Admin Portal</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">Scalable architecture for secure member and admin operations.</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                "Supabase authentication",
                "Two-factor authentication",
                "Role-based access",
                "Payments and approvals",
                "Reports and analytics",
                "Audit logs",
                "Volunteer management",
                "Content management",
              ].map((item) => (
                <div key={item} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 text-sm text-white/75">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 text-sm text-white/65">
              Future features include AI-assisted project verification, WhatsApp chatbot support, QR code donations, mobile apps and digital annual reports.
            </div>
          </div>
          <div id="contact" className="space-y-6">
            <div className="rounded-[2rem] border border-white/8 bg-[#0d0d0d] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d6c3a1]">Contact</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm text-white/66">
                <div>
                  <p className="font-semibold text-white">WhatsApp</p>
                  <a className="mt-1 block hover:text-white" href="https://wa.me/27000000000">+27 00 000 0000</a>
                </div>
                <div>
                  <p className="font-semibold text-white">Telephone</p>
                  <a className="mt-1 block hover:text-white" href="tel:+27000000000">+27 00 000 0000</a>
                </div>
                <div>
                  <p className="font-semibold text-white">Email</p>
                  <a className="mt-1 block hover:text-white" href="mailto:hello@blacktax.org.za">hello@blacktax.org.za</a>
                </div>
                <div>
                  <p className="font-semibold text-white">Office</p>
                  <p className="mt-1">Johannesburg, South Africa</p>
                </div>
              </div>
              <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/8 saturate-0">
                <iframe
                  title="Black Tax office location"
                  src="https://www.google.com/maps?q=Johannesburg%20South%20Africa&output=embed"
                  className="h-64 w-full"
                  loading="lazy"
                />
              </div>
            </div>
            <ContactForm />
          </div>
        </div>
      </AnimatedSection>

      <SiteFooter />

      <BackToTop />
    </main>
  );
}