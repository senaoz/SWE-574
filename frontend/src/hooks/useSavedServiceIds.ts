import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import { servicesApi } from "@/services/api";
import { Service } from "@/types";

const SAVED_SERVICE_IDS_QUERY_KEY = ["saved-service-ids"] as const;
const SAVED_SERVICES_QUERY_KEY = ["saved-services"] as const;

const addSavedServiceId = (serviceIds: string[], serviceId: string) =>
  serviceIds.includes(serviceId) ? serviceIds : [...serviceIds, serviceId];

const removeSavedServiceId = (serviceIds: string[], serviceId: string) =>
  serviceIds.filter((savedServiceId) => savedServiceId !== serviceId);

export function useSavedServiceIds() {
  const { currentUserId } = useUser();
  const queryClient = useQueryClient();
  const savedServiceIdsQueryKey = [...SAVED_SERVICE_IDS_QUERY_KEY, currentUserId];

  const { data } = useQuery({
    queryKey: savedServiceIdsQueryKey,
    queryFn: () =>
      servicesApi.getSavedServiceIds().then((res) => res.data.service_ids),
    enabled: !!currentUserId,
  });

  const savedServiceIds: string[] = data ?? [];
  const hasLoadedSavedServiceIds = !!currentUserId && data !== undefined;

  const saveMutation = useMutation({
    mutationFn: (serviceId: string) => servicesApi.saveService(serviceId),
    onMutate: async (serviceId: string) => {
      await queryClient.cancelQueries({ queryKey: SAVED_SERVICE_IDS_QUERY_KEY });
      const previousSavedServiceIds =
        queryClient.getQueryData<string[]>(savedServiceIdsQueryKey) ?? [];

      queryClient.setQueryData<string[]>(savedServiceIdsQueryKey, (current) =>
        addSavedServiceId(current ?? [], serviceId),
      );

      return { previousSavedServiceIds };
    },
    onError: (_error, _serviceId, context) => {
      queryClient.setQueryData(
        savedServiceIdsQueryKey,
        context?.previousSavedServiceIds ?? [],
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_SERVICE_IDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SAVED_SERVICES_QUERY_KEY });
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: (serviceId: string) => servicesApi.unsaveService(serviceId),
    onMutate: async (serviceId: string) => {
      await queryClient.cancelQueries({ queryKey: SAVED_SERVICE_IDS_QUERY_KEY });
      const previousSavedServiceIds =
        queryClient.getQueryData<string[]>(savedServiceIdsQueryKey) ?? [];

      queryClient.setQueryData<string[]>(savedServiceIdsQueryKey, (current) =>
        removeSavedServiceId(current ?? [], serviceId),
      );

      return { previousSavedServiceIds };
    },
    onError: (_error, _serviceId, context) => {
      queryClient.setQueryData(
        savedServiceIdsQueryKey,
        context?.previousSavedServiceIds ?? [],
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_SERVICE_IDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SAVED_SERVICES_QUERY_KEY });
    },
  });

  const isSaved = (serviceOrId: Service | string): boolean => {
    const id = typeof serviceOrId === "string" ? serviceOrId : serviceOrId._id;

    if (!id) return false;

    if (hasLoadedSavedServiceIds) {
      return savedServiceIds.includes(id);
    }

    if (typeof serviceOrId !== "string") {
      return serviceOrId.is_saved ?? false;
    }

    return false;
  };

  const isSavingService = (serviceId: string): boolean =>
    saveMutation.isPending && saveMutation.variables === serviceId;

  const isUnsavingService = (serviceId: string): boolean =>
    unsaveMutation.isPending && unsaveMutation.variables === serviceId;

  const saveService = (serviceId: string) => saveMutation.mutateAsync(serviceId);
  const unsaveService = (serviceId: string) =>
    unsaveMutation.mutateAsync(serviceId);

  return {
    savedServiceIds,
    currentUserId,
    isSaved,
    saveService,
    unsaveService,
    isSavingService,
    isUnsavingService,
  };
}
