import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useFonts } from 'expo-font';

function RootLayoutInner() {
  const { session, loading } = useAuth();

  if (loading) return null; // or show a splash screen

  return (
    <>
      {session ? (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="auth" />
        </Stack>
      )}
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  // Load your font
  const [fontsLoaded] = useFonts({
    Outfit: require('../assets/fonts/Outfit-Variable.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <RootLayoutInner />
    </AuthProvider>
  );
}
