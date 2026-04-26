import type { SVGProps } from "react";

type Variant = "mono" | "brand";

type Props = SVGProps<SVGSVGElement> & {
  type: string;
  variant?: Variant;
  size?: number;
};

const BRAND: Record<string, string> = {
  "telegram-channel": "#229ED9",
  "telegram-chat": "#229ED9",
  "subreddit": "#FF4500",
  "discord-server": "#5865F2",
  "slack-community": "#611F69",
  "x-person": "currentColor",
  "directory": "currentColor",
  "email-list": "currentColor",
};

export function PlatformIcon({
  type,
  variant = "mono",
  size = 16,
  ...rest
}: Props) {
  const color = variant === "brand" ? (BRAND[type] ?? "currentColor") : "currentColor";
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: color,
    "aria-hidden": true as const,
    ...rest,
  };
  switch (type) {
    case "telegram-channel":
    case "telegram-chat":
      return (
        <svg {...common}>
          <path d="M14.7 2.2 1.6 7.3c-.9.3-.9 1.6 0 1.9l3 1 1.2 3.8c.2.6 1 .8 1.4.3l1.9-2 3.2 2.4c.5.4 1.2.1 1.4-.5l2.3-10.8c.2-.9-.7-1.6-1.5-1.2zM6.5 10 13 4.7l-5.4 5.5v2.1L6.5 10z" />
        </svg>
      );
    case "subreddit":
      return (
        <svg {...common}>
          <path d="M14 8c0-.9-.7-1.6-1.6-1.6-.4 0-.8.2-1.1.4C10.3 6 8.9 5.5 7.4 5.5l.7-3.2 2.2.5c0 .5.4.9.9.9s1-.4 1-1-.4-1-1-1c-.4 0-.7.2-.9.5L7.8 1.6c-.1 0-.2 0-.2.1l-.8 3.8C5.2 5.5 3.8 6 2.7 6.8c-.3-.3-.7-.5-1.1-.5C.7 6.3 0 7 0 8c0 .6.3 1.1.8 1.4v.4c0 2.3 2.8 4.2 6.2 4.2s6.2-1.9 6.2-4.2v-.4c.5-.3.8-.8.8-1.4zM4 9c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1-1-.4-1-1zm6 2.4c-.7.5-1.7.7-2.7.7-1 0-2-.2-2.7-.7-.2-.1-.2-.4 0-.5.1-.1.3-.1.4 0 .6.4 1.4.6 2.3.6s1.7-.2 2.3-.6c.1-.1.3-.1.4 0 .2.1.2.4 0 .5zM10 10c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z" />
        </svg>
      );
    case "discord-server":
      return (
        <svg {...common}>
          <path d="M13.5 3.2c-1-.5-2.1-.8-3.3-1-.2.3-.3.6-.5.9-1.2-.2-2.4-.2-3.6 0-.1-.3-.3-.6-.5-.9-1.2.2-2.3.5-3.3 1C.5 6.3 0 9.3.2 12.2c1.3.9 2.6 1.5 3.8 1.9.3-.4.6-.9.8-1.3-.4-.2-.9-.4-1.3-.6.1-.1.2-.2.3-.2 2.5 1.2 5.2 1.2 7.7 0 .1.1.2.1.3.2-.4.2-.8.4-1.3.6.2.5.5.9.8 1.3 1.3-.4 2.5-1 3.8-1.9.3-3.4-.5-6.4-2.6-9zM5.6 10.5c-.8 0-1.5-.7-1.5-1.7S4.8 7.2 5.6 7.2s1.5.7 1.5 1.7-.7 1.6-1.5 1.6zm4.8 0c-.8 0-1.5-.7-1.5-1.7s.6-1.6 1.5-1.6c.8 0 1.5.7 1.5 1.7s-.7 1.6-1.5 1.6z" />
        </svg>
      );
    case "slack-community":
      return (
        <svg {...common}>
          <path d="M4 9.5A1.5 1.5 0 1 1 2.5 8H4v1.5zM4.8 9.5A1.5 1.5 0 0 1 6.3 8a1.5 1.5 0 0 1 1.5 1.5v3.8A1.5 1.5 0 0 1 6.3 14a1.5 1.5 0 0 1-1.5-1.5V9.5zM6.3 3.5A1.5 1.5 0 1 1 7.8 2v1.5H6.3zM6.3 4.3a1.5 1.5 0 0 1 1.5 1.5 1.5 1.5 0 0 1-1.5 1.5H2.5A1.5 1.5 0 0 1 1 5.8a1.5 1.5 0 0 1 1.5-1.5h3.8zM12 5.8A1.5 1.5 0 1 1 13.5 7.3H12V5.8zM11.2 5.8a1.5 1.5 0 0 1-1.5 1.5 1.5 1.5 0 0 1-1.5-1.5V2a1.5 1.5 0 0 1 1.5-1.5 1.5 1.5 0 0 1 1.5 1.5v3.8zM9.7 12A1.5 1.5 0 1 1 8.2 13.5V12h1.5zM9.7 11.2a1.5 1.5 0 0 1-1.5-1.5 1.5 1.5 0 0 1 1.5-1.5h3.8a1.5 1.5 0 0 1 1.5 1.5 1.5 1.5 0 0 1-1.5 1.5H9.7z" />
        </svg>
      );
    case "x-person":
      return (
        <svg {...common}>
          <path d="M11.5 1.5h2.3L8.8 7.3l5.8 7.2h-4.5L6.5 9.7l-4.1 4.8H.1l5.4-6.2L0 1.5h4.6l3.2 4.3 3.7-4.3zm-.8 11.6h1.3L4.4 2.8H3l7.7 10.3z" />
        </svg>
      );
    case "directory":
      return (
        <svg {...common}>
          <path d="M1.5 3h4l1.5 1.5H14c.3 0 .5.2.5.5v7.5c0 .3-.2.5-.5.5H2c-.3 0-.5-.2-.5-.5V3.5c0-.3.2-.5.5-.5zM2 5.5V12h11V5.5H2z" />
        </svg>
      );
    case "email-list":
      return (
        <svg {...common}>
          <path d="M2 3.5h12c.3 0 .5.2.5.5v8c0 .3-.2.5-.5.5H2c-.3 0-.5-.2-.5-.5V4c0-.3.2-.5.5-.5zm.5 1.7v6.8h11V5.2L8 9 2.5 5.2zm.8-.2L8 8l4.7-3H3.3z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6" fill="none" stroke={color} strokeWidth="1.5" />
          <path d="M2 8h12M8 2c2 1.7 3 3.7 3 6s-1 4.3-3 6c-2-1.7-3-3.7-3-6s1-4.3 3-6z" fill="none" stroke={color} strokeWidth="1.2" />
        </svg>
      );
  }
}

export function platformLabel(type: string): string {
  const labels: Record<string, string> = {
    "telegram-channel": "Telegram channel",
    "telegram-chat": "Telegram chat",
    "subreddit": "Reddit",
    "discord-server": "Discord",
    "slack-community": "Slack",
    "x-person": "X (Twitter)",
    "directory": "Directory",
    "email-list": "Newsletter",
  };
  return labels[type] ?? type;
}

export function platformShortLabel(type: string): string {
  if (type.startsWith("telegram")) return "Telegram";
  if (type === "subreddit") return "Reddit";
  if (type === "discord-server") return "Discord";
  if (type === "slack-community") return "Slack";
  if (type === "x-person") return "X";
  if (type === "directory") return "Directories";
  if (type === "email-list") return "Newsletters";
  return type;
}
