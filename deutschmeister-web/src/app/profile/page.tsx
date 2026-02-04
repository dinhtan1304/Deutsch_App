'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useUserStats } from '@/hooks/useUser';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore();
  const { data: stats, isLoading } = useUserStats();

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="text-6xl mb-6">👤</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sign in to view your profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Track your progress and see your learning statistics.
          </p>
          <Link href="/auth/login">
            <Button size="lg">Sign In</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <Card className="mb-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user?.name || 'User'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {user?.email}
              </p>
            </div>
            <Link href="/settings">
              <Button variant="outline">Edit Profile</Button>
            </Link>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="text-center">
            <div className="text-3xl font-bold text-blue-500">
              {isLoading ? '-' : stats?.gamesPlayed || 0}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Games Played</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-green-500">
              {isLoading ? '-' : `${stats?.accuracy || 0}%`}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Accuracy</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-yellow-500">
              {isLoading ? '-' : stats?.favorites || 0}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Favorites</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-purple-500">
              {isLoading ? '-' : stats?.wordsLearned || 0}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Words Learned</div>
          </Card>
        </div>

        {/* Detailed Stats */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            📊 Learning Statistics
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <span className="text-gray-600 dark:text-gray-400">Total Answers</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {stats?.totalAnswers || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <span className="text-gray-600 dark:text-gray-400">Correct Answers</span>
              <span className="font-bold text-green-500">
                {stats?.correctAnswers || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <span className="text-gray-600 dark:text-gray-400">Wrong Answers</span>
              <span className="font-bold text-red-500">
                {stats?.wrongAnswers || 0}
              </span>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Link href="/games">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <div className="flex items-center gap-4">
                <span className="text-3xl">🎮</span>
                <div>
                  <div className="font-bold">Play Games</div>
                  <div className="text-white/80 text-sm">Practice articles</div>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/words">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-r from-green-500 to-green-600 text-white">
              <div className="flex items-center gap-4">
                <span className="text-3xl">📚</span>
                <div>
                  <div className="font-bold">Browse Words</div>
                  <div className="text-white/80 text-sm">Learn new vocabulary</div>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}