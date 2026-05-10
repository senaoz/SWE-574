import { useState, useEffect } from "react";
import { Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { usersApi } from "@/services/api";
import { InterestChip } from "@/components/ui/InterestChip";

interface InterestsStepProps {
  selected: string[];
  onUpdate: (interests: string[]) => void;
}

export function InterestsStep({ selected, onUpdate }: InterestsStepProps) {
  const [available, setAvailable] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi
      .getAvailableInterests()
      .then((res) => setAvailable(res.data))
      .catch((err) => console.error("Error fetching interests:", err))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (interest: string) => {
    onUpdate(
      selected.includes(interest)
        ? selected.filter((i) => i !== interest)
        : [...selected, interest],
    );
  };

  const filtered = available.filter((i) =>
    i.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Flex direction="column" gap="4" className="py-2">
      <Flex direction="column" gap="1" align="center">
        <Heading size="5" weight="bold" align="center">
          What are you into?
        </Heading>
        <Text size="2" color="gray" align="center">
          Pick topics you're interested in — we'll use these to match you with
          the right people and services.
        </Text>
      </Flex>

      <TextField.Root
        placeholder="Search interests..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="2"
        className="rounded-xl"
      >
        <TextField.Slot>
          <MagnifyingGlassIcon className="text-gray-10" />
        </TextField.Slot>
      </TextField.Root>

      {loading ? (
        <Text color="gray" size="2" align="center">
          Loading...
        </Text>
      ) : (
        <div className="h-[240px] overflow-y-auto rounded-xl border border-gray-4 bg-gray-1 p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pr-1">
            {filtered.map((interest) => (
              <InterestChip
                key={interest}
                name={interest}
                selected={selected.includes(interest)}
                onClick={() => toggle(interest)}
                size="md"
                showIcon
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <Flex align="center" justify="center" className="py-8">
              <Text size="2" color="gray">
                No interests match your search
              </Text>
            </Flex>
          )}
        </div>
      )}

      <Text size="1" color="gray" align="center">
        {selected.length} selected
      </Text>
    </Flex>
  );
}
