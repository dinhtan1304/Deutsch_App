'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, UpdateSettingsPayload, UpdateProfilePayload, User } from '@/lib/api/users';
import { useAuthStore } from '@/stores/authStore';

export function useProfile() {
  return useQuery({
    queryKey: ['users', 'profile'],
    queryFn: () => usersApi.getProfile(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfilePayload) =>
      usersApi.updateProfile(data),
    onSuccess: (updatedUser: User) => {
      queryClient.invalidateQueries({ queryKey: ['users', 'profile'] });
      // Sync updated profile fields to authStore so header/profile reflect
      // the change immediately without re-login. Merge to preserve role etc.
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setUser({
          ...currentUser,
          name: updatedUser.name,
          avatar: updatedUser.avatar,
          bio: updatedUser.bio,
          coverImage: updatedUser.coverImage,
          isPublic: updatedUser.isPublic,
        });
      }
    },
  });
}

export function usePublicProfile(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['users', 'public', userId],
    queryFn: () => usersApi.getPublicProfile(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
    retry: false,
  });
}

export function useUploadAvatar() {
  return useMutation({
    mutationFn: (file: File) => usersApi.uploadAvatar(file),
  });
}

export function useUploadCover() {
  return useMutation({
    mutationFn: (file: File) => usersApi.uploadCover(file),
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ['users', 'settings'],
    queryFn: () => usersApi.getSettings(),
    staleTime: 10 * 60 * 1000,
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
    staleTime: 2 * 60 * 1000,
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