import { useState, useEffect } from "react";
import {
  Dialog,
  Button,
  Text,
  Flex,
  TextField,
} from "@radix-ui/themes";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { usersApi } from "@/services/api";
import { InterestChip } from "./InterestChip";

interface InterestSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSelected: string[];
  onSave: (selected: string[]) => void;
}

export function InterestSelector({
  open,
  onOpenChange,
  initialSelected,
  onSave,
}: InterestSelectorProps) {
  const [available, setAvailable] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setSelected(initialSelected);
      setSearch("");
      fetchInterests();
    }
  }, [open, initialSelected]);

  const fetchInterests = async () => {
    try {
      const response = await usersApi.getAvailableInterests();
      setAvailable(response.data);
    } catch (error) {
      console.error("Error fetching interests:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const filtered = available.filter((interest) =>
    interest.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="max-w-2xl rounded-2xl p-6 shadow-xl">
        <div className="mb-2">
          <Dialog.Title className="text-xl font-semibold text-gray-12">
            Pick your interests
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-gray-11">
            Choose what you're into — we'll use this to match you with the right
            people and services.
          </Dialog.Description>
        </div>

        <div className="mb-4">
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
        </div>

        {loading ? (
          <Text color="gray" size="2">
            Loading...
          </Text>
        ) : (
          <div className="max-h-[280px] overflow-y-auto rounded-xl border border-gray-4 bg-gray-1 p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pr-1">
              {filtered.map((interest) => (
                <InterestChip
                  key={interest}
                  name={interest}
                  selected={selected.includes(interest)}
                  onClick={() => toggleInterest(interest)}
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

        <Flex
          justify="between"
          align="center"
          mt="4"
          className="border-t border-gray-4 pt-4"
        >
          <Text size="2" color="gray">
            {selected.length} selected
          </Text>
          <Flex gap="3">
            <Button
              variant="soft"
              color="gray"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              color="lime"
              onClick={() => onSave(selected)}
              className="rounded-full"
            >
              Save interests
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
