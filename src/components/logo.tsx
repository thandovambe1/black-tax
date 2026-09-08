import Image from "next/image";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-2xl border border-[#d6c3a1]/35 bg-[#f7f3ea] shadow-[0_12px_34px_rgba(0,0,0,0.5)] ring-1 ring-white/10",
        className,
      )}
    >
      <Image
        src="/images/black-tax-logo.png"
        alt="Black Tax emblem"
        width={1200}
        height={1600}
        loading="eager"
        unoptimized
        className="h-full w-full object-contain p-1.5"
      />
    </span>
  );
}
