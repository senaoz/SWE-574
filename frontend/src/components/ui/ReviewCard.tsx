import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Flex, Text, Badge, Button, Dialog } from "@radix-ui/themes";
import { RatingStars } from "@/components/ui/RatingStars";
import { InterestChip } from "@/components/ui/InterestChip";
import { tagToLabel } from "@/components/ui/ConfirmCompletionModal";
import { getImageUrl } from "@/services/api";
import type { RatingDetailed } from "@/types";

interface ReviewCardProps {
  rating: RatingDetailed;
}

export function ReviewCard({ rating }: ReviewCardProps) {
  const navigate = useNavigate();
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const raterLabel = rating.rater
    ? rating.rater.full_name || `@${rating.rater.username}`
    : "Anonymous";

  const serviceTitle = rating.service?.title ?? null;
  const serviceId = rating.service?.id;
  const hours = rating.transaction?.timebank_hours;

  const dateLabel = new Date(rating.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  if (!serviceTitle) return null;

  return (
    <Card className="p-4">
      <Flex direction="column" gap="3">
        <Flex justify="between" align="center" gap="3" wrap="wrap">
          <Flex align="center" gap="2">
            <RatingStars value={rating.score} readonly size={16} />
            <Text size="1" color="gray">
              {dateLabel}
            </Text>
          </Flex>
          <Text size="1" color="gray">
            from {raterLabel}
          </Text>
        </Flex>

        <Flex gap="2" align="center" wrap="wrap">
          {serviceId ? (
            <Button
              className="font-bold"
              variant="ghost"
              size="2"
              onClick={() => navigate(`/service/${serviceId}`)}
            >
              {serviceTitle}
            </Button>
          ) : (
            <Text size="3" className="font-bold">
              {serviceTitle}
            </Text>
          )}
          {typeof hours === "number" && (
            <Badge color="gray" variant="soft" size="1">
              {hours} hour(s)
            </Badge>
          )}
        </Flex>

        {rating.tags && rating.tags.length > 0 && (
          <Flex wrap="wrap" gap="1">
            {rating.tags.map((tag) => (
              <InterestChip
                key={tag}
                name={tagToLabel(tag)}
                selected
                size="sm"
                showIcon={false}
              />
            ))}
          </Flex>
        )}

        {rating.comment && (
          <Text size="2" color="gray">
            "{rating.comment}"
          </Text>
        )}

        {rating.image_urls && rating.image_urls.length > 0 && (
          <Flex gap="2" wrap="wrap">
            {rating.image_urls.map((url, i) => (
              <img
                key={i}
                src={getImageUrl(url)}
                alt={`Review photo ${i + 1}`}
                className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setLightboxSrc(getImageUrl(url) ?? null)}
              />
            ))}
          </Flex>
        )}
      </Flex>

      <Dialog.Root
        open={lightboxSrc !== null}
        onOpenChange={(open) => !open && setLightboxSrc(null)}
      >
        <Dialog.Content maxWidth="90vw" className="p-2">
          {lightboxSrc && (
            <img
              src={lightboxSrc}
              alt="Review photo"
              className="max-h-[80vh] max-w-full mx-auto rounded"
            />
          )}
        </Dialog.Content>
      </Dialog.Root>
    </Card>
  );
}
