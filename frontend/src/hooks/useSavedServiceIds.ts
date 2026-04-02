import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { servicesApi } from "@/services/api";
import { useUser } from "@/contexts/UserContext";
import { Service } from "@/types";

export function useSavedServiceIds() {
  const { currentUserId } = useUser();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["saved-service-ids"],
    queryFn: () => servicesApi.getSavedServiceIds().then((res) => res.data.service_ids),
    enabled: !!currentUserId,
  });

  const savedServiceIds: string[] = data ?? [];

  const saveMutation = useMutation({
    mutationFn: (serviceId: string) => servicesApi.saveService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-service-ids"] });
      queryClient.invalidateQueries({ queryKey: ["saved-services"] });
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: (serviceId: string) => servicesApi.unsaveService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-service-ids"] });
      queryClient.invalidateQueries({ queryKey: ["saved-services"] });
    },
  });

  const isSaved = (serviceOrId: Service | string): boolean => {
    const id = typeof serviceOrId === "string" ? serviceOrId : serviceOrId._id;
    if (!id) return false;
    if (typeof serviceOrId !== "string" && serviceOrId.is_saved !== undefined) {
      return serviceOrId.is_saved;
    }
    return savedServiceIds.includes(id);
  };

  const isSavingService = (serviceId: string): boolean =>
    saveMutation.isPending && saveMutation.variables === serviceId;

  const isUnsavingService = (serviceId: string): boolean =>
    unsaveMutation.isPending && unsaveMutation.variables === serviceId;

  const saveService = (serviceId: string) => saveMutation.mutateAsync(serviceId);
  const unsaveService = (serviceId: string) => unsaveMutation.mutateAsync(serviceId);

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
