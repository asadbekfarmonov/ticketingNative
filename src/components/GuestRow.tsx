import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Guest} from '../models/Guest';
import {palette} from '../theme/colors';
import {Ionicons} from '@expo/vector-icons';

type Props = {
  guest: Guest;
  onToggle: (guest: Guest) => void;
  onEdit: (guest: Guest) => void;
  onDelete: (guest: Guest) => void;
  onTicket: (guest: Guest) => void;
};

export const GuestRow: React.FC<Props> = ({guest, onToggle, onEdit, onDelete, onTicket}) => {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.name}>{guest.fullName}</Text>
        <Text style={styles.meta}>{guest.ticketCode ?? 'No ticket yet'}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityLabel="Toggle entered" onPress={() => onToggle(guest)}>
          <View style={[styles.statusDot, guest.entered && styles.entered]} />
        </Pressable>
        <Pressable accessibilityLabel="Edit" onPress={() => onEdit(guest)}>
          <Ionicons name="create-outline" size={20} color={palette.primary} />
        </Pressable>
        <Pressable accessibilityLabel="Ticket" onPress={() => onTicket(guest)}>
          <Ionicons name="qr-code-outline" size={20} color={palette.primary} />
        </Pressable>
        <Pressable accessibilityLabel="Delete" onPress={() => onDelete(guest)}>
          <Ionicons name="trash-outline" size={20} color={palette.error} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  meta: {
    fontSize: 12,
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#9CA3AF',
  },
  entered: {
    borderColor: palette.success,
    backgroundColor: palette.success,
  },
});
