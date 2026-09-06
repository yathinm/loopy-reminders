import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { migrateDatabase } from '@/data/database';
import { ReminderProvider } from '@/store/ReminderProvider';
import { colorsFor } from '@/theme/theme';

export default function RootLayout() {
  const scheme = useColorScheme(); const colors = colorsFor(scheme);
  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName="loopy-reminders.db" onInit={migrateDatabase} useSuspense>
        <React.Suspense fallback={<View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.accent} /></View>}>
          <ReminderProvider>
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
            <Stack screenOptions={{ headerTintColor: colors.accent, headerStyle: { backgroundColor: colors.background }, headerShadowVisible: false, contentStyle: { backgroundColor: colors.background }, headerBackButtonDisplayMode: 'minimal' }}>
              <Stack.Screen name="index" options={{ title: 'Loopy Reminders', headerLargeTitle: true }} />
              <Stack.Screen name="list/[id]" options={{ title: 'Reminders' }} />
              <Stack.Screen name="reminder/new" options={{ title: 'New Reminder', presentation: 'modal', headerLeft: () => <Ionicons name="close" size={26} color={colors.accent} /> }} />
              <Stack.Screen name="reminder/[id]" options={{ title: 'Edit Reminder', presentation: 'modal' }} />
              <Stack.Screen name="search" options={{ title: 'Search', headerLargeTitle: true }} />
              <Stack.Screen name="settings" options={{ title: 'Settings', headerLargeTitle: true }} />
              <Stack.Screen name="list-editor" options={{ title: 'List', presentation: 'modal' }} />
            </Stack>
          </ReminderProvider>
        </React.Suspense>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
