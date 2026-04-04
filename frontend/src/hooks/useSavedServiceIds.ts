import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import { servicesApi } from "@/services/api";
import { Service } from "@/types";

const SAVED_SERVICE_IDS_QUERY_KEY = ["saved-service-ids"] as const;
const SAVED_SERVICES_QUERY_KEY = ["saved-services"] as const;
const SAVED_SERVICE_OVERRIDES_QUERY_KEY = ["saved-service-overrides"] as const;

const addSavedServiceId = (serviceIds: string[], serviceId: string) =>
  serviceIds.includes(serviceId) ? serviceIds : [...serviceIds, serviceId];

const removeSavedServiceId = (serviceIds: string[], serviceId: string) =>
  serviceIds.filter((savedServiceId) => savedServiceId !== serviceId);

type SavedServiceOverrides = Record<string, boolean>;
const applySavedServiceOverrides = (
  serviceIds: string[],
  overrides: SavedServiceOverrides,
) =>
  Object.entries(overrides).reduce<string[]>((current, [serviceId, isSaved]) => {
    if (isSaved) {
      return addSavedServiceId(current, serviceId);
    }
    return removeSavedServiceId(current, serviceId);
  }, serviceIds);

export function useSavedServiceIds() {
  const { currentUserId } = useUser();
  const queryClient = useQueryClient();
  const savedServiceIdsQueryKey = [...SAVED_SERVICE_IDS_QUERY_KEY, currentUserId];
  const savedServiceOverridesQueryKey = [
    ...SAVED_SERVICE_OVERRIDES_QUERY_KEY,
    currentUserId,
  ];

  const { data } = useQuery({
    queryKey: savedServiceIdsQueryKey,
    queryFn: () =>
      servicesApi.getSavedServiceIds().then((res) => res.data.service_ids),
    enabled: !!currentUserId,
  });
  const { data: savedStateOverrides = {} } = useQuery({
    queryKey: savedServiceOverridesQueryKey,
    queryFn: () =>
      Promise.resolve(
        queryClient.getQueryData<SavedServiceOverrides>(
          savedServiceOverridesQueryKey,
        ) ?? ({} as SavedServiceOverrides),
      ),
    enabled: !!currentUserId,
    initialData: {} as SavedServiceOverrides,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const savedServiceIds: string[] = data ?? [];
  const effectiveSavedServiceIds = applySavedServiceOverrides(
    savedServiceIds,
    savedStateOverrides,
  );
  const hasLoadedSavedServiceIds = !!currentUserId && data !== undefined;

  useEffect(() => {
    if (!currentUserId || !hasLoadedSavedServiceIds) return;

    const syncedOverrides = Object.entries(savedStateOverrides).filter(
      ([serviceId, isSaved]) => savedServiceIds.includes(serviceId) !== isSaved,
    );

    if (syncedOverrides.length === Object.keys(savedStateOverrides).length) return;

    queryClient.setQueryData<SavedServiceOverrides>(
      savedServiceOverridesQueryKey,
      Object.fromEntries(syncedOverrides),
    );
  }, [
    currentUserId,
    hasLoadedSavedServiceIds,
    queryClient,
    savedServiceIds,
    savedServiceOverridesQueryKey,
    savedStateOverrides,
  ]);

  const setSavedStateOverride = (serviceId: string, isSaved: boolean) => {
    queryClient.setQueryData<SavedServiceOverrides>(
      savedServiceOverridesQueryKey,
      (current) => ({
        ...(current ?? {}),
        [serviceId]: isSaved,
      }),
    );
  };

  const restoreSavedStateOverrides = (
    overrides: SavedServiceOverrides | undefined,
  ) => {
    queryClient.setQueryData<SavedServiceOverrides>(
      savedServiceOverridesQueryKey,
      overrides ?? {},
    );
  };

  const saveMutation = useMutation({
    mutationFn: (serviceId: string) => servicesApi.saveService(serviceId),
    onMutate: async (serviceId: string) => {
      await queryClient.cancelQueries({ queryKey: SAVED_SERVICE_IDS_QUERY_KEY });
      const previousSavedStateOverrides =
        queryClient.getQueryData<SavedServiceOverrides>(
          savedServiceOverridesQueryKey,
        ) ?? {};

      setSavedStateOverride(serviceId, true);

      return { previousSavedStateOverrides };
    },
    onError: (_error, _serviceId, context) => {
      restoreSavedStateOverrides(context?.previousSavedStateOverrides);
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
      const previousSavedStateOverrides =
        queryClient.getQueryData<SavedServiceOverrides>(
          savedServiceOverridesQueryKey,
        ) ?? {};

      setSavedStateOverride(serviceId, false);

      return { previousSavedStateOverrides };
    },
    onError: (_error, _serviceId, context) => {
      restoreSavedStateOverrides(context?.previousSavedStateOverrides);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_SERVICE_IDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SAVED_SERVICES_QUERY_KEY });
    },
  });

  const isSaved = (serviceOrId: Service | string): boolean => {
    const id = typeof serviceOrId === "string" ? serviceOrId : serviceOrId._id;

    if (!id) return false;

    if (id in savedStateOverrides) {
      return savedStateOverrides[id];
    }

    if (hasLoadedSavedServiceIds) {
      return effectiveSavedServiceIds.includes(id);
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
    savedServiceIds: effectiveSavedServiceIds,
    currentUserId,
    isSaved,
    saveService,
    unsaveService,
    isSavingService,
    isUnsavingService,
  };
}
