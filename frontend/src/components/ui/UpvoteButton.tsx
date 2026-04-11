import { useState, useEffect } from "react";
import { Text, Flex, Badge} from "@radix-ui/themes";
import { ChevronUpIcon } from "@radix-ui/react-icons";

interface UpvoteButtonProps {
  count: number;
  upvoted?: boolean;
  /** When provided, the button is interactive. When omitted, renders read-only. */
  onUpvote?: () => Promise<{ upvote_count: number; user_upvoted: boolean }>;
  disabled?: boolean;
  size?: "1" | "2";
  showLoginHint?: boolean;
}

export function UpvoteButton({
  count,
  upvoted = false,
  onUpvote,
  disabled = false,
  size = "1",
  showLoginHint = false,
}: UpvoteButtonProps) {
  const [localCount, setLocalCount] = useState(count);
  const [localUpvoted, setLocalUpvoted] = useState(upvoted);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocalCount(count);
    setLocalUpvoted(upvoted);
  }, [count, upvoted]);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpvote || disabled || loading) return;

    // Optimistic update
    const prevCount = localCount;
    const prevUpvoted = localUpvoted;
    setLocalUpvoted(!localUpvoted);
    setLocalCount(localUpvoted ? localCount - 1 : localCount + 1);
    setLoading(true);

    try {
      const result = await onUpvote();
      setLocalCount(result.upvote_count);
      setLocalUpvoted(result.user_upvoted);
    } catch {
      setLocalCount(prevCount);
      setLocalUpvoted(prevUpvoted);
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = !onUpvote || disabled;

  return (
    <Flex align="center" gap="1">
      <Badge
        size={size}
        variant={localUpvoted ? 'solid' : 'soft'}
        className={`font-bold ${isReadOnly || loading ? "cursor-not-allowed" : "cursor-pointer"}`}
        // localUpvoted ? "solid" : isReadOnly ? "soft" : "ghost"
        color={isReadOnly ? "gray" : "orange"}
        onClick={handleClick}
        style={isReadOnly ? { cursor: "default", pointerEvents: "none" } : undefined}
      >
        <ChevronUpIcon />
        {localCount}
      </Badge>
      {showLoginHint && (
        <Text size="1" color="gray">Sign in to upvote</Text>
      )}
    </Flex>
  );
}
