import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppFrame } from '@/components/AppFrame';
import { migrateDatabase } from '@/data/database';
import { ReminderProvider, useReminders } from '@/store/ReminderProvider';
import { colorsFor } from '@/theme/theme';

export default function RootLayout() {
  const scheme = useColorScheme(); const colors = colorsFor(scheme);
  return (
    <SafeAreaProvider>
      <AppFrame>
        <SQLiteProvider databaseName="loopy-reminders.db" onInit={migrateDatabase} useSuspense>
          <React.Suspense fallback={<View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.accent} /></View>}>
            <ReminderProvider>
              <AppNavigator />
            </ReminderProvider>
          </React.Suspense>
        </SQLiteProvider>
      </AppFrame>
    </SafeAreaProvider>
  );
}

function AppNavigator() {
  const scheme = useColorScheme(); const colors = colorsFor(scheme); const { loading } = useReminders();
  if (loading) return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.accent} /></View>;
  const desktopWeb = Platform.OS === 'web';
  return <><StatusBar style={scheme === 'dark' ? 'light' : 'dark'} /><Stack screenOptions={{ headerTintColor: colors.accent, headerStyle: { backgroundColor: colors.background, ...(desktopWeb ? { height: 68 } : {}) }, headerShadowVisible: false, contentStyle: { backgroundColor: colors.background }, headerBackButtonDisplayMode: 'minimal', headerBackVisible: Platform.OS !== 'web', headerLeft: desktopWeb ? () => <DesktopBackButton color={colors.accent} /> : undefined }}><Stack.Screen name="index" options={{ title: 'Loopy Reminders' }} /><Stack.Screen name="list/[id]" options={{ title: 'Reminders' }} /><Stack.Screen name="recently-deleted" options={{ title: 'Recently Deleted' }} /><Stack.Screen name="reminder/new" options={{ title: 'New Reminder', presentation: 'modal' }} /><Stack.Screen name="reminder/[id]" options={{ title: 'Edit Reminder', presentation: 'modal' }} /><Stack.Screen name="search" options={{ title: 'Search' }} /><Stack.Screen name="settings" options={{ title: 'Settings', headerLargeTitle: true }} /><Stack.Screen name="list-editor" options={{ title: 'List', presentation: 'modal' }} /></Stack></>;
}

function DesktopBackButton({ color }: { color: string }) {
  const router = useRouter();
  if (!router.canGoBack()) return null;
  return <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={{ marginLeft: 16, padding: 8 }}><Ionicons name="arrow-back" size={27} color={color} /></Pressable>;
}
const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
