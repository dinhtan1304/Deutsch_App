import { Stack } from 'expo-router';

export default function MoreLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="topics" />
      <Stack.Screen name="word-bank" />
      <Stack.Screen name="favorites" />
      <Stack.Screen name="history" />
      <Stack.Screen name="review" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="leaderboard" />
      <Stack.Screen name="challenges" />
      <Stack.Screen name="pricing" />
    </Stack>
  );
}
