import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '@/lib/api/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Vui long nhap dia chi email.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setIsSuccess(true);
    } catch (err: any) {
      setError(
        err.message || 'Gui email that bai. Vui long thu lai.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity
            className="flex-row items-center mb-8"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#9CA3AF" />
            <Text className="text-gray-400 text-sm ml-1">Quay lai</Text>
          </TouchableOpacity>

          {/* Icon */}
          <View className="items-center mb-6">
            <View className="w-16 h-16 rounded-full bg-primary-500/20 items-center justify-center mb-4">
              <Ionicons name="key-outline" size={28} color="#818CF8" />
            </View>
            <Text className="text-white text-2xl font-bold mb-2">
              Quen mat khau?
            </Text>
            <Text className="text-gray-400 text-sm text-center leading-5">
              Nhap dia chi email cua ban va chung toi se gui cho ban link dat lai mat khau.
            </Text>
          </View>

          {isSuccess ? (
            /* Success state */
            <View className="bg-green-500/10 border border-green-500/25 rounded-2xl p-5 items-center">
              <View className="w-12 h-12 rounded-full bg-green-500/20 items-center justify-center mb-3">
                <Ionicons name="checkmark-circle" size={28} color="#4ADE80" />
              </View>
              <Text className="text-green-400 text-base font-semibold mb-2">
                Da gui email!
              </Text>
              <Text className="text-gray-400 text-sm text-center leading-5 mb-4">
                Vui long kiem tra hop thu{' '}
                <Text className="text-white font-medium">{email}</Text> va lam
                theo huong dan de dat lai mat khau.
              </Text>
              <TouchableOpacity
                className="h-11 rounded-xl bg-primary-500 items-center justify-center px-6"
                onPress={() => router.replace('/(auth)/login')}
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-sm">
                  Quay lai dang nhap
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Form state */
            <View>
              {/* Error Message */}
              {error ? (
                <View className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25">
                  <Text className="text-red-400 text-xs leading-5">
                    {error}
                  </Text>
                </View>
              ) : null}

              {/* Email Field */}
              <View className="mb-6">
                <Text className="text-gray-300 text-xs font-semibold mb-2">
                  Dia chi email
                </Text>
                <View className="flex-row items-center bg-dark-card rounded-xl border border-dark-border px-3 h-12">
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color="#9CA3AF"
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    className="flex-1 text-white text-sm"
                    placeholder="your@email.com"
                    placeholderTextColor="#6B7280"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                  />
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                className="h-12 rounded-xl bg-primary-500 items-center justify-center flex-row"
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.8}
                style={isLoading ? { opacity: 0.6 } : undefined}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator color="white" size="small" />
                    <Text className="text-white font-bold text-sm ml-2">
                      Dang gui...
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="send-outline" size={18} color="white" />
                    <Text className="text-white font-bold text-sm ml-2">
                      Gui link dat lai
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Back to login link */}
              <TouchableOpacity
                className="items-center mt-6"
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text className="text-gray-400 text-sm">
                  Quay lai{' '}
                  <Text className="text-primary-400 font-semibold">
                    Dang nhap
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
