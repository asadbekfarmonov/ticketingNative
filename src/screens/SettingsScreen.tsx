import React, {useState} from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {v4 as uuidv4} from 'uuid';
import {useGuests} from '../hooks/useGuests';

export const SettingsScreen: React.FC = () => {
  const {state, updateEventConfig, clearData} = useGuests();
  const [showSecret, setShowSecret] = useState(false);
  const [eventName, setEventName] = useState(state.eventConfig.eventName);

  const handleSave = async () => {
    await updateEventConfig({eventName});
  };

  const handleRegenerate = async () => {
    Alert.alert('Regenerate Secret', 'Issue new secret? Existing tickets may become invalid.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Regenerate',
        style: 'destructive',
        onPress: async () => {
          await updateEventConfig({
            hmacSecret: uuidv4().replace(/-/g, ''),
            keyVersion: state.eventConfig.keyVersion + 1,
          });
        },
      },
    ]);
  };

  const handleExport = async () => {
    const rows = [
      ['Full Name', 'Entered', 'Entered At', 'Ticket Code'],
      ...state.guests.map(guest => [
        guest.fullName,
        guest.entered ? 'Yes' : 'No',
        guest.enteredAt ?? '',
        guest.ticketCode ?? '',
      ]),
    ];
    const csv = rows
      .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const filePath = `${FileSystem.cacheDirectory}guests.csv`;
    await FileSystem.writeAsStringAsync(filePath, csv, {encoding: FileSystem.EncodingType.UTF8});
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath);
    }
  };

  const handleClear = () => {
    Alert.alert('Clear all data', 'This will remove all guests and secrets.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => clearData(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event</Text>
          <Text style={styles.label}>Event name</Text>
          <TextInput
            style={styles.input}
            value={eventName}
            onChangeText={setEventName}
            onBlur={handleSave}
          />
          <Text style={styles.label}>HMAC Secret</Text>
          <Pressable onPress={() => setShowSecret(prev => !prev)}>
            <Text style={styles.secret}>
              {showSecret ? state.eventConfig.hmacSecret : '••••••••••••'}
            </Text>
          </Pressable>
          <Pressable style={styles.button} onPress={handleRegenerate}>
            <Text style={styles.buttonLabel}>Regenerate Secret</Text>
          </Pressable>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <Pressable style={styles.button} onPress={handleExport}>
            <Text style={styles.buttonLabel}>Export guests (CSV)</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.danger]} onPress={handleClear}>
            <Text style={styles.buttonLabel}>Clear all data</Text>
          </Pressable>
        </View>
        <Text style={styles.meta}>Version 1.0 • Offline-first, no analytics.</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    padding: 20,
    gap: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  section: {
    backgroundColor: '#F3F4F6',
    padding: 20,
    borderRadius: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    color: '#4B5563',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  secret: {
    fontFamily: 'Menlo',
    backgroundColor: '#E5E7EB',
    padding: 12,
    borderRadius: 12,
  },
  button: {
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  danger: {
    backgroundColor: '#C62828',
  },
  meta: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
