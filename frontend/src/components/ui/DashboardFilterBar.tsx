import { useMemo } from "react";
import { Button, Flex, Popover, Text, Separator } from "@radix-ui/themes";
import { ChevronDownIcon, Cross2Icon } from "@radix-ui/react-icons";
import { InterestChip } from "./InterestChip";
import { TagEntity } from "@/types";
import {
  DISTANCE_OPTIONS_KM,
  type ServiceTypeFilter,
} from "@/components/map/ServiceMap";
import { getCityOptions } from "@/constants/turkishCities";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardFilters {
  serviceType: ServiceTypeFilter;
  status: string;
  selectedTags: string[];
  remoteFilter: "all" | "remote" | "in_person";
  distance: number | "any";
  city: string;
  dateFilter:
    | "all"
    | "today"
    | "tomorrow"
    | "this_week"
    | "open_availability"
    | "recurring";
}

export const defaultDashboardFilters: DashboardFilters = {
  serviceType: "all",
  status: "active",
  selectedTags: [],
  remoteFilter: "all",
  distance: "any",
  city: "all",
  dateFilter: "all",
};

interface DashboardFilterBarProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  availableTags: TagEntity[];
  hasLocation: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
] as const;

const SERVICE_TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "offer", label: "Offers" },
  { value: "need", label: "Needs" },
] as const;

const REMOTE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "remote", label: "Remote" },
  { value: "in_person", label: "In-person" },
] as const;

const DATE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "this_week", label: "This week" },
  { value: "open_availability", label: "Open availability" },
  { value: "recurring", label: "Recurring" },
] as const;

function isDefault(filters: DashboardFilters): boolean {
  return (
    filters.serviceType === defaultDashboardFilters.serviceType &&
    filters.status === defaultDashboardFilters.status &&
    filters.selectedTags.length === 0 &&
    filters.remoteFilter === defaultDashboardFilters.remoteFilter &&
    filters.distance === defaultDashboardFilters.distance &&
    filters.city === defaultDashboardFilters.city &&
    filters.dateFilter === defaultDashboardFilters.dateFilter
  );
}

const CITY_OPTIONS = [
  { value: "all", label: "All Cities" },
  ...getCityOptions().map((c) => ({ value: c.value, label: c.label })),
] as const;

/** Label shown on the pill when a non-default value is selected */
function pillLabel(
  filterName: string,
  value: string,
  options: readonly { value: string; label: string }[],
): string {
  if (value === "all" || value === "any") return filterName;
  return options.find((o) => o.value === value)?.label ?? filterName;
}

// ---------------------------------------------------------------------------
// FilterPill — reusable pill + popover wrapper
// ---------------------------------------------------------------------------

function FilterPill({
  label,
  isActive,
  children,
}: {
  label: string;
  isActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger>
        <button
          className={`
            filter-pill inline-flex items-center gap-1.5 whitespace-nowrap
            rounded-full border px-4 py-2 text-sm font-medium
            transition-all duration-200 hover:shadow-sm
            ${
              isActive
                ? "border-current font-semibold filter-pill-active"
                : "border-[var(--gray-6)] text-[var(--gray-11)]"
            }
          `}
        >
          {isActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
          )}
          {label}
          <ChevronDownIcon className="w-3.5 h-3.5 opacity-60" />
        </button>
      </Popover.Trigger>
      <Popover.Content
        side="bottom"
        align="start"
        sideOffset={8}
        style={{ minWidth: 220 }}
      >
        {children}
      </Popover.Content>
    </Popover.Root>
  );
}

// ---------------------------------------------------------------------------
// Option button group used inside popovers
// ---------------------------------------------------------------------------

