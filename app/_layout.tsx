import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { migrateDatabase } from '@/data/database';
import { ReminderProvider, useReminders } from '@/store/ReminderProvider';
import { colorsFor } from '@/theme/theme';

export default function RootLayout() {
  const scheme = useColorScheme(); const colors = colorsFor(scheme);
  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName="loopy-reminders.db" onInit={migrateDatabase} useSuspense>
        <React.Suspense fallback={<View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.accent} /></View>}>
          <ReminderProvider>
            <AppNavigator />
          </ReminderProvider>
        </React.Suspense>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}

function AppNavigator() {
  const scheme = useColorScheme(); const colors = colorsFor(scheme); const { loading } = useReminders();
  if (loading) return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.accent} /></View>;
  return <><StatusBar style={scheme === 'dark' ? 'light' : 'dark'} /><Stack screenOptions={{ headerTintColor: colors.accent, headerStyle: { backgroundColor: colors.background }, headerShadowVisible: false, contentStyle: { backgroundColor: colors.background }, headerBackButtonDisplayMode: 'minimal' }}><Stack.Screen name="index" options={{ title: 'Loopy Reminders' }} /><Stack.Screen name="list/[id]" options={{ title: 'Reminders' }} /><Stack.Screen name="reminder/new" options={{ title: 'New Reminder', presentation: 'modal' }} /><Stack.Screen name="reminder/[id]" options={{ title: 'Edit Reminder', presentation: 'modal' }} /><Stack.Screen name="search" options={{ title: 'Search' }} /><Stack.Screen name="settings" options={{ title: 'Settings', headerLargeTitle: true }} /><Stack.Screen name="list-editor" options={{ title: 'List', presentation: 'modal' }} /></Stack></>;
}
const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
