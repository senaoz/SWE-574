import { Card, Text } from "@radix-ui/themes";
import { CheckCircledIcon, CrossCircledIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons";

type ServiceStatus = "active" | "in_progress" | "completed" | "cancelled" | "expired";

interface ServiceStatusBarProps {
  status: ServiceStatus;
}

interface Step {
  key: string;
  label: string;
}

const STEPS: Step[] = [
  { key: "active", label: "Active" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

function StepIcon({
  stepIndex,
  status,
  currentStepIndex,
}: {
  stepIndex: number;
  status: ServiceStatus;
  currentStepIndex: number;
}) {
  const isCompleted =
    (stepIndex < currentStepIndex || (status === "completed" && stepIndex === currentStepIndex)) &&
    status !== "cancelled" &&
    status !== "expired";

  // Special icons for cancelled/expired at the current (interrupted) step
  if (stepIndex === currentStepIndex && status !== "completed") {
    if (status === "cancelled") {
      return (
        <div className="w-8 h-8 rounded-full border-2 border-red-500  flex items-center justify-center">
          <CrossCircledIcon className="w-5 h-5 text-red-500" />
        </div>
      );
    }
    if (status === "expired") {
      return (
        <div className="w-8 h-8 rounded-full border-2 border-orange-400  flex items-center justify-center">
          <ExclamationTriangleIcon className="w-5 h-5 text-orange-400" />
        </div>
      );
    }
    // Normal active step
    return (
      <div className="w-8 h-8 rounded-full border-2 border-lime-500  flex items-center justify-center">
        <span className="text-sm font-bold text-lime-500">{stepIndex + 1}</span>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="w-8 h-8 rounded-full bg-lime-600 flex items-center justify-center">
        <CheckCircledIcon className="w-5 h-5 text-white" />
      </div>
    );
  }

  // Future / not-yet-reached step
  return (
    <div className="w-8 h-8 rounded-full border-2 opacity-70 flex items-center justify-center">
      <span className="text-sm font-bold ">{stepIndex + 1}</span>
    </div>
  );
}

function getStepIndexForStatus(status: ServiceStatus): number {
  switch (status) {
    case "active":
      return 0;
    case "in_progress":
      return 1;
    case "completed":
      return 2;
    case "cancelled":
      return 1;
    case "expired":
      return 1;
    default:
      return 0;
  }
}

function getLabelForStep(stepIndex: number, status: ServiceStatus): string {
  if (stepIndex === 1 && status === "cancelled") return "Cancelled";
  if (stepIndex === 1 && status === "expired") return "Expired";
  return STEPS[stepIndex].label;
}

function getLabelColor(stepIndex: number, status: ServiceStatus, currentStepIndex: number): string {
  if (stepIndex === currentStepIndex) {
    if (status === "cancelled") return "text-red-500";
    if (status === "expired") return "text-orange-400";
    return "text-[var(--accent-a11)] font-semibold";
  }
  if (stepIndex < currentStepIndex && status !== "cancelled" && status !== "expired") {
    return "text-[var(--accent-a11)] font-semibold";
  }
  return "text-[var(--gray-a11)]";
}

function ConnectorLine({
  fromIndex,
  currentStepIndex,
  status,
}: {
  fromIndex: number;
  currentStepIndex: number;
  status: ServiceStatus;
}) {
  if (fromIndex < currentStepIndex) {
    if (status === "cancelled") {
      return <div className="flex-1 h-0.5 mt-4 mx-1 bg-red-400" />;
    }
    if (status === "expired") {
      return <div className="flex-1 h-0.5 mt-4 mx-1 bg-orange-400" />;
    }
    return <div className="flex-1 h-0.5 mt-4 mx-1 bg-lime-500" />;
  }
  return <div className="flex-1 h-0.5 mt-4 mx-1 bg-[var(--accent-a8)]" />;
}

export function ServiceStatusBar({ status }: ServiceStatusBarProps) {
  const currentStepIndex = getStepIndexForStatus(status);

  return (
    <Card className="p-6">
      <Text size="1" weight="bold" color="gray" className="uppercase tracking-wider mb-4 block">
        Service Status
      </Text>
      <div className="flex items-start">
        {STEPS.map((step, idx) => (
          <div key={step.key} className={`flex items-start ${idx < STEPS.length - 1 ? "flex-1" : ""}`}>
            {/* Step */}
            <div className="flex flex-col items-center w-10 shrink-0">
              <StepIcon stepIndex={idx} status={status} currentStepIndex={currentStepIndex} />
              <span className={`text-xs mt-1 text-center leading-tight ${getLabelColor(idx, status, currentStepIndex)}`}>
                {getLabelForStep(idx, status)}
              </span>
            </div>
            {/* Connector (not after last step) */}
            {idx < STEPS.length - 1 && (
              <ConnectorLine fromIndex={idx} currentStepIndex={currentStepIndex} status={status} />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
