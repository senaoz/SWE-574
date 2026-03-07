import {
  Dialog,
  Button,
  Flex,
  Text,
} from "@radix-ui/themes";
import { useState } from "react";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Called when user confirms. Dialog closes after this (and after async resolves if applicable). */
  onConfirm: () => void | Promise<void>;
  /** Use "danger" for destructive actions (e.g. delete). */
  variant?: "default" | "danger";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "default",
}: ConfirmDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await Promise.resolve(onConfirm());
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="max-w-md" aria-describedby={undefined}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Description className="mb-4">
          {description}
        </Dialog.Description>
        <Flex gap="3" justify="end">
          <Button
            variant="soft"
            color="gray"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </Button>
          <Button
            color={variant === "danger" ? "red" : undefined}
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "..." : confirmLabel}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
