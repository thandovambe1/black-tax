import Link from "next/link";
import {
  HeartHandshake,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  UserPlus,
} from "lucide-react";
import { LogoMark } from "@/components/logo";
import { NewsletterForm } from "@/components/newsletter-form";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/social-icons";

const platformLinks = [
  ["How It Works", "/#how-it-works"],
  ["Projects", "/#projects"],
  ["Success Stories", "/#success-stories"],
  ["Donor Wall", "/#donor-wall"],
  ["Request Assistance", "/#get-help"],
  ["Volunteer", "/#volunteer"],
  ["Partner With Us", "/#news"],
  ["FAQs", "/#faqs"],
  ["Donate / Join", "/#donate"],
] as const;

const trustLinks = [
  ["Transparency Dashboard", "/#transparency"],
  ["Privacy Policy", "#"],
  ["Terms & Conditions", "#"],
  ["POPIA Compliance", "#"],
  ["PAIA Manual", "#"],
  ["NPO Registration", "#"],
  ["PBO Status", "#"],
  ["Governance & Directors", "#"],
  ["Admin Portal", "/admin"],
] as const;

const financialLinks = [
  ["Monthly Finance Reports", "/#transparency"],
  ["Audited Statements", "/#transparency"],
  ["Annual Reports", "/#transparency"],
  ["Tax Certificates", "#"],
  ["Auditors", "#"],
  ["Fund Allocation", "/#transparency"],
] as const;

const socialLinks = [
  ["Facebook", FacebookIcon, "https://facebook.com"],
  ["Instagram", InstagramIcon, "https://instagram.com"],
  ["X (Twitter)", XIcon, "https://x.com"],
  ["LinkedIn", LinkedInIcon, "https://linkedin.com"],
  ["YouTube", YouTubeIcon, "https://youtube.com"],
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-white/8 bg-[#050505]">
      {/* Member access + newsletter band */}
      <div className="border-b border-white/8">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <LogoMark className="h-16 w-16 shrink-0" />
            <div>
              <p className="text-lg font-semibold text-white">Member access</p>
              <p className="mt-1 max-w-md text-sm leading-6 text-white/50">
                Log in to view contributions, receipts, debit dates, funded projects and community votes.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white"
                >
                  <Lock className="h-4 w-4" /> Member Login
                </Link>
                <Link
                  href="/#donate"
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[#d6c3a1]/40 hover:bg-white/[0.07]"
                >
                  <UserPlus className="h-4 w-4" /> Become a Member
                </Link>
              </div>
            </div>
          </div>
          <div className="lg:justify-self-end lg:w-full lg:max-w-md">
            <p className="text-lg font-semibold text-white">Newsletter</p>
            <p className="mt-1 text-sm leading-6 text-white/50">
              Impact updates, financial reports and community news. No spam, unsubscribe anytime.
            </p>
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* Link columns */}
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8">
        <div className="sm:col-span-2 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#d6c3a1]">Black Tax</p>
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/56">
            A transparent, community-driven crowdfunding platform helping South Africans collectively uplift
            disadvantaged Black communities with small monthly contributions and public accountability.
          </p>
          <div className="mt-5 flex items-center gap-3 text-sm text-white/56">
            <HeartHandshake className="h-4 w-4 text-[#d6c3a1]" /> Ubuntu in action — strictly non-partisan
          </div>

          <div className="mt-6 space-y-3 text-sm text-white/60">
            <a href="tel:+27000000000" className="flex items-center gap-3 transition hover:text-white">
              <Phone className="h-4 w-4 text-[#d6c3a1]" /> +27 00 000 0000
            </a>
            <a href="https://wa.me/27000000000" className="flex items-center gap-3 transition hover:text-white">
              <MessageCircle className="h-4 w-4 text-[#d6c3a1]" /> WhatsApp us
            </a>
            <a href="mailto:hello@blacktax.org.za" className="flex items-center gap-3 transition hover:text-white">
              <Mail className="h-4 w-4 text-[#d6c3a1]" /> hello@blacktax.org.za
            </a>
            <p className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-[#d6c3a1]" /> Johannesburg, South Africa
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            {socialLinks.map(([label, Icon, href]) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-[#d6c3a1]/50 hover:bg-white/[0.08] hover:text-[#d6c3a1]"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <p className="font-semibold text-white">Platform</p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/52">
            {platformLinks.map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="transition hover:text-[#d6c3a1]">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-semibold text-white">Trust & Governance</p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/52">
            {trustLinks.map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="transition hover:text-[#d6c3a1]">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-semibold text-white">Financial Statements</p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/52">
            {financialLinks.map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="transition hover:text-[#d6c3a1]">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-xs leading-6 text-white/50">
            Recurring contributions are processed only through licensed South African payment providers. Funding
            decisions remain subject to governance policies and available funds.
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Black Tax NPO. All rights reserved. Strictly non-partisan — governed by our code of conduct and ethics.</p>
          <p>Small Contributions. <span className="text-[#d6c3a1]">Lasting Change.</span></p>
        </div>
      </div>
    </footer>
  );
}