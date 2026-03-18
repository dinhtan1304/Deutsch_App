import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWord } from '@/hooks/useWords';
import WordDetail from '@/components/words/WordDetail';

export default function WordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: word, isLoading, isError, error } = useWord(id!);

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="mr-3 rounded-full bg-dark-card p-2 active:opacity-70"
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-white" numberOfLines={1}>
          Word Detail
        </Text>
      </View>

      {/* Content */}
      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="mt-3 text-gray-400">Loading word...</Text>
        </View>
      )}

      {isError && (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="warning-outline" size={48} color="#EF4444" />
          <Text className="mt-3 text-center text-base text-gray-400">
            Failed to load word
          </Text>
          <Text className="mt-1 text-center text-sm text-gray-500">
            {(error as Error)?.message || 'Unknown error'}
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-4 rounded-xl bg-primary-500 px-6 py-3"
          >
            <Text className="font-semibold text-white">Go Back</Text>
          </Pressable>
        </View>
      )}

      {word && <WordDetail word={word} />}
    </SafeAreaView>
  );
}
