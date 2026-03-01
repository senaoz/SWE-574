import { Card, Text, Flex, Badge, Button } from "@radix-ui/themes";
import { Service } from "@/types";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  ClockIcon,
  HeartFilledIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";
import { useState } from "react";

interface SavedServicesTabProps {
  services: Service[];
  onUnsave: (serviceId: string) => Promise<void>;
}

export function SavedServicesTab({ services, onUnsave }: SavedServicesTabProps) {
  const navigate = useNavigate();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleUnsave = async (e: React.MouseEvent, serviceId: string) => {
    e.stopPropagation();
    setRemovingId(serviceId);
    try {
      await onUnsave(serviceId);
    } finally {
      setRemovingId(null);
    }
  };

  if (services.length === 0) {
    return (
      <Card className="p-8">
        <Flex direction="column" align="center" gap="2">
          <HeartFilledIcon className="w-8 h-8 text-gray-300" />
          <Text size="3" color="gray" className="text-center">
            You haven't saved any services yet.
          </Text>
          <Text size="2" color="gray" className="text-center">
            Browse offers and needs, then click "Save" to bookmark them for later.
          </Text>
          <Button
            variant="soft"
            size="2"
            className="mt-2"
            onClick={() => navigate("/dashboard")}
          >
            Browse Services
          </Button>
        </Flex>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {services.map((service) => (
        <Card
          key={service._id}
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate(`/service/${service._id}`)}
        >
          <Flex direction="column" gap="2">
            <Flex justify="between" align="start">
              <Flex gap="2" wrap="wrap">
                <StatusBadge status={service.status} />
                <Badge
                  color={service.service_type === "offer" ? "purple" : "blue"}
                  variant="soft"
                  size="1"
                >
                  {service.service_type === "offer" ? "OFFER" : "NEED"}
                </Badge>
              </Flex>
              <Button
                variant="ghost"
                color="red"
                size="1"
                disabled={removingId === service._id}
                onClick={(e) => handleUnsave(e, service._id)}
              >
                <Cross2Icon className="w-3 h-3" />
              </Button>
            </Flex>

            <Text size="3" weight="bold" className="line-clamp-2">
              {service.title}
            </Text>

            <Text size="2" color="gray" className="line-clamp-2">
              {service.description}
            </Text>

            <Flex gap="3" wrap="wrap" className="mt-1">
              <Flex align="center" gap="1">
                <ClockIcon className="w-3 h-3" />
                <Text size="1">{service.estimated_duration}h</Text>
              </Flex>
              {service.location?.address && (
                <Text size="1" color="gray" className="line-clamp-1">
                  {service.location.address}
                </Text>
              )}
              {service.is_remote && (
                <Badge color="cyan" variant="soft" size="1">
                  Remote
                </Badge>
              )}
            </Flex>
          </Flex>
        </Card>
      ))}
    </div>
  );
}
