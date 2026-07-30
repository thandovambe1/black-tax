"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const membershipSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(8),
  contributionAmount: z.coerce.number().min(10),
  debitDate: z.string().min(1),
  paymentMethod: z.string().min(1),
  consent: z.boolean().refine((value) => value),
});

const assistanceSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(8),
  province: z.string().min(2),
  category: z.string().min(2),
  description: z.string().min(20),
  monthlyIncome: z.coerce.number().min(0).optional(),
  documents: z.string().optional(),
});

const volunteerSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(8),
  profession: z.string().min(2),
  province: z.string().min(2),
  availability: z.string().min(2),
  message: z.string().min(10),
});

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(3),
  message: z.string().min(10),
});

function Input({
  label,
  error,
  as = "input",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label: string;
    error?: string;
    as?: "input" | "textarea";
  }) {
  const className =
    "mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#0f5c46] focus:ring-4 focus:ring-[#0f5c46]/10";

  return (
    <label className="block text-sm font-medium text-slate-800">
      {label}
      {as === "textarea" ? <textarea className={className} {...props} /> : <input className={className} {...props} />}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

function SubmitButton({ pending, children }: { pending: boolean; children: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-[#0f5c46] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b4636] disabled:opacity-60"
    >
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function MembershipForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<z.input<typeof membershipSchema>, unknown, z.output<typeof membershipSchema>>({
    resolver: zodResolver(membershipSchema),
    defaultValues: {
      contributionAmount: undefined,
      debitDate: "1st",
      paymentMethod: "PayFast",
      consent: false,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/memberships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = (await response.json()) as { message: string };
    setPending(false);
    setMessage(data.message);
    if (response.ok) form.reset({ contributionAmount: undefined, debitDate: "1st", paymentMethod: "PayFast", consent: false });
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,92,70,0.12)]">
      <Input label="Full name" error={form.formState.errors.fullName?.message} {...form.register("fullName")} />
      <Input label="Email" type="email" error={form.formState.errors.email?.message} {...form.register("email")} />
      <Input label="Phone" error={form.formState.errors.phone?.message} {...form.register("phone")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Monthly contribution (R)" type="number" min={10} placeholder="From R10" error={form.formState.errors.contributionAmount?.message} {...form.register("contributionAmount")} />
        <label className="block text-sm font-medium text-slate-800">
          Debit date
          <select className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm" {...form.register("debitDate")}>
            {['1st','7th','15th','20th','25th','Month End'].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium text-slate-800">
        Preferred payment provider
        <select className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm" {...form.register("paymentMethod")}>
          {['PayFast','Peach Payments','Ozow','Card Payments','EFT','Apple Pay','Google Pay'].map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label className="flex items-start gap-3 rounded-2xl bg-[#f7f2e8] p-4 text-sm text-slate-700">
        <input type="checkbox" className="mt-1" {...form.register("consent")} />
        <span>I consent to the collection of my personal information in line with POPIA and understand recurring contributions will be processed only through licensed providers.</span>
      </label>
      <SubmitButton pending={pending}>Join Black Tax</SubmitButton>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </form>
  );
}

export function AssistanceForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<z.input<typeof assistanceSchema>, unknown, z.output<typeof assistanceSchema>>({ resolver: zodResolver(assistanceSchema) });

  const onSubmit = form.handleSubmit(async (values) => {
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/assistance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = (await response.json()) as { message: string };
    setPending(false);
    setMessage(data.message);
    if (response.ok) form.reset();
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_20px_60px_rgba(15,92,70,0.08)]">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" error={form.formState.errors.fullName?.message} {...form.register("fullName")} />
        <Input label="Email" type="email" error={form.formState.errors.email?.message} {...form.register("email")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Phone" error={form.formState.errors.phone?.message} {...form.register("phone")} />
        <Input label="Province" error={form.formState.errors.province?.message} {...form.register("province")} />
      </div>
      <Input label="Support category" error={form.formState.errors.category?.message} {...form.register("category")} />
      <Input label="Monthly income (optional)" type="number" min={0} error={form.formState.errors.monthlyIncome?.message} {...form.register("monthlyIncome")} />
      <Input label="Document list or links" placeholder="ID, proof of income, quotations, medical letters, photos" error={form.formState.errors.documents?.message} {...form.register("documents")} />
      <Input as="textarea" rows={5} label="Describe your request" error={form.formState.errors.description?.message} {...form.register("description")} />
      <SubmitButton pending={pending}>Submit Assistance Request</SubmitButton>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </form>
  );
}

export function VolunteerForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<z.infer<typeof volunteerSchema>>({ resolver: zodResolver(volunteerSchema) });

  const onSubmit = form.handleSubmit(async (values) => {
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/volunteers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = (await response.json()) as { message: string };
    setPending(false);
    setMessage(data.message);
    if (response.ok) form.reset();
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_20px_60px_rgba(15,92,70,0.08)]">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" error={form.formState.errors.fullName?.message} {...form.register("fullName")} />
        <Input label="Email" type="email" error={form.formState.errors.email?.message} {...form.register("email")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Phone" error={form.formState.errors.phone?.message} {...form.register("phone")} />
        <Input label="Profession" error={form.formState.errors.profession?.message} {...form.register("profession")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Province" error={form.formState.errors.province?.message} {...form.register("province")} />
        <Input label="Availability" error={form.formState.errors.availability?.message} {...form.register("availability")} />
      </div>
      <Input as="textarea" rows={4} label="How would you like to help?" error={form.formState.errors.message?.message} {...form.register("message")} />
      <SubmitButton pending={pending}>Register as Volunteer</SubmitButton>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </form>
  );
}

export function ContactForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<z.infer<typeof contactSchema>>({ resolver: zodResolver(contactSchema) });

  const onSubmit = form.handleSubmit(async (values) => {
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = (await response.json()) as { message: string };
    setPending(false);
    setMessage(data.message);
    if (response.ok) form.reset();
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,92,70,0.12)]">
      <Input label="Your name" error={form.formState.errors.name?.message} {...form.register("name")} />
      <Input label="Email" type="email" error={form.formState.errors.email?.message} {...form.register("email")} />
      <Input label="Subject" error={form.formState.errors.subject?.message} {...form.register("subject")} />
      <Input as="textarea" rows={5} label="Message" error={form.formState.errors.message?.message} {...form.register("message")} />
      <SubmitButton pending={pending}>Send Message</SubmitButton>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </form>
  );
}