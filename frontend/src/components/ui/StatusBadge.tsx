import { Badge } from "@radix-ui/themes";
import {
  ClockIcon,
  CheckCircledIcon,
  ExclamationTriangleIcon,
  CrossCircledIcon,
} from "@radix-ui/react-icons";

interface StatusBadgeProps {
  status: string;
  size?: "1" | "2" | "3";
  variant?: "solid" | "soft" | "outline" | "surface";
}

export function StatusBadge({
  status,
  size = "2",
  variant = "soft",
}: StatusBadgeProps) {
  const getStatusIcon = (statusValue: string, size: "1" | "2" | "3") => {
    let className = "w-5 h-5";

    if (size === "1") {
      className = "w-4 h-4";
    }

    switch (statusValue) {
      case "active":
        return <CheckCircledIcon className={className} color="green" />;
      case "in_progress":
        return <ClockIcon className={className} color="blue" />;
      case "completed":
        return <CheckCircledIcon className={className} color="gray" />;
      case "cancelled":
        return <CrossCircledIcon className={className} color="red" />;
      case "expired":
        return <ExclamationTriangleIcon className={className} color="orange" />;
      case "pending":
        return <ClockIcon className={className} color="gray" />;
      default:
        return <ClockIcon className={className} color="gray" />;
    }
  };

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case "active":
        return "green";
      case "in_progress":
        return "blue";
      case "completed":
        return "gray";
      case "cancelled":
        return "red";
      case "expired":
        return "orange";
      default:
        return "gray";
    }
  };

  let statusText = status;
  if (status === "active") {
    statusText = "Active";
  } else if (status === "in_progress") {
    statusText = "In Progress";
  } else if (status === "completed") {
    statusText = "Completed";
  } else if (status === "cancelled") {
    statusText = "Cancelled";
  } else if (status === "expired") {
    statusText = "Expired";
  } else if (status === "pending") {
    statusText = "Pending";
  }

  return (
    <Badge color={getStatusColor(status)} variant={variant} size={size}>
      {getStatusIcon(status, size)}
      <span className="capitalize">{statusText}</span>
    </Badge>
  );
}
