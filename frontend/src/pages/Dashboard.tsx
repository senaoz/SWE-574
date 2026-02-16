import { ServiceMap } from "@/components/map/ServiceMap";
import { OfferListingCard } from "@/components/ui/OfferListingCard";
import { servicesApi } from "@/services/api";
import { Button, Dialog, Heading, Text, Flex, Card } from "@radix-ui/themes";
import { HandIcon, BackpackIcon, Crosshair1Icon } from "@radix-ui/react-icons";
import { OfferNeedForm } from "@/components/forms/OfferNeedForm";
import { useFilters } from "@/contexts/FilterContext";
import { useState, useEffect } from "react";
import { Service } from "@/types";

export function Dashboard() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { searchQuery, selectedCity } = useFilters();
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await servicesApi.getServices();
      console.log(response.data);
      setServices(response.data.services || []);
      setFilteredServices(response.data.services || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      setServices([]);
      setFilteredServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Filter services based on search query and city
  useEffect(() => {
    let filtered = services;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (service) =>
          service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.tags.some((tag) => {
            const tagLabel = typeof tag === "string" ? tag : tag.label;
            return tagLabel.toLowerCase().includes(searchQuery.toLowerCase());
          })
      );
    }

    // Filter by city
    if (selectedCity && selectedCity !== "all") {
      filtered = filtered.filter((service) => {
        // Check if service has city information in location address
        const address = service.location.address?.toLowerCase() || "";
        return address.includes(selectedCity.toLowerCase());
      });
    }

    setFilteredServices(filtered);
  }, [services, searchQuery, selectedCity]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Text>Loading services...</Text>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="pr-4 space-y-2">
          <div className="pb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <BackpackIcon className="w-6 h-6 text-purple-500" />
                <Heading size="5">Create Offer</Heading>
              </div>
              <Text size="2">
                Create an offer to share your skills and services with the
                community, let others know what you're offering.
              </Text>
              <CreateServiceDialog
                serviceType="offer"
                onServiceCreated={fetchServices}
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <HandIcon className="w-6 h-6 text-blue-500" />
                <Heading size="5">Create Need</Heading>
              </div>
              <Text size="2">
                Create a need to request a service from the community, let
                others know what you're looking for.
              </Text>
              <CreateServiceDialog
                serviceType="need"
                onServiceCreated={fetchServices}
              />
            </div>
          </div>
          {/* Services Count and Results */}
          <Flex gap="2" className="mb-4" direction="column">
            <Flex align="center" gap="2">
              <Crosshair1Icon className="w-4 h-4" />
              <Text size="2" weight="medium" color="gray">
                {filteredServices.length} services found
                {searchQuery && ` for "${searchQuery}"`}
                {selectedCity &&
                  selectedCity !== "all" &&
                  ` in ${selectedCity}`}
              </Text>
            </Flex>

            <Flex align="center" gap="2" direction="row" wrap="wrap">
              {/* Status Filters */}
              <Button
                size="1"
                color="gray"
                variant="outline"
                onClick={() => setSelectedStatusFilter("all")}
              >
                All
              </Button>
              <Button
                size="1"
                color="green"
                variant="outline"
                onClick={() => setSelectedStatusFilter("active")}
              >
                Active
              </Button>
              <Button
                size="1"
                color="blue"
                variant="outline"
                onClick={() => setSelectedStatusFilter("in_progress")}
              >
                In Progress
              </Button>
              <Button
                size="1"
                color="gray"
                variant="outline"
                onClick={() => setSelectedStatusFilter("completed")}
              >
                Completed
              </Button>
              <Button
                size="1"
                color="red"
                variant="outline"
                onClick={() => setSelectedStatusFilter("cancelled")}
              >
                Cancelled
              </Button>
              <Button
                size="1"
                color="orange"
                variant="outline"
                onClick={() => setSelectedStatusFilter("expired")}
              >
                Expired
              </Button>
            </Flex>
          </Flex>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredServices
              .filter((service) =>
                selectedStatusFilter === "all"
                  ? true
                  : service.status === selectedStatusFilter
              )
              .map((service) => (
                <OfferListingCard key={service._id} service={service} />
              ))}
          </div>

          {/* No Results Message */}
          {filteredServices.length === 0 && !loading && (
            <Card className="flex flex-col items-center justify-center">
              <Text size="3" color="gray">
                No services found matching your criteria
              </Text>
              <Text size="2" color="gray" className="mt-2">
                Try adjusting your search or city filter
              </Text>
            </Card>
          )}
        </div>
        <ServiceMap services={filteredServices} />
      </div>
    </div>
  );
}

function CreateServiceDialog({
  serviceType,
  onServiceCreated,
}: {
  serviceType: "offer" | "need";
  onServiceCreated?: () => void;
}) {
  const [showDialog, setShowDialog] = useState(false);
  return (
    <Dialog.Root open={showDialog} onOpenChange={setShowDialog}>
      <Dialog.Trigger>
        <Button size="3">
          {serviceType === "offer" ? "Create Offer" : "Create Need"}
        </Button>
      </Dialog.Trigger>
      <Dialog.Content className="max-w-4xl mx-auto p-12 max-h-[90vh] overflow-y-auto">
        <Dialog.Title>
          {serviceType === "offer" ? "Create Offer" : "Create Need"}
        </Dialog.Title>
        <Dialog.Description>
          {serviceType === "offer"
            ? "Share your skills and services with the community"
            : "Request help, support, or skills from the community"}
        </Dialog.Description>
        <OfferNeedForm
          serviceType={serviceType}
          onSuccess={() => {
            setShowDialog(false);
            // Refresh services list after successful creation
            if (onServiceCreated) {
              onServiceCreated();
            }
          }}
          onClose={() => {
            setShowDialog(false);
          }}
        />
      </Dialog.Content>
    </Dialog.Root>
  );
}
