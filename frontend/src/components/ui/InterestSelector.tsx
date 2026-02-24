import { useState, useEffect } from "react";
import {
  Dialog,
  Button,
  Text,
  Flex,
  Badge,
  TextField,
} from "@radix-ui/themes";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { usersApi } from "@/services/api";

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
      <Dialog.Content className="max-w-lg">
        <Dialog.Title>Select Your Interests</Dialog.Title>
        <Dialog.Description className="mb-4">
          Choose topics you're interested in. These help match you with relevant
          services and community members.
        </Dialog.Description>

        <div className="mb-4">
          <TextField.Root
            placeholder="Search interests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="2"
          >
            <TextField.Slot>
              <MagnifyingGlassIcon />
            </TextField.Slot>
          </TextField.Root>
        </div>

        {loading ? (
          <Text color="gray">Loading...</Text>
        ) : (
          <Flex gap="2" wrap="wrap" className="mb-4 max-h-64 overflow-y-auto p-1">
            {filtered.map((interest) => {
              const isSelected = selected.includes(interest);
              return (
                <Badge
                  key={interest}
                  size="2"
                  variant={isSelected ? "solid" : "outline"}
                  className="cursor-pointer select-none transition-all"
                  style={{
                    cursor: "pointer",
                  }}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                  {isSelected && " ✓"}
                </Badge>
              );
            })}
            {filtered.length === 0 && (
              <Text size="2" color="gray">
                No interests match your search
              </Text>
            )}
          </Flex>
        )}

        <Flex justify="between" align="center" mt="4">
          <Text size="2" color="gray">
            {selected.length} selected
          </Text>
          <Flex gap="3">
            <Button variant="soft" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => onSave(selected)}>Save Interests</Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
