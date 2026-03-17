import { useState } from "react";
import { Dialog, Button, Flex, Select, TextArea, Text } from "@radix-ui/themes";
import { useMutation } from "@tanstack/react-query";
import { reportsApi } from "@/services/api";
import type { ReportType, ReportReason } from "@/types";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportType: ReportType;
  reportedId: string;
  reportedName: string;
}

const REASON_LABELS: Record<ReportReason, string> = {
  inappropriate: "Inappropriate content",
  abusive: "Abusive behavior",
  harassment: "Harassment",
  spam: "Spam",
  other: "Other",
};

export function ReportDialog({
  open,
  onOpenChange,
  reportType,
  reportedId,
  reportedName,
}: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason>("inappropriate");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      reportsApi.createReport({ report_type: reportType, reported_id: reportedId, reason, description: description || undefined }),
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleClose = (val: boolean) => {
    if (!val) {
      setSubmitted(false);
      setReason("inappropriate");
      setDescription("");
      mutation.reset();
    }
    onOpenChange(val);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Content className="max-w-md" aria-describedby={undefined}>
        <Dialog.Title>
          Report {reportType === "user" ? "User" : "Service"}
        </Dialog.Title>

        {submitted ? (
          <Flex direction="column" gap="4">
            <Text>Your report has been submitted. Our moderators will review it shortly.</Text>
            <Flex justify="end">
              <Button onClick={() => handleClose(false)}>Close</Button>
            </Flex>
          </Flex>
        ) : (
          <Flex direction="column" gap="3">
            <Text size="2" color="gray">
              Reporting: <strong>{reportedName}</strong>
            </Text>

            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">Reason</Text>
              <Select.Root value={reason} onValueChange={(v) => setReason(v as ReportReason)}>
                <Select.Trigger />
                <Select.Content>
                  {(Object.entries(REASON_LABELS) as [ReportReason, string][]).map(([val, label]) => (
                    <Select.Item key={val} value={val}>{label}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Flex>

            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">Additional details (optional)</Text>
              <TextArea
                placeholder="Describe the issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </Flex>

            {mutation.isError && (
              <Text color="red" size="2">
                {(mutation.error as Error)?.message || "Failed to submit report."}
              </Text>
            )}

            <Flex gap="3" justify="end">
              <Button variant="soft" color="gray" onClick={() => handleClose(false)} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button color="red" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                {mutation.isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </Flex>
          </Flex>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
