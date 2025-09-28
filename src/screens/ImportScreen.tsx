import React, {useState} from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import {useGuests} from '../hooks/useGuests';
import {extractNamesFromFile, dedupeAgainstGuests} from '../services/GuestImportService';

export const ImportScreen: React.FC = () => {
  const {state, addGuest, generateTicket} = useGuests();
  const [loading, setLoading] = useState(false);
  const [names, setNames] = useState<string[]>([]);
  const [duplicates, setDuplicates] = useState<string[]>([]);
  const [normalize, setNormalize] = useState(true);
  const [autoTickets, setAutoTickets] = useState(false);
  const [status, setStatus] = useState<string | undefined>();

  const handlePick = async () => {
    try {
      setStatus(undefined);
      const file = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.xlsx, DocumentPicker.types.csv, DocumentPicker.types.plainText],
      });
      setLoading(true);
      const extracted = await extractNamesFromFile(file.uri);
      const filtered = dedupeAgainstGuests(extracted, state.guests);
      setNames(filtered.names);
      setDuplicates(filtered.duplicates);
      setStatus(`Ready to import ${filtered.names.length} guests (${filtered.duplicates.length} duplicates skipped)`);
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        setStatus('Failed to read file');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      for (const raw of names) {
        const name = normalize ? raw.trim().replace(/\s+/g, ' ') : raw;
        const added = await addGuest(name);
        if (autoTickets) {
          await generateTicket(added);
        }
      }
      setStatus(`Imported ${names.length} guests (${duplicates.length} duplicates skipped)`);
      setNames([]);
      setDuplicates([]);
    } catch (error) {
      setStatus('Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Import</Text>
        <Pressable style={styles.primaryButton} onPress={handlePick} disabled={loading}>
          <Text style={styles.primaryLabel}>{loading ? 'Processing…' : 'Select File'}</Text>
        </Pressable>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Normalize names</Text>
          <Switch value={normalize} onValueChange={setNormalize} />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Generate QR for new guests</Text>
          <Switch value={autoTickets} onValueChange={setAutoTickets} />
        </View>
        {status ? <Text style={styles.status}>{status}</Text> : null}
        {names.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Preview</Text>
            {names.slice(0, 10).map(name => (
              <Text key={name} style={styles.previewRow}>
                {name}
              </Text>
            ))}
          </View>
        ) : null}
        {duplicates.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Duplicates skipped</Text>
            {duplicates.slice(0, 10).map(name => (
              <Text key={name} style={styles.duplicate}>
                {name}
              </Text>
            ))}
          </View>
        ) : null}
        <Pressable
          style={[styles.primaryButton, names.length === 0 && styles.disabled]}
          onPress={handleImport}
          disabled={names.length === 0 || loading}
        >
          <Text style={styles.primaryLabel}>Import Guests</Text>
        </Pressable>
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
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 16,
  },
  status: {
    fontSize: 14,
    color: '#374151',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  previewRow: {
    fontSize: 16,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  duplicate: {
    fontSize: 14,
    color: '#C62828',
  },
  disabled: {
    opacity: 0.4,
  },
});
