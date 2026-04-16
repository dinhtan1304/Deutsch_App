'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, UpdateSettingsPayload, User } from '@/lib/api/users';
import { useAuthStore } from '@/stores/authStore';

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
    onSuccess: (updatedUser: User) => {
      queryClient.invalidateQueries({ queryKey: ['users', 'profile'] });
      // Sync updated name/avatar to authStore so the navbar/header
      // reflects the change immediately without requiring re-login.
      // Merge into current user to preserve fields (role, etc.) not
      // returned by the update endpoint.
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setUser({
          ...currentUser,
          name: updatedUser.name,
          avatar: updatedUser.avatar,
        });
      }
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
    mutationFn: (data: UpdateSettingsPayload) => usersApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'settings'] });
    },
  });
}

export function useUserStats(enabled = true) {
  return useQuery({
    queryKey: ['users', 'stats'],
    queryFn: () => usersApi.getStats(),
    retry: false,
    enabled,
  });
}

export function useSkills(enabled = true) {
  return useQuery({
    queryKey: ['users', 'skills'],
    queryFn: () => usersApi.getSkills(),
    staleTime: 10 * 60 * 1000,
    enabled,
  });
}