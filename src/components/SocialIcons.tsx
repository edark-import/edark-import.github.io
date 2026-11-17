import { BRAND } from "@/data/services";

export function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M22 12.07C22 6.5 17.52 2 12 2S2 6.5 2 12.07c0 5.02 3.66 9.18 8.44 9.93v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.9h-2.34V22c4.78-.75 8.43-4.91 8.43-9.93Z" />
    </svg>
  );
}

export function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function TikTokIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.3 0 .59.05.87.14V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1Z" />
    </svg>
  );
}

export function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12.04 2a10 10 0 0 0-8.62 15.05L2 22l5.1-1.34A10 10 0 1 0 12.04 2Zm5.84 14.13c-.24.68-1.42 1.3-1.97 1.38-.52.08-1.18.11-1.91-.12-.45-.14-1.02-.34-1.75-.66-3.07-1.33-5.07-4.44-5.22-4.65-.15-.2-1.24-1.65-1.24-3.15s.78-2.24 1.06-2.54c.28-.3.61-.38.81-.38h.59c.19 0 .45-.07.7.53.26.62.88 2.15.96 2.31.08.16.13.34.03.54-.1.2-.15.34-.3.52-.15.18-.32.4-.46.54-.15.15-.31.31-.13.61.18.3.8 1.32 1.72 2.14 1.18 1.05 2.18 1.38 2.48 1.53.3.15.48.13.66-.08.18-.2.76-.88.96-1.18.2-.3.4-.25.68-.15.28.1 1.77.83 2.08.99.3.15.5.23.58.36.07.13.07.76-.17 1.44Z" />
    </svg>
  );
}

export function SocialLinksRow({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const icon = size === "sm" ? "w-4 h-4" : "w-4.5 h-4.5";
  const links = [
    { href: BRAND.socials.facebook, label: "Facebook eDark", Icon: FacebookIcon, color: "hover:text-[#1877F2] hover:border-[#1877F2]/50" },
    { href: BRAND.socials.instagram, label: "Instagram eDark", Icon: InstagramIcon, color: "hover:text-[#E4405F] hover:border-[#E4405F]/50" },
    { href: BRAND.socials.tiktok, label: "TikTok eDark", Icon: TikTokIcon, color: "hover:text-[#007BFF] hover:border-[#007BFF]/50" },
    { href: `https://wa.me/${BRAND.whatsappDigits}`, label: "WhatsApp eDark", Icon: WhatsAppIcon, color: "hover:text-[#25D366] hover:border-[#25D366]/50" },
  ];

  return (
    <div className="flex items-center gap-2.5">
      {links.map(({ href, label, Icon, color }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className={`${box} liquid-glass rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all hover:-translate-y-0.5 ${color}`}
        >
          <Icon className={icon} />
        </a>
      ))}
    </div>
  );
}
