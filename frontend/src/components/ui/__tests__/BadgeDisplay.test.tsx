import { describe, expect, it } from "vitest";
import { BADGE_PRIORITY, ICON_MAP } from "../BadgeDisplay";
import backendBadgeServiceSource from "../../../../../backend/app/services/badge_service.py?raw";

interface BackendBadgeDefinition {
  key: string;
  icon: string;
}

function getBackendBadgeDefinitions(): BackendBadgeDefinition[] {
  const match = backendBadgeServiceSource.match(
    /BADGE_DEFINITIONS\s*=\s*(\[[\s\S]*?\n\])\n\n\nclass BadgeService/
  );
  if (!match) {
    throw new Error("Could not locate backend BADGE_DEFINITIONS");
  }

  return JSON.parse(match[1].replace(/,\s*([}\]])/g, "$1"));
}

describe("BadgeDisplay badge catalog mappings", () => {
  const backendBadgeDefinitions = getBackendBadgeDefinitions();

  it("has a priority entry for every backend badge key", () => {
    const backendKeys = backendBadgeDefinitions.map((badge) => badge.key);
    const missingKeys = backendKeys.filter((key) => !BADGE_PRIORITY.includes(key));

    expect(new Set(BADGE_PRIORITY).size).toBe(BADGE_PRIORITY.length);
    expect(missingKeys).toEqual([]);
  });

  it("has an icon component for every backend badge icon", () => {
    const backendIcons = new Set(
      backendBadgeDefinitions.map((badge) => badge.icon)
    );
    const missingIcons = [...backendIcons].filter((icon) => !(icon in ICON_MAP));

    expect(missingIcons).toEqual([]);
  });
});
