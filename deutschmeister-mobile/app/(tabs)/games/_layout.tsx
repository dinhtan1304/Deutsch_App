import { Stack } from 'expo-router';

export default function GamesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="setup" />
      <Stack.Screen name="quick-quiz" />
      <Stack.Screen name="flashcards" />
      <Stack.Screen name="gender-quiz" />
      <Stack.Screen name="matching" />
      <Stack.Screen name="timed-challenge" />
      <Stack.Screen name="fill-blank" />
      <Stack.Screen name="spelling" />
      <Stack.Screen name="listening" />
    </Stack>
  );
}
