import { useState, useEffect } from "react";
import { Tabs, Flex, Spinner } from "@radix-ui/themes";
import { Service, Transaction, TimeBankResponse } from "@/types";
import {
  servicesApi,
  joinRequestsApi,
  transactionsApi,
  chatApi,
  usersApi,
  ratingsApi,
} from "@/services/api";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MyServicesTab } from "./MyServicesTab";
import { MyApplicationsTab } from "./MyApplicationsTab";
import { MyTimebankTab } from "./MyTimebankTab";
import { SavedServicesTab } from "./SavedServicesTab";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { BookmarkIcon, ClockIcon, LucideList } from "lucide-react";
import { formatDateShort } from "@/utils/utils";

export type MyServicesTabValue =
  | "services"
  | "applications"
  | "transactions"
  | "timebank"
  | "saved";

interface MyServicesProps {
  activeTab?: MyServicesTabValue;
  onDataLoad?: (counts: {
    requests: number;
    transactions: number;
    saved: number;
    services: number;
    timebank: number;
    applications: number;
  }) => void;
  /** When tab is "services", filter/scroll to this status (from URL ?status=). */
  statusFilter?: string;
  /** When set, scroll to and highlight the service card with this ID. */
  highlightServiceId?: string;
}

export function MyServices({
  activeTab: activeTabProp,
  onDataLoad,
  statusFilter,
  highlightServiceId,
}: MyServicesProps = {}) {
  const navigate = useNavigate();
  const { currentUserId } = useUser();
  const [activeTab, setActiveTab] =
    useState<MyServicesTabValue>("applications");
  const isManagedByParent = activeTabProp !== undefined;
  const effectiveTab = isManagedByParent ? activeTabProp : activeTab;
  const queryClient = useQueryClient();

  const { data: savedServicesData } = useQuery({
    queryKey: ["saved-services"],
    queryFn: () => servicesApi.getSavedServices(1, 50).then((res) => res.data),
    enabled: !!currentUserId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: myServicesData, isLoading } = useQuery({
    queryKey: ["my-services-data", currentUserId],
    queryFn: async () => {
      if (!currentUserId) throw new Error("User not authenticated");

      const [servicesResponse, requestsResponse] = await Promise.all([
        servicesApi.getServices({ user_id: currentUserId, page: 1, limit: 50 }),
        joinRequestsApi.getMyRequests(1, 50),
      ]);

      const allServices = servicesResponse.data.services;
      const allRequests = requestsResponse.data.requests;

      // Fetch services for approved applications
      const approvedRequests = allRequests.filter(
        (req) => req.status === "approved",
      );
      const applicationServicesList = await Promise.all(
        approvedRequests.map((req) =>
          servicesApi.getService(req.service_id).then((r) => r.data).catch(() => null),
        ),
      ).then((results) => results.filter(Boolean) as Service[]);

      // Fetch missing service titles
      const requestsNeedingTitles = allRequests.filter(
        (req) => !req.service?.title && req.service_id,
      );
      const fetchedTitles = await Promise.all(
        requestsNeedingTitles.map((req) =>
          servicesApi
            .getService(req.service_id)
            .then((r) => ({ serviceId: req.service_id, title: r.data.title }))
            .catch(() => null),
        ),
      );
      const serviceTitles: Record<string, string> = {};
      fetchedTitles.forEach((r) => {
        if (r) serviceTitles[r.serviceId] = r.title;
      });

      // Fetch transactions for in_progress/completed services
      const servicesNeedingTransactions = [
        ...allServices,
        ...applicationServicesList,
      ].filter(
        (s, i, arr) =>
          arr.findIndex((x) => x._id === s._id) === i &&
          (s.status === "in_progress" || s.status === "completed"),
      );
      const transactionResults = await Promise.all(
        servicesNeedingTransactions.map((s) =>
          transactionsApi
            .getServiceTransactions(s._id, 1, 50)
            .then((r) => ({ id: s._id, txns: r.data.transactions }))
            .catch(() => ({ id: s._id, txns: [] as Transaction[] })),
        ),
      );
      const serviceTransactions: Record<string, Transaction[]> = {};
      transactionResults.forEach(({ id, txns }) => {
        serviceTransactions[id] = txns;
      });

      return {
        services: allServices,
        requests: allRequests,
        applicationServices: applicationServicesList,
        serviceTitles,
        serviceTransactions,
      };
    },
    enabled: !!currentUserId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: timebankResponse, isLoading: timebankLoading } = useQuery({
    queryKey: ["my-timebank"],
    queryFn: () => usersApi.getTimeBank().then((r) => r.data as TimeBankResponse),
    enabled: !!currentUserId,
    staleTime: 2 * 60 * 1000,
  });

  const services = myServicesData?.services ?? [];
  const requests = myServicesData?.requests ?? [];
  const applicationServices = myServicesData?.applicationServices ?? [];
  const serviceTitles = myServicesData?.serviceTitles ?? {};
  const serviceTransactions = myServicesData?.serviceTransactions ?? {};
  const timebankData = timebankResponse ?? null;

  const invalidateMyData = () => {
    queryClient.invalidateQueries({ queryKey: ["my-services-data", currentUserId] });
    queryClient.invalidateQueries({ queryKey: ["my-timebank"] });
  };

  useEffect(() => {
    if (!onDataLoad || isLoading) return;
    onDataLoad({
      requests: requests.length,
      transactions: 0,
      saved: savedServicesData?.services?.length ?? 0,
      services: services.length,
      timebank: timebankData?.transactions?.length ?? 0,
      applications: applicationServices.length,
    });
  }, [
    onDataLoad,
    isLoading,
    requests.length,
    savedServicesData?.services?.length,
    services.length,
    applicationServices.length,
    timebankData?.transactions?.length,
  ]);


  const handleCancelTransaction = async (transactionId: string) => {
    try {
      await transactionsApi.updateTransaction(transactionId, {
        status: "cancelled",
      });
      invalidateMyData();
    } catch (error) {
      console.error("Error cancelling transaction:", error);
    }
  };

  const handleStartChat = async (transactionId: string) => {
    const allTransactions = Object.values(serviceTransactions).flat();
    const transaction = allTransactions.find((t) => t._id === transactionId);
    try {
      const { data } = await chatApi.createTransactionChatRoom(transactionId);
      const roomId = data?._id;
      navigate(
        roomId ? `/profile?tab=chat&room_id=${roomId}` : "/profile?tab=chat",
      );
    } catch (error) {
      console.error("Error starting chat:", error);
      try {
        if (currentUserId && transaction) {
          const otherUserId =
            transaction.provider_id === currentUserId
              ? transaction.requester_id
              : transaction.provider_id;

          const { data } = await chatApi.createChatRoom({
            participant_ids: [currentUserId, otherUserId],
            transaction_id: transactionId,
            name: `Transaction Chat - ${
              transaction.description || "Service Exchange"
            }`,
            description: `Chat for transaction involving ${transaction.timebank_hours} hours`,
          });
          const roomId = data?._id;
          navigate(
            roomId
              ? `/profile?tab=chat&room_id=${roomId}`
              : "/profile?tab=chat",
          );
        }
      } catch (fallbackError) {
        console.error("Error creating fallback chat:", fallbackError);
      }
    }
  };

  const handleServiceClick = (id: string) => {
    navigate(`/service/${id}`);
  };

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: "default" | "danger";
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    variant: "default",
    onConfirm: async () => {},
  });

  const handleSetServiceInProgress = async (serviceId: string) => {
    setConfirmState({
      open: true,
      title: "Set service to In Progress?",
      description:
        "Are you sure you want to set this service to 'In Progress'?",
      variant: "default",
      onConfirm: async () => {
        try {
          await servicesApi.updateService(serviceId, {
            status: "in_progress",
          } as any);
          invalidateMyData();
        } catch (error: any) {
          console.error("Error setting service to in progress:", error);
          alert(
            error.response?.data?.detail ||
              "Failed to update service status. Please try again.",
          );
        }
      },
    });
  };

  const handleDeleteService = async (serviceId: string) => {
    setConfirmState({
      open: true,
      title: "Delete this service?",
      description:
        "Are you sure you want to delete this service? This action cannot be undone.",
      variant: "danger",
      onConfirm: async () => {
        try {
          await servicesApi.deleteService(serviceId);
          invalidateMyData();
        } catch (error: any) {
          console.error("Error deleting service:", error);
          alert(
            error.response?.data?.detail ||
              "Failed to delete service. Please try again.",
          );
        }
      },
    });
  };

  const handleCancelService = async (serviceId: string) => {
    setConfirmState({
      open: true,
      title: "Cancel this service?",
      description: "Are you sure you want to cancel this service?",
      variant: "default",
      onConfirm: async () => {
        try {
          await servicesApi.cancelService(serviceId);
          invalidateMyData();
        } catch (error: any) {
          console.error("Error cancelling service:", error);
          alert(
            error.response?.data?.detail ||
              "Failed to cancel service. Please try again.",
          );
        }
      },
    });
  };

  const handleConfirmTransactionCompletion = async (
    transactionId: string,
    ratingData?: {
      ratedUserId: string;
      score: number;
      comment?: string;
      tags: string[];
    },
  ) => {
    try {
      await transactionsApi.confirmTransactionCompletion(transactionId);
    } catch (error: any) {
      console.error("Error confirming transaction:", error);
      alert(
        error.response?.data?.detail || "Failed to confirm. Please try again.",
      );
      return;
    }

    if (ratingData) {
      try {
        await ratingsApi.createRating({
          transaction_id: transactionId,
          rated_user_id: ratingData.ratedUserId,
          score: ratingData.score,
          comment: ratingData.comment,
          tags: ratingData.tags,
        });
      } catch (ratingError: any) {
        console.error("Rating submission failed:", ratingError);
      }
    }

    invalidateMyData();
  };

  if (isLoading) {
    return (
      <Flex align="center" justify="center" py="9">
        <Spinner size="3" />
      </Flex>
    );
  }

  return (
    <div>
      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState((prev) => ({ ...prev, open }))}
        title={confirmState.title}
        description={confirmState.description}
        variant={confirmState.variant}
        onConfirm={confirmState.onConfirm}
      />
      {(isManagedByParent ? effectiveTab === "services" : true) && (
        <div className="mb-8 grid">
          <MyServicesTab
            services={services}
            serviceTransactions={serviceTransactions}
            currentUserId={currentUserId}
            requiresNeedCreation={timebankData?.requires_need_creation ?? false}
            onSetServiceInProgress={handleSetServiceInProgress}
onDeleteService={handleDeleteService}
            onCancelService={handleCancelService}
            onStartChat={handleStartChat}
            onCancelTransaction={handleCancelTransaction}
            onConfirmTransactionCompletion={handleConfirmTransactionCompletion}
            onRequestUpdate={invalidateMyData}
            formatDate={formatDateShort}
            statusFilter={statusFilter}
            highlightServiceId={highlightServiceId}
          />
        </div>
      )}

      {isManagedByParent ? (
        <div>
          {effectiveTab === "applications" && (
            <MyApplicationsTab
              requests={requests}
              serviceTitles={serviceTitles}
              services={applicationServices}
              serviceTransactions={serviceTransactions}
              currentUserId={currentUserId}
              onServiceClick={handleServiceClick}
              onConfirmTransactionCompletion={
                handleConfirmTransactionCompletion
              }
              formatDate={formatDateShort}
            />
          )}
          {effectiveTab === "timebank" && (
            <MyTimebankTab
              timebankData={timebankData}
              timebankLoading={timebankLoading}
            />
          )}
          {effectiveTab === "saved" && (
            <SavedServicesTab
              services={savedServicesData?.services ?? []}
              onUnsave={async (serviceId) => {
                await servicesApi.unsaveService(serviceId);
                queryClient.invalidateQueries({ queryKey: ["saved-services"] });
                queryClient.invalidateQueries({
                  queryKey: ["saved-service-ids"],
                });
              }}
            />
          )}
        </div>
      ) : (
        <Tabs.Root
          value={effectiveTab}
          onValueChange={(v) => setActiveTab(v as MyServicesTabValue)}
        >
          <Tabs.List>
            <Tabs.Trigger value="applications">
              <LucideList className="w-4 h-4 mr-2" />
              My Applications ({requests.length})
            </Tabs.Trigger>
            <Tabs.Trigger value="timebank">
              <ClockIcon className="w-4 h-4 mr-2" />
              Timebank Logs
            </Tabs.Trigger>
            <Tabs.Trigger value="saved">
              <BookmarkIcon className="w-4 h-4 mr-2" />
              Saved Items ({savedServicesData?.services?.length ?? 0})
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="applications" className="mt-6">
            <MyApplicationsTab
              requests={requests}
              serviceTitles={serviceTitles}
              services={applicationServices}
              serviceTransactions={serviceTransactions}
              currentUserId={currentUserId}
              onServiceClick={handleServiceClick}
              onConfirmTransactionCompletion={
                handleConfirmTransactionCompletion
              }
              formatDate={formatDateShort}
            />
          </Tabs.Content>

          <Tabs.Content value="timebank">
            <MyTimebankTab
              timebankData={timebankData}
              timebankLoading={timebankLoading}
            />
          </Tabs.Content>

          <Tabs.Content value="saved">
            <SavedServicesTab
              services={savedServicesData?.services ?? []}
              onUnsave={async (serviceId) => {
                await servicesApi.unsaveService(serviceId);
                queryClient.invalidateQueries({ queryKey: ["saved-services"] });
                queryClient.invalidateQueries({
                  queryKey: ["saved-service-ids"],
                });
              }}
            />
          </Tabs.Content>
        </Tabs.Root>
      )}
    </div>
  );
}
