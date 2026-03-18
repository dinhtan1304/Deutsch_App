import { Stack } from 'expo-router';

export default function PracticeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="reading" />
      <Stack.Screen name="writing" />
      <Stack.Screen name="listening" />
      <Stack.Screen name="speaking" />
      <Stack.Screen name="grammar" />
      <Stack.Screen name="grammar-lesson" />
    </Stack>
  );
}
