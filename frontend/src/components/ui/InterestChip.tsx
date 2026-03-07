import type { LucideIcon } from "lucide-react";
import {
  Cpu,
  Palette,
  Languages,
  Sparkles,
  Music,
  Dumbbell,
  Rocket,
  GraduationCap,
  Gamepad2,
  ChefHat,
  Camera,
  Plane,
  FlaskConical,
  HeartPulse,
  Paintbrush,
  PenLine,
  Banknote,
  Leaf,
  Trophy,
  HeartHandshake,
} from "lucide-react";
import { Flex, Text } from "@radix-ui/themes";

const INTEREST_ICONS: Record<string, LucideIcon> = {
  Technology: Cpu,
  Design: Palette,
  "Language Exchange": Languages,
  AI: Sparkles,
  Music: Music,
  Fitness: Dumbbell,
  Startups: Rocket,
  Education: GraduationCap,
  Gaming: Gamepad2,
  Cooking: ChefHat,
  Photography: Camera,
  Travel: Plane,
  Science: FlaskConical,
  Health: HeartPulse,
  Art: Paintbrush,
  Writing: PenLine,
  Finance: Banknote,
  Environment: Leaf,
  Sports: Trophy,
  Volunteering: HeartHandshake,
};

/** Radix theme color for each interest */
const INTEREST_COLORS: Record<string, string> = {
  Technology: "blue",
  Design: "pink",
  "Language Exchange": "violet",
  AI: "purple",
  Music: "crimson",
  Fitness: "green",
  Startups: "orange",
  Education: "indigo",
  Gaming: "cyan",
  Cooking: "amber",
  Photography: "teal",
  Travel: "blue",
  Science: "purple",
  Health: "green",
  Art: "pink",
  Writing: "amber",
  Finance: "lime",
  Environment: "teal",
  Sports: "red",
  Volunteering: "crimson",
};

const FALLBACK_COLORS = ["blue", "green", "purple", "amber", "teal", "pink", "indigo", "crimson"];

function getInterestColor(interest: string): string {
  return INTEREST_COLORS[interest] ?? FALLBACK_COLORS[interest.length % FALLBACK_COLORS.length];
}

export function getInterestIcon(interest: string): LucideIcon | null {
  return INTEREST_ICONS[interest] ?? null;
}

interface InterestChipProps {
  name: string;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export function InterestChip({
  name,
  selected = false,
  onClick,
  size = "md",
  showIcon = true,
}: InterestChipProps) {
  const Icon = getInterestIcon(name);
  const isClickable = typeof onClick === "function";
  const color = getInterestColor(name);

  const unselectedStyle = {
    borderColor: `var(--${color}-6)`,
    backgroundColor: `var(--${color}-2)`,
    color: `var(--${color}-11)`,
  };
  const selectedStyle = {
    borderColor: `var(--${color}-8)`,
    backgroundColor: `var(--${color}-4)`,
    color: `var(--${color}-11)`,
    boxShadow: `0 2px 6px var(--${color}-6)`,
  };

  const chip = (
    <Flex
      align="center"
      gap="2"
      className={`
        rounded-full border-2 transition-all duration-200
        ${size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-sm"}
        ${isClickable ? "cursor-pointer select-none hover:scale-[1.02] hover:opacity-90" : ""}
      `}
      style={selected ? selectedStyle : unselectedStyle}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
    >
      {showIcon && Icon && (
        <Icon
          size={size === "sm" ? 14 : 18}
          className="shrink-0 opacity-90"
          strokeWidth={2}
        />
      )}
      <Text size={size === "sm" ? "1" : "2"} weight="medium">
        {name}
      </Text>
      {selected && isClickable && (
        <span style={{ marginLeft: 2, opacity: 0.9 }} aria-hidden>
          ✓
        </span>
      )}
    </Flex>
  );

  return chip;
}
