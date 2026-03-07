import { useState } from "react";
import { Star } from "lucide-react";
import { Button, Text, TextArea, Flex } from "@radix-ui/themes";

interface RatingStarsProps {
  value?: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: number;
}

export function RatingStars({
  value = 0,
  onChange,
  readonly = false,
  size = 20,
}: RatingStarsProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <Flex gap="1" align="center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={`transition-colors ${readonly ? "" : "cursor-pointer"}`}
          fill={(hovered || value) >= star ? "var(--amber-9)" : "none"}
          stroke={(hovered || value) >= star ? "var(--amber-9)" : "var(--gray-7)"}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => !readonly && onChange?.(star)}
        />
      ))}
    </Flex>
  );
}

interface RatingFormProps {
  onSubmit: (score: number, comment: string) => Promise<void>;
  loading?: boolean;
}

export function RatingForm({ onSubmit, loading }: RatingFormProps) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = async () => {
    if (score === 0) return;
    await onSubmit(score, comment);
  };

  return (
    <div className="space-y-3">
      <div>
        <Text size="2" weight="bold" className="block mb-1">
          Rate this exchange
        </Text>
        <RatingStars value={score} onChange={setScore} />
      </div>
      <div>
        <Text size="1" color="gray" className="block mb-1">
          Leave a comment (optional)
        </Text>
        <TextArea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="How was your experience?"
          size="2"
          rows={2}
        />
      </div>
      <Flex justify="end">
        <Button
          size="1"
          onClick={handleSubmit}
          disabled={score === 0 || loading}
        >
          {loading ? "Submitting..." : "Submit Rating"}
        </Button>
      </Flex>
    </div>
  );
}
