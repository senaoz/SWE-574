import { useState, useEffect } from "react";
import { Tabs } from "@radix-ui/themes";
import { Service, JoinRequest, Transaction, TimeBankResponse } from "@/types";
import {
  servicesApi,
  joinRequestsApi,
  transactionsApi,
  chatApi,
  usersApi,
} from "@/services/api";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/App";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MyServicesTab } from "./MyServicesTab";
import { MyApplicationsTab } from "./MyApplicationsTab";
import { MyTransactionsTab } from "./MyTransactionsTab";
import { MyTimebankTab } from "./MyTimebankTab";
import { SavedServicesTab } from "./SavedServicesTab";
import {
  BookmarkIcon,
  ClockIcon,
  LucideArrowLeftRight,
  LucideList,
} from "lucide-react";

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
}

export function MyServices({
  activeTab: activeTabProp,
  onDataLoad,
  statusFilter,
}: MyServicesProps = {}) {
  const navigate = useNavigate();
  const { currentUserId } = useUser();
  const [services, setServices] = useState<Service[]>([]);
  const [applicationServices, setApplicationServices] = useState<Service[]>([]); // Services for approved applications
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [serviceTransactions, setServiceTransactions] = useState<
    Record<string, Transaction[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] =
    useState<MyServicesTabValue>("applications");
  const isManagedByParent = activeTabProp !== undefined;
  const effectiveTab = isManagedByParent ? activeTabProp : activeTab;
  const [serviceTitles, setServiceTitles] = useState<Record<string, string>>(
    {},
  );

  const [timebankData, setTimebankData] = useState<TimeBankResponse | null>(
    null,
  );
  const [timebankLoading, setTimebankLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: savedServicesData } = useQuery({
    queryKey: ["saved-services"],
    queryFn: () => servicesApi.getSavedServices(1, 50).then((res) => res.data),
    enabled: !!currentUserId,
  });

  useEffect(() => {
    fetchData();
    fetchTimebankData();
  }, []);

  useEffect(() => {
    if (!onDataLoad || isLoading) return;
    onDataLoad({
      requests: requests.length,
      transactions: transactions.length,
      saved: savedServicesData?.services?.length ?? 0,
      services: services?.length ?? 0,
      timebank: timebankData?.balance ?? 0,
      applications: applicationServices.length,
    });
  }, [
    onDataLoad,
    isLoading,
    requests.length,
    transactions.length,
    savedServicesData?.services?.length,
    services?.length,
    applicationServices.length,
    timebankData?.balance,
  ]);

  const fetchTimebankData = async () => {
    try {
      setTimebankLoading(true);
      const response = await usersApi.getTimeBank();
      setTimebankData(response.data);
    } catch (error) {
      console.error("Error fetching TimeBank data:", error);
    } finally {
      setTimebankLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);

      if (!currentUserId) {
        throw new Error("User not authenticated");
      }

      // Fetch user's services
      const servicesResponse = await servicesApi.getServices({
        user_id: currentUserId,
        page: 1,
        limit: 50,
      });
      setServices(servicesResponse.data.services);

      // Fetch user's join requests
      const requestsResponse = await joinRequestsApi.getMyRequests(1, 50);
      setRequests(requestsResponse.data.requests);

      // Fetch services for approved applications
      const approvedRequests = requestsResponse.data.requests.filter(
        (req) => req.status === "approved",
      );
      const applicationServicesList: Service[] = [];
      for (const request of approvedRequests) {
        try {
          const serviceResponse = await servicesApi.getService(
            request.service_id,
          );
          applicationServicesList.push(serviceResponse.data);
        } catch (error) {
          console.error(
            `Error fetching service ${request.service_id} for application:`,
            error,
          );
        }
      }
      setApplicationServices(applicationServicesList);

      // Fetch missing service titles
      const requestsNeedingTitles = requestsResponse.data.requests.filter(
        (request) =>
          !request.service?.title &&
          request.service_id &&
          !serviceTitles[request.service_id],
      );

      const fetchPromises = requestsNeedingTitles.map(async (request) => {
        try {
          const serviceResponse = await servicesApi.getService(
            request.service_id,
          );
          return {
            serviceId: request.service_id,
            title: serviceResponse.data.title,
          };
        } catch (error) {
          console.error(`Error fetching service ${request.service_id}:`, error);
          return null;
        }
      });

      const fetchedTitles = await Promise.all(fetchPromises);
      const missingTitles: Record<string, string> = {};
      fetchedTitles.forEach((result) => {
        if (result) {
          missingTitles[result.serviceId] = result.title;
        }
      });

      if (Object.keys(missingTitles).length > 0) {
        setServiceTitles((prev) => ({ ...prev, ...missingTitles }));
      }

      // Fetch user's transactions
      const transactionsResponse = await transactionsApi.getMyTransactions(
        1,
        50,
      );
      setTransactions(transactionsResponse.data.transactions);

      // Fetch transactions for each service
      const serviceTransactionsMap: Record<string, Transaction[]> = {};
      for (const service of servicesResponse.data.services) {
        if (
          service.status === "in_progress" ||
          service.status === "completed"
        ) {
          try {
            const serviceTransactionsResponse =
              await transactionsApi.getServiceTransactions(service._id, 1, 50);
            serviceTransactionsMap[service._id] =
              serviceTransactionsResponse.data.transactions;
          } catch (error) {
            console.error(
              `Error fetching transactions for service ${service._id}:`,
              error,
            );
            serviceTransactionsMap[service._id] = [];
          }
        }
      }
      setServiceTransactions(serviceTransactionsMap);

      console.log(
        servicesResponse.data.services,
        requestsResponse.data.requests,
        transactionsResponse.data.transactions,
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      if (
        error instanceof Error &&
        error.message === "User not authenticated"
      ) {
        window.location.href = "/?login=true";
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleConfirmTransactionCompletion = async (transactionId: string) => {
    const confirmed = window.confirm(
      "Confirm that this transaction is completed? TimeBank logs will be created once both parties confirm.",
    );
    if (!confirmed) return;

    try {
      const response =
        await transactionsApi.confirmTransactionCompletion(transactionId);
      const transaction = response.data;

      if (transaction.status === "completed") {
        alert(
          "Transaction completed! Both parties confirmed. TimeBank transaction logs have been created.",
        );
      } else {
        const isProvider = transaction.provider_id === currentUserId;
        const otherParty = isProvider ? "requester" : "provider";
        alert(
          `Your confirmation has been recorded. Waiting for ${otherParty} confirmation.`,
        );
      }
      // Refresh data
      await fetchData();
    } catch (error: any) {
      console.error("Error confirming transaction completion:", error);
      alert(
        error.response?.data?.detail ||
          "Failed to confirm transaction completion. Please try again.",
      );
    }
  };

  const handleCancelTransaction = async (transactionId: string) => {
    try {
      await transactionsApi.updateTransaction(transactionId, {
        status: "cancelled",
      });
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error("Error cancelling transaction:", error);
    }
  };

  const handleStartChat = async (transactionId: string) => {
    try {
      const { data } = await chatApi.createTransactionChatRoom(transactionId);
      const roomId = data?._id;
      navigate(roomId ? `/chat?room_id=${roomId}` : "/chat");
    } catch (error) {
      console.error("Error starting chat:", error);
      try {
        const currentUserId = localStorage.getItem("access_token")
          ? JSON.parse(
              atob(localStorage.getItem("access_token")!.split(".")[1]),
            ).sub
          : null;

        if (currentUserId) {
          const transaction = transactions.find((t) => t._id === transactionId);
          if (transaction) {
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
            navigate(roomId ? `/chat?room_id=${roomId}` : "/chat");
          }
        }
      } catch (fallbackError) {
        console.error("Error creating fallback chat:", fallbackError);
      }
    }
  };

  const handleServiceClick = (id: string) => {
    navigate(`/service/${id}`);
  };

  const handleSetServiceInProgress = async (serviceId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to set this service to 'In Progress'?",
    );
    if (!confirmed) return;

    try {
      await servicesApi.updateService(serviceId, {
        status: "in_progress",
      } as any);
      alert("Service status updated to 'In Progress'.");
      // Refresh data
      await fetchData();
    } catch (error: any) {
      console.error("Error setting service to in progress:", error);
      alert(
        error.response?.data?.detail ||
          "Failed to update service status. Please try again.",
      );
    }
  };

  const handleConfirmServiceCompletion = async (serviceId: string) => {
    const confirmed = window.confirm(
      "Confirm that you have received this service? The service will be marked as completed once both parties confirm.",
    );
    if (!confirmed) return;

    try {
      const response = await servicesApi.confirmServiceCompletion(serviceId);
      const updatedService = response.data;

      // Check if service was completed (both parties confirmed)
      if (updatedService.status === "completed") {
        alert(
          "Service completed! Both parties confirmed. TimeBank transaction logs have been created.",
        );
      } else {
        alert(
          "Your confirmation has been recorded. Waiting for provider confirmation.",
        );
      }
      // Refresh data
      await fetchData();
    } catch (error: any) {
      console.error("Error confirming service completion:", error);
      alert(
        error.response?.data?.detail ||
          "Failed to confirm service completion. Please try again.",
      );
    }
  };

  const handleMarkServiceAsDone = async (serviceId: string) => {
    const service = services.find((s) => s._id === serviceId);
    if (!service) return;

    const confirmed = window.confirm(
      "Are you sure you want to mark this service as completed?",
    );
    if (!confirmed) return;

    try {
      console.log(service);
      // Check if service has matched users
      if (service.matched_user_ids && service.matched_user_ids.length > 0) {
        // Service has matches - need to use confirm completion
        // First, if status is "active", update it to "in_progress"
        if (service.status === "active") {
          await servicesApi.updateService(serviceId, {
            status: "in_progress",
          } as any);
        }

        // Then confirm completion (this requires in_progress status)
        try {
          const response =
            await servicesApi.confirmServiceCompletion(serviceId);
          const updatedService = response.data;

          // Check if service was completed (both parties confirmed)
          if (updatedService.status === "completed") {
            alert(
              "Service completed! Both parties confirmed. TimeBank transaction logs have been created.",
            );
          } else {
            // Check confirmation status
            const isProvider =
              String(updatedService.user_id) === String(currentUserId);
            const isReceiver = updatedService.matched_user_ids?.includes(
              currentUserId || "",
            );

            if (isProvider) {
              const allReceiversConfirmed =
                updatedService.receiver_confirmed_ids &&
                updatedService.matched_user_ids &&
                updatedService.receiver_confirmed_ids.length ===
                  updatedService.matched_user_ids.length;

              if (allReceiversConfirmed) {
                alert(
                  "Your confirmation has been recorded. All receivers have confirmed. Service should be completed.",
                );
              } else {
                alert(
                  "Your confirmation has been recorded. Waiting for receiver confirmation.",
                );
              }
            } else if (isReceiver) {
              const providerConfirmed =
                updatedService.provider_confirmed || false;
              if (providerConfirmed) {
                alert(
                  "Your confirmation has been recorded. Provider has confirmed. Service should be completed.",
                );
              } else {
                alert(
                  "Your confirmation has been recorded. Waiting for provider confirmation.",
                );
              }
            } else {
              alert(
                "Service completion confirmed. Waiting for other party confirmation.",
              );
            }
          }
        } catch (error: any) {
          // If confirm completion fails, try the deprecated complete endpoint
          if (error.response?.status === 400) {
            try {
              await servicesApi.completeService(serviceId);
              alert("Service marked as completed.");
            } catch (completeError: any) {
              throw error; // Throw original error
            }
          } else {
            throw error;
          }
        }
      } else {
        // No matches - directly update status to completed
        await servicesApi.updateService(serviceId, {
          status: "completed",
        } as any);
        alert("Service marked as completed.");
      }

      // Refresh data
      await fetchData();
    } catch (error: any) {
      console.error("Error marking service as done:", error);
      alert(
        error.response?.data?.detail ||
          "Failed to mark service as done. Please try again.",
      );
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this service? This action cannot be undone.",
    );
    if (!confirmed) return;

    try {
      await servicesApi.deleteService(serviceId);
      alert("Service deleted successfully.");
      // Refresh data
      await fetchData();
    } catch (error: any) {
      console.error("Error deleting service:", error);
      alert(
        error.response?.data?.detail ||
          "Failed to delete service. Please try again.",
      );
    }
  };

  const handleCancelService = async (serviceId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this service?",
    );
    if (!confirmed) return;

    try {
      await servicesApi.cancelService(serviceId);
      alert("Service cancelled successfully.");
      // Refresh data
      await fetchData();
    } catch (error: any) {
      console.error("Error cancelling service:", error);
      alert(
        error.response?.data?.detail ||
          "Failed to cancel service. Please try again.",
      );
    }
  };

  if (isLoading) {
    return <></>;
  }

  return (
    <div>
      {(isManagedByParent ? effectiveTab === "services" : true) && (
        <div className="mb-8 grid">
          <MyServicesTab
            services={services}
            serviceTransactions={serviceTransactions}
            currentUserId={currentUserId}
            requiresNeedCreation={timebankData?.requires_need_creation ?? false}
            onSetServiceInProgress={handleSetServiceInProgress}
            onMarkServiceAsDone={handleMarkServiceAsDone}
            onConfirmServiceCompletion={handleConfirmServiceCompletion}
            onConfirmTransactionCompletion={handleConfirmTransactionCompletion}
            onDeleteService={handleDeleteService}
            onCancelService={handleCancelService}
            onRequestUpdate={fetchData}
            formatDate={formatDate}
            statusFilter={statusFilter}
          />
        </div>
      )}

      {isManagedByParent ? (
        <div className="mt-6">
          {effectiveTab === "applications" && (
            <MyApplicationsTab
              requests={requests}
              serviceTitles={serviceTitles}
              services={applicationServices}
              currentUserId={currentUserId}
              onServiceClick={handleServiceClick}
              onConfirmServiceCompletion={handleConfirmServiceCompletion}
              formatDate={formatDate}
            />
          )}
          {effectiveTab === "transactions" && (
            <MyTransactionsTab
              transactions={transactions}
              currentUserId={currentUserId}
              requiresNeedCreation={
                timebankData?.requires_need_creation ?? false
              }
              onConfirmTransactionCompletion={
                handleConfirmTransactionCompletion
              }
              onCancelTransaction={handleCancelTransaction}
              onStartChat={handleStartChat}
              formatDate={formatDate}
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
            <Tabs.Trigger value="transactions">
              <LucideArrowLeftRight className="w-4 h-4 mr-2" />
              Transactions ({transactions.length})
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
              currentUserId={currentUserId}
              onServiceClick={handleServiceClick}
              onConfirmServiceCompletion={handleConfirmServiceCompletion}
              formatDate={formatDate}
            />
          </Tabs.Content>

          <Tabs.Content value="transactions" className="mt-6">
            <MyTransactionsTab
              transactions={transactions}
              currentUserId={currentUserId}
              requiresNeedCreation={
                timebankData?.requires_need_creation ?? false
              }
              onConfirmTransactionCompletion={
                handleConfirmTransactionCompletion
              }
              onCancelTransaction={handleCancelTransaction}
              onStartChat={handleStartChat}
              formatDate={formatDate}
            />
          </Tabs.Content>

          <Tabs.Content value="timebank" className="mt-6">
            <MyTimebankTab
              timebankData={timebankData}
              timebankLoading={timebankLoading}
            />
          </Tabs.Content>

          <Tabs.Content value="saved" className="mt-6">
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
