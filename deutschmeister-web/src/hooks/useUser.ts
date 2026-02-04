'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, Settings } from '@/lib/api/users';

export function useProfile() {
  return useQuery({
    queryKey: ['users', 'profile'],
    queryFn: () => usersApi.getProfile(),
    retry: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { name?: string; avatar?: string }) => 
      usersApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'profile'] });
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ['users', 'settings'],
    queryFn: () => usersApi.getSettings(),
    retry: false,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Settings>) => usersApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'settings'] });
    },
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: ['users', 'stats'],
    queryFn: () => usersApi.getStats(),
    retry: false,
  });
}