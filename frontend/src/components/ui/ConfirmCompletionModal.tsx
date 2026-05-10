import { useRef, useState } from "react";
import {
  Dialog,
  Button,
  Flex,
  Text,
  TextArea,
  Checkbox,
} from "@radix-ui/themes";
import { AlertTriangle, ImageIcon, X } from "lucide-react";
import { Transaction } from "@/types";
import { uploadApi } from "@/services/api";
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
  "Reliable",
  "Trustworthy",
  "Helpful",
  "Kind",
  "Communicative",
  "Detail-Oriented",
  "Efficient",
  "Problem Solver",
];

const CONSUMER_TAGS = [
  "Clear Communicator",
  "Prepared",
  "Organized",
  "Respectful",
  "Flexible",
  "Patient",
  "Responsible",
  "Reliable",
  "Trustworthy",
  "Helpful",
  "Kind",
  "Collaborative",
  "Understanding",
  "Appreciative",
  "Easy to Work With",
];

function tagToValue(tag: string): string {
  return tag.toLowerCase().replace(/\s+/g, "_");
}

export function tagToLabel(tag: string): string {
  return tag.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface ConfirmCompletionRatingData {
  score: number;
  tags: string[];
  comment: string;
  image_urls?: string[];
}

interface ConfirmCompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction;
  currentUserId: string;
  onSubmit: (data: ConfirmCompletionRatingData) => Promise<void>;
}

const MAX_IMAGES = 3;
const MAX_FILE_SIZE_MB = 5;

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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isProvider = String(transaction.provider_id) === String(currentUserId);
  const otherUser = isProvider ? transaction.requester : transaction.provider;
  const otherUserLabel =
    otherUser?.full_name ||
    (otherUser?.username ? `@${otherUser.username}` : null) ||
    (isProvider ? "Requester" : "Provider");

  // Provider rates the consumer → consumer tags; requester rates the provider → provider tags
  const availableTags = isProvider ? CONSUMER_TAGS : PROVIDER_TAGS;

  const MAX_TAGS = 5;

  const toggleTag = (tag: string) => {
    const value = tagToValue(tag);
    setSelectedTags((prev) => {
      if (prev.includes(value)) return prev.filter((t) => t !== value);
      if (prev.length >= MAX_TAGS) return prev;
      return [...prev, value];
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setImageError(`File too large. Max ${MAX_FILE_SIZE_MB} MB per image.`);
      return;
    }
    setImageError(null);
    setImageFiles((prev) => [...prev, file]);
    setImagePreviews((prev) => [...prev, URL.createObjectURL(file)]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const canSubmit =
    confirmed && score > 0 && selectedTags.length > 0 && !isSubmitting;

  const resetState = () => {
    setConfirmed(false);
    setScore(0);
    setSelectedTags([]);
    setComment("");
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImageFiles([]);
    setImagePreviews([]);
    setImageError(null);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const imageUrls: string[] = [];
      for (const file of imageFiles) {
        const res = await uploadApi.uploadRatingImage(file);
        imageUrls.push(res.data.url);
      }
      await onSubmit({ score, tags: selectedTags, comment, image_urls: imageUrls.length > 0 ? imageUrls : undefined });
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

          <Flex
            gap="2"
            align="start"
            className="rounded p-2"
            style={{ backgroundColor: "var(--amber-3)" }}
          >
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
            <Flex align="baseline" justify="between" className="mb-2">
              <Text size="2" weight="bold">
                Feedback <span style={{ color: "var(--red-9)" }}>*</span>
              </Text>
              <Text size="1" color={selectedTags.length >= MAX_TAGS ? "red" : "gray"}>
                {selectedTags.length}/{MAX_TAGS} selected
              </Text>
            </Flex>
            <Flex wrap="wrap" gap="2">
              {availableTags.map((tag) => (
                <InterestChip
                  key={tag}
                  name={tag}
                  selected={selectedTags.includes(tagToValue(tag))}
                  onClick={() => toggleTag(tag)}
                  size="sm"
                  showIcon
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

          {/* Image upload */}
          <div>
            <Flex align="center" justify="between" className="mb-2">
              <Text size="2" color="gray">
                Photos (Optional, up to {MAX_IMAGES})
              </Text>
              <Text size="1" color="gray">
                {imageFiles.length}/{MAX_IMAGES}
              </Text>
            </Flex>

            {imagePreviews.length > 0 && (
              <Flex gap="2" wrap="wrap" className="mb-2">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative" style={{ width: 72, height: 72 }}>
                    <img
                      src={src}
                      alt={`Preview ${i + 1}`}
                      style={{
                        width: 72,
                        height: 72,
                        objectFit: "cover",
                        borderRadius: "var(--radius-2)",
                        border: "1px solid var(--gray-6)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        background: "var(--gray-12)",
                        color: "var(--gray-1)",
                        border: "none",
                        borderRadius: "50%",
                        width: 18,
                        height: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        padding: 0,
                      }}
                      aria-label="Remove image"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </Flex>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleFileChange}
            />

            <Button
              type="button"
              variant="soft"
              color="gray"
              size="1"
              disabled={imageFiles.length >= MAX_IMAGES}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon size={13} />
              Add Photo
            </Button>

            {imageError && (
              <Text size="1" color="red" className="block mt-1">
                {imageError}
              </Text>
            )}
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
