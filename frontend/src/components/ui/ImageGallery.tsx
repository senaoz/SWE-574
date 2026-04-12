import { useState } from "react";
import { Dialog, Flex } from "@radix-ui/themes";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { getImageUrl } from "@/services/api";

interface ImageGalleryProps {
  urls: string[];
  alt?: string;
  /** "thumbnails" — small fixed-size squares (for ratings, comments, etc.)
   *  "grid"       — responsive full-width grid (for service detail pages) */
  layout?: "thumbnails" | "grid";
  className?: string;
}

export function ImageGallery({
  urls,
  alt = "Photo",
  layout = "thumbnails",
  className,
}: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!urls.length) return null;

  const resolvedUrls = urls.map((u) => getImageUrl(u) ?? u);

  const openAt = (i: number) => setLightboxIndex(i);
  const close = () => setLightboxIndex(null);
  const prev = () =>
    setLightboxIndex((i) => (i === null ? null : (i - 1 + urls.length) % urls.length));
  const next = () =>
    setLightboxIndex((i) => (i === null ? null : (i + 1) % urls.length));

  const thumbnails =
    layout === "thumbnails" ? (
      <Flex gap="2" wrap="wrap" className={className}>
        {resolvedUrls.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${alt} ${i + 1}`}
            className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => openAt(i)}
          />
        ))}
      </Flex>
    ) : (
      <div
        className={`grid gap-1 w-full ${
          urls.length === 1
            ? "grid-cols-1"
            : urls.length === 2
              ? "grid-cols-2"
              : "grid-cols-3"
        } ${className ?? ""}`}
      >
        {resolvedUrls.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${alt} ${i + 1}`}
            className={`w-full max-h-80 rounded-lg cursor-pointer hover:opacity-80 transition-opacity ${urls.length > 2 ? 'object-contain' : 'object-cover'}`}
            onClick={() => openAt(i)}
          />
        ))}
      </div>
    );

  return (
    <>
      {thumbnails}

      <Dialog.Root open={lightboxIndex !== null} onOpenChange={(open) => !open && close()}>
        <Dialog.Content
          maxWidth="90vw"
          className="p-2 flex flex-col items-center gap-3"
          aria-describedby={undefined}
        >
          {lightboxIndex !== null && (
            <>
              <img
                src={resolvedUrls[lightboxIndex]}
                alt={`${alt} ${lightboxIndex + 1}`}
                className="max-h-[80vh] max-w-full mx-auto rounded object-contain"
              />
              {urls.length > 1 && (
                <Flex gap="3" align="center" justify="center">
                  <button
                    onClick={prev}
                    aria-label="Previous photo"
                    className="p-1 rounded hover:bg-[var(--gray-4)] transition-colors"
                  >
                    <ChevronLeftIcon width={20} height={20} />
                  </button>
                  <span className="text-sm text-[var(--gray-11)]">
                    {lightboxIndex + 1} / {urls.length}
                  </span>
                  <button
                    onClick={next}
                    aria-label="Next photo"
                    className="p-1 rounded hover:bg-[var(--gray-4)] transition-colors"
                  >
                    <ChevronRightIcon width={20} height={20} />
                  </button>
                </Flex>
              )}
            </>
          )}
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
