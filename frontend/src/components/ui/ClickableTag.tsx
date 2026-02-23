import { Badge } from "@radix-ui/themes";
import { Link } from "react-router-dom";
import type { TagEntity } from "@/types";

/** URL param value: prefer entityId for stability, fallback to encoded label */
function tagToParam(tag: TagEntity | string): string {
  if (typeof tag === "string") return encodeURIComponent(tag);
  if (tag.entityId) return encodeURIComponent(tag.entityId);
  return encodeURIComponent(tag.label);
}

interface ClickableTagProps {
  tag: TagEntity | string;
  size?: "1" | "2" | "3";
  variant?: "solid" | "soft" | "outline";
  color?: "gray" | "green" | "blue" | "red" | "yellow" | "purple" | "orange";
  className?: string;
  /** Use when tag is inside another clickable area (e.g. search result row) to avoid double navigation */
  stopPropagation?: boolean;
}

export function ClickableTag({
  tag,
  size = "2",
  variant = "soft",
  color = "gray",
  className = "",
  stopPropagation = false,
}: ClickableTagProps) {
  const label = typeof tag === "string" ? tag : tag.label;
  const param = tagToParam(tag);
  const to = `/dashboard?tag=${param}`;

  return (
    <Link
      to={to}
      onClick={(e) => stopPropagation && e.stopPropagation()}
      className={`inline-block ${className}`}
      aria-label={`Show offers and needs with tag ${label}`}
    >
      <Badge variant={variant} size={size} color={color} className="cursor-pointer hover:opacity-80">
        {label}
      </Badge>
    </Link>
  );
}