function OptionGroup({
  options,
  value,
  onChange,
}: {
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Flex gap="2" wrap="wrap" style={{ maxWidth: "325px" }}>
      {options.map((opt) => (
        <Button
          key={opt.value}
          size="2"
          variant={value === opt.value ? "solid" : "outline"}
          color="gray"
          onClick={() => onChange(opt.value)}
          style={{ cursor: "pointer" }}
        >
          {opt.label}
        </Button>
      ))}
    </Flex>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DashboardFilterBar({
  filters,
  onFiltersChange,
  availableTags,
  hasLocation,
}: DashboardFilterBarProps) {
  const activeTagCount = filters.selectedTags.length;

  const tagsLabel = useMemo(() => {
    if (activeTagCount === 0) return "Tags";
    if (activeTagCount === 1) {
      const tag = availableTags.find(
        (t) =>
          t.entityId === filters.selectedTags[0] ||
          t.label === filters.selectedTags[0],
      );
      return tag?.label ?? "1 tag";
    }
    return `${activeTagCount} tags`;
  }, [activeTagCount, availableTags, filters.selectedTags]);

  const update = (partial: Partial<DashboardFilters>) =>
    onFiltersChange({ ...filters, ...partial });

  return (
    <div className="filter-bar-scroll flex items-center gap-2 pt-2 overflow-x-auto col-span-2">
      {/* Service Type */}
      <FilterPill
        label={pillLabel("Type", filters.serviceType, SERVICE_TYPE_OPTIONS)}
        isActive={filters.serviceType !== "all"}
      >
        <Flex direction="column" gap="3" p="1">
          <Text size="2" weight="bold">
            Service type
          </Text>
          <OptionGroup
            options={SERVICE_TYPE_OPTIONS}
            value={filters.serviceType}
            onChange={(v) => update({ serviceType: v as ServiceTypeFilter })}
          />
          {filters.serviceType !== "all" && (
            <>
              <Separator size="4" />
              <Button
                size="1"
                variant="ghost"
                color="gray"
                onClick={() => update({ serviceType: "all" })}
              >
                Reset
              </Button>
            </>
          )}
        </Flex>
      </FilterPill>

      {/* City */}
      <FilterPill
        label={pillLabel("City", filters.city, CITY_OPTIONS)}
        isActive={filters.city !== "all"}
      >
        <Flex direction="column" gap="3" p="1" style={{ maxWidth: 280 }}>
          <Text size="2" weight="bold">
            City
          </Text>
          <Flex
            direction="column"
            gap="1"
            style={{ maxHeight: 280, overflowY: "auto" }}
          >
            {CITY_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                size="2"
                variant={filters.city === opt.value ? "solid" : "outline"}
                color="gray"
                onClick={() => update({ city: opt.value })}
                style={{ cursor: "pointer", justifyContent: "flex-start" }}
              >
                {opt.label}
              </Button>
            ))}
          </Flex>
          {filters.city !== "all" && (
            <>
              <Separator size="4" />
              <Button
                size="1"
                variant="ghost"
                color="gray"
                onClick={() => update({ city: "all" })}
              >
                Reset
              </Button>
            </>
          )}
        </Flex>
      </FilterPill>

      {/* Status */}
      <FilterPill
        label={pillLabel("Status", filters.status, STATUS_OPTIONS)}
        isActive={filters.status !== "active"}
      >
        <Flex direction="column" gap="3" p="1">
          <Text size="2" weight="bold">
            Status
          </Text>
          <OptionGroup
            options={STATUS_OPTIONS}
            value={filters.status}
            onChange={(v) => update({ status: v })}
          />
          {filters.status !== "active" && (
            <>
              <Separator size="4" />
              <Button
                size="1"
                variant="ghost"
                color="gray"
                onClick={() => update({ status: "active" })}
              >
                Reset
              </Button>
            </>
          )}
        </Flex>
      </FilterPill>

      {/* Tags */}
      {availableTags.length > 0 && (
        <FilterPill label={tagsLabel} isActive={activeTagCount > 0}>
          <Flex direction="column" gap="3" p="1" style={{ maxWidth: 320 }}>
            <Text size="2" weight="bold">
              Tags
            </Text>
            <Flex
              gap="2"
              wrap="wrap"
              style={{ maxHeight: 240, overflowY: "auto" }}
            >
              {availableTags.map((tag) => {
                const id = tag.entityId || tag.label;
                const selected = filters.selectedTags.includes(id);
                return (
                  <InterestChip
                    key={id}
                    name={tag.label}
                    size="sm"
                    selected={selected}
                    onClick={() => {
                      const next = selected
                        ? filters.selectedTags.filter((t) => t !== id)
                        : [...filters.selectedTags, id];
                      update({ selectedTags: next });
                    }}
                  />
                );
              })}
            </Flex>
            {activeTagCount > 0 && (
              <>
                <Separator size="4" />
                <Button
                  size="1"
                  variant="ghost"
                  color="gray"
                  onClick={() => update({ selectedTags: [] })}
                >
                  Reset
                </Button>
              </>
            )}
          </Flex>
        </FilterPill>
      )}

      {/* Remote / In-person */}
      <FilterPill
        label={pillLabel("Location type", filters.remoteFilter, REMOTE_OPTIONS)}
        isActive={filters.remoteFilter !== "all"}
      >
        <Flex direction="column" gap="3" p="1">
          <Text size="2" weight="bold">
            Location type
          </Text>
          <OptionGroup
            options={REMOTE_OPTIONS}
            value={filters.remoteFilter}
            onChange={(v) =>
              update({ remoteFilter: v as DashboardFilters["remoteFilter"] })
            }
          />
          {filters.remoteFilter !== "all" && (
            <>
              <Separator size="4" />
              <Button
                size="1"
                variant="ghost"
                color="gray"
                onClick={() => update({ remoteFilter: "all" })}
              >
                Reset
              </Button>
            </>
          )}
        </Flex>
      </FilterPill>

      {/* Distance */}
      <FilterPill
        label={
          filters.distance === "any"
            ? "Distance"
            : `Within ${filters.distance} km`
        }
        isActive={filters.distance !== "any"}
      >
        <Flex direction="column" gap="3" p="1">
          <Text size="2" weight="bold">
            Distance
          </Text>
          {!hasLocation && (
            <Text size="1" color="gray">
              Enable location to use distance filter
            </Text>
          )}
          <Flex direction="column" gap="1">
            <Button
              size="2"
              variant={filters.distance === "any" ? "solid" : "outline"}
              color="gray"
              onClick={() => update({ distance: "any" })}
              style={{ cursor: "pointer", justifyContent: "flex-start" }}
            >
              Any distance
            </Button>
            {hasLocation &&
              DISTANCE_OPTIONS_KM.map((km) => (
                <Button
                  key={km}
                  size="2"
                  variant={filters.distance === km ? "solid" : "outline"}
                  color="gray"
                  onClick={() => update({ distance: km })}
                  style={{ cursor: "pointer", justifyContent: "flex-start" }}
                >
                  Within {km} km
                </Button>
              ))}
          </Flex>
          {filters.distance !== "any" && (
            <>
              <Separator size="4" />
              <Button
                size="1"
                variant="ghost"
                color="gray"
                onClick={() => update({ distance: "any" })}
              >
                Reset
              </Button>
            </>
          )}
        </Flex>
      </FilterPill>

      {/* Availability */}
      <FilterPill
        label={pillLabel("Availability", filters.dateFilter, DATE_OPTIONS)}
        isActive={filters.dateFilter !== "all"}
      >
        <Flex direction="column" gap="3" p="1">
          <Text size="2" weight="bold">
            Availability
          </Text>
          <OptionGroup
            options={DATE_OPTIONS}
            value={filters.dateFilter}
            onChange={(v) =>
              update({ dateFilter: v as DashboardFilters["dateFilter"] })
            }
          />
          {filters.dateFilter !== "all" && (
            <>
              <Separator size="4" />
              <Button
                size="1"
                variant="ghost"
                color="gray"
                onClick={() => update({ dateFilter: "all" })}
              >
                Reset
              </Button>
            </>
          )}
        </Flex>
      </FilterPill>

      {/* Clear all */}
      {!isDefault(filters) && (
        <button
          className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-[var(--gray-11)] hover:text-[var(--gray-12)] transition-colors"
          onClick={() => onFiltersChange(defaultDashboardFilters)}
        >
          <Cross2Icon className="w-3.5 h-3.5" />
          Clear all
        </button>
      )}
    </div>
  );
}
