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
  const isCompleted = stepIndex < currentStepIndex && status !== "cancelled" && status !== "expired";

  // Special icons for cancelled/expired at the current (interrupted) step
  if (stepIndex === currentStepIndex) {
    if (status === "cancelled") {
      return (
        <div className="w-8 h-8 rounded-full border-2 border-red-500 bg-white flex items-center justify-center">
          <CrossCircledIcon className="w-5 h-5 text-red-500" />
        </div>
      );
    }
    if (status === "expired") {
      return (
        <div className="w-8 h-8 rounded-full border-2 border-orange-400 bg-white flex items-center justify-center">
          <ExclamationTriangleIcon className="w-5 h-5 text-orange-400" />
        </div>
      );
    }
    // Normal active step
    return (
      <div className="w-8 h-8 rounded-full border-2 border-green-600 bg-white flex items-center justify-center">
        <span className="text-sm font-bold text-green-700">{stepIndex + 1}</span>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
        <CheckCircledIcon className="w-5 h-5 text-white" />
      </div>
    );
  }

  // Future / not-yet-reached step
  return (
    <div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
      <span className="text-sm font-bold text-gray-400">{stepIndex + 1}</span>
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
      return 1; // Cancelled at the "In Progress" step
    case "expired":
      return 1; // Expired at the "In Progress" step
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
    return "text-green-700 font-semibold";
  }
  if (stepIndex < currentStepIndex && status !== "cancelled" && status !== "expired") {
    return "text-green-700 font-semibold";
  }
  return "text-gray-400";
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
  const isActive = fromIndex < currentStepIndex && status !== "cancelled" && status !== "expired";
  return (
    <div
      className={`flex-1 h-0.5 mt-4 mx-1 ${isActive ? "bg-green-500" : "bg-gray-200"}`}
    />
  );
}

export function ServiceStatusBar({ status }: ServiceStatusBarProps) {
  const currentStepIndex = getStepIndexForStatus(status);

  return (
    <Card className="p-4">
      <Text size="1" weight="bold" color="gray" className="uppercase tracking-wider mb-4 block">
        Service Status
      </Text>
      <div className="flex items-start">
        {STEPS.map((step, idx) => (
          <div key={step.key} className="flex items-start flex-1">
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
