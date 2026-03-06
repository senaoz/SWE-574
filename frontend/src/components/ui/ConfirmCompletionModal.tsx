import { useState } from "react";
import {
  Dialog,
  Button,
  Flex,
  Text,
  TextArea,
  Checkbox,
} from "@radix-ui/themes";
import { AlertTriangle } from "lucide-react";
import { Transaction } from "@/types";
import { RatingStars } from "./RatingStars";
import { InterestChip } from "./InterestChip";

const PROVIDER_TAGS = [
  "Punctual",
  "Professional",
  "Friendly",
  "Thorough",
  "Hardworking",
  "Knowledgeable",
  "Flexible",
  "Patient",
  "Respectful",
  "Creative",
];

const CONSUMER_TAGS = [
  "Clear Communicator",
  "Prepared",
  "Organized",
  "Respectful",
  "Flexible",
];

function tagToValue(tag: string): string {
  return tag.toLowerCase().replace(/\s+/g, "_");
}

export function tagToLabel(tag: string): string {
  return tag
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface ConfirmCompletionRatingData {
  score: number;
  tags: string[];
  comment: string;
}

interface ConfirmCompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction;
  currentUserId: string;
  onSubmit: (data: ConfirmCompletionRatingData) => Promise<void>;
}

export function ConfirmCompletionModal({
  open,
  onOpenChange,
  transaction,
  currentUserId,
  onSubmit,
}: ConfirmCompletionModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isProvider = String(transaction.provider_id) === String(currentUserId);
  const otherUser = isProvider ? transaction.requester : transaction.provider;
  const otherUserLabel =
    otherUser?.full_name ||
    (otherUser?.username ? `@${otherUser.username}` : null) ||
    (isProvider ? "Requester" : "Provider");

  // Provider rates the consumer → consumer tags; requester rates the provider → provider tags
  const availableTags = isProvider ? CONSUMER_TAGS : PROVIDER_TAGS;

  const toggleTag = (tag: string) => {
    const value = tagToValue(tag);
    setSelectedTags((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    );
  };

  const canSubmit =
    confirmed && score > 0 && selectedTags.length > 0 && !isSubmitting;

  const resetState = () => {
    setConfirmed(false);
    setScore(0);
    setSelectedTags([]);
    setComment("");
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ score, tags: selectedTags, comment });
      resetState();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetState();
    onOpenChange(nextOpen);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content className="max-w-lg" aria-describedby={undefined}>
        <Dialog.Title>Confirm Service Completion</Dialog.Title>

        {/* Service summary */}
        <Flex direction="column" gap="1" className="mb-4">
          <Flex gap="2" align="baseline">
            <Text size="2" color="gray" style={{ minWidth: 72 }}>
              Service
            </Text>
            <Text size="2" weight="medium">
              {transaction.service?.title || "Service"}
            </Text>
          </Flex>
          <Flex gap="2" align="baseline">
            <Text size="2" color="gray" style={{ minWidth: 72 }}>
              With
            </Text>
            <Text size="2" weight="medium">
              {otherUserLabel}
            </Text>
          </Flex>
          <Flex gap="2" align="baseline">
            <Text size="2" color="gray" style={{ minWidth: 72 }}>
              Credits
            </Text>
            <Text size="2" weight="medium">
              {transaction.timebank_hours} hour(s)
            </Text>
          </Flex>
        </Flex>

        <hr className="border-[var(--gray-6)] mb-4" />

        {/* Confirmation checkbox */}
        <Flex direction="column" gap="2" className="mb-4">
          <label className="flex items-start gap-2 cursor-pointer">
            <Checkbox
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
              className="mt-0.5"
            />
            <Text size="2">
              I confirm that the service was completed as agreed.
            </Text>
          </label>

          <Flex gap="2" align="start" className="rounded p-2" style={{ backgroundColor: "var(--amber-3)" }}>
            <AlertTriangle
              size={16}
              className="shrink-0 mt-0.5"
              style={{ color: "var(--amber-9)" }}
            />
            <Text size="1" style={{ color: "var(--amber-11)" }}>
              Once confirmed, the time credits will be transferred and this
              action cannot be undone.
            </Text>
          </Flex>
        </Flex>

        <hr className="border-[var(--gray-6)] mb-4" />

        {/* Rating section */}
        <Flex direction="column" gap="3">
          <div>
            <Text size="2" weight="bold" className="block mb-2">
              Rate this exchange{" "}
              <span style={{ color: "var(--red-9)" }}>*</span>
            </Text>
            <RatingStars value={score} onChange={setScore} />
          </div>

          <div>
            <Text size="2" weight="bold" className="block mb-2">
              Feedback{" "}
              <span style={{ color: "var(--red-9)" }}>*</span>
            </Text>
            <Flex wrap="wrap" gap="2">
              {availableTags.map((tag) => (
                <InterestChip
                  key={tag}
                  name={tag}
                  selected={selectedTags.includes(tagToValue(tag))}
                  onClick={() => toggleTag(tag)}
                  size="sm"
                  showIcon={false}
                />
              ))}
            </Flex>
          </div>

          <div>
            <Text size="2" color="gray" className="block mb-1">
              Additional Comments (Optional)
            </Text>
            <TextArea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was your experience?"
              size="2"
              rows={3}
            />
          </div>
        </Flex>

        {/* Actions */}
        <Flex gap="3" justify="end" className="mt-5">
          <Button
            variant="soft"
            color="gray"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button color="green" onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? "Confirming..." : "Confirm & Rate"}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
