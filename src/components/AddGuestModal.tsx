import React, {useEffect, useState} from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
} from 'react-native';
import {palette} from '../theme/colors';

interface Props {
  visible: boolean;
  title: string;
  initialName?: string;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void> | void;
}

export const AddGuestModal: React.FC<Props> = ({visible, title, initialName, onClose, onSubmit}) => {
  const [name, setName] = useState(initialName ?? '');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    setName(initialName ?? '');
  }, [initialName, visible]);

  const handleSubmit = async () => {
    try {
      await onSubmit(name);
      onClose();
      setName('');
      setError(undefined);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <Pressable accessibilityLabel="Close" onPress={onClose}>
            <Text style={styles.link}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>{title}</Text>
          <Pressable
            accessibilityLabel="Save"
            onPress={handleSubmit}
            disabled={!name.trim()}
          >
            <Text style={[styles.link, !name.trim() && styles.disabled]}>Save</Text>
          </Pressable>
        </View>
        <View style={styles.content}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Guest name"
            style={styles.input}
            autoFocus
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  link: {
    color: palette.primary,
    fontSize: 16,
  },
  disabled: {
    opacity: 0.4,
  },
  content: {
    paddingHorizontal: 20,
    gap: 12,
  },
  label: {
    fontSize: 14,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  error: {
    color: palette.error,
    fontSize: 14,
  },
});
