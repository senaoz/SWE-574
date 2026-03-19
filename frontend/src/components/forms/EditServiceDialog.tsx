import { Dialog } from "@radix-ui/themes";
import { Service } from "@/types";
import { OfferNeedForm } from "./OfferNeedForm";

interface EditServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
  onSuccess?: () => void;
}

export function EditServiceDialog({
  open,
  onOpenChange,
  service,
  onSuccess,
}: EditServiceDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content
        align="center"
        size="4"
        className="p-4 md:p-12 overflow-y-auto"
        aria-describedby={undefined}
        maxWidth={"80vw"}
        maxHeight={"80vh"}
      >
        <Dialog.Title>Edit Service</Dialog.Title>
        <OfferNeedForm
          serviceType={service.service_type as "offer" | "need"}
          initialService={service}
          onSuccess={() => {
            onOpenChange(false);
            if (onSuccess) onSuccess();
          }}
          onClose={() => {
            onOpenChange(false);
          }}
        />
      </Dialog.Content>
    </Dialog.Root>
  );
}

