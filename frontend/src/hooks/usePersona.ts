import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { personaService } from '@/services/personaService'
import type { PersonaGenerateRequest, PersonaUpdateRequest } from '@/types/persona'

export function usePersonaStatus() {
  return useQuery({
    queryKey: ['personaStatus'],
    queryFn: personaService.getStatus,
  })
}

export function usePersona() {
  const { data: status } = usePersonaStatus()

  return useQuery({
    queryKey: ['persona'],
    queryFn: personaService.getMyPersona,
    enabled: status?.has_persona,
    retry: false,
  })
}

export function useGeneratePersona() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: PersonaGenerateRequest = {}) =>
      personaService.generate(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persona'] })
      queryClient.invalidateQueries({ queryKey: ['personaStatus'] })
    },
  })
}

export function useUpdatePersona() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: PersonaUpdateRequest) =>
      personaService.updateMyPersona(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persona'] })
    },
  })
}

export function useUserPersona(userId: number) {
  return useQuery({
    queryKey: ['persona', userId],
    queryFn: () => personaService.getUserPersona(userId),
    enabled: !!userId,
    retry: false,
  })
}
