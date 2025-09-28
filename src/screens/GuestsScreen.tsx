import React, {useMemo, useState} from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useGuests} from '../hooks/useGuests';
import {Guest} from '../models/Guest';
import {StatsChips} from '../components/StatsChips';
import {SortingSegment} from '../components/SortingSegment';
import {FilterPills} from '../components/FilterPills';
import {GuestRow} from '../components/GuestRow';
import {AddGuestModal} from '../components/AddGuestModal';
import {TicketPreviewSheet} from '../components/TicketPreviewSheet';
import {GuestsStackParamList} from '../navigation/types';

export const GuestsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<GuestsStackParamList>>();
  const {
    guests,
    state,
    addGuest,
    editGuest,
    deleteGuest,
    undoDelete,
    toggleEntered,
    setSortMode,
    setFilterMode,
    setSearchTerm,
    generateTicket,
  } = useGuests();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | undefined>();
  const [previewGuest, setPreviewGuest] = useState<Guest | undefined>();

  const summary = useMemo(() => {
    const total = state.guests.length;
    const entered = state.guests.filter(guest => guest.entered).length;
    return {total, entered};
  }, [state.guests]);

  const openAddModal = () => {
    setEditingGuest(undefined);
    setModalVisible(true);
  };

  const openEditModal = (guest: Guest) => {
    setEditingGuest(guest);
    setModalVisible(true);
  };

  const handleSubmit = async (name: string) => {
    if (editingGuest) {
      await editGuest(editingGuest.id, name);
    } else {
      await addGuest(name);
    }
  };

  const handleTicket = async (guest: Guest) => {
    const updated = await generateTicket(guest);
    setPreviewGuest(updated);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Guests</Text>
            <Pressable accessibilityLabel="Undo delete" onPress={undoDelete}>
              <Ionicons name="arrow-undo-outline" size={22} color="#111827" />
            </Pressable>
          </View>
          <Pressable accessibilityLabel="Settings" onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={22} color="#111827" />
          </Pressable>
        </View>
        <StatsChips total={summary.total} entered={summary.entered} />
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color="#6B7280" />
          <TextInput
            placeholder="Search guests..."
            style={styles.searchInput}
            value={state.searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        <SortingSegment value={state.sortMode} onChange={setSortMode} />
        <FilterPills value={state.filterMode} onChange={setFilterMode} />
        <FlatList
          data={guests}
          keyExtractor={item => item.id}
          contentContainerStyle={guests.length === 0 && styles.emptyContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No guests yet</Text>
              <Text style={styles.emptySubtitle}>Import from Excel or add manually</Text>
              <Pressable style={styles.primaryButton} onPress={openAddModal}>
                <Text style={styles.primaryLabel}>Add Guest</Text>
              </Pressable>
            </View>
          }
          renderItem={({item}) => (
            <GuestRow
              guest={item}
              onToggle={toggleEntered}
              onDelete={deleteGuest}
              onEdit={openEditModal}
              onTicket={handleTicket}
            />
          )}
        />
        <Pressable style={styles.fab} onPress={openAddModal}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </Pressable>
        <AddGuestModal
          visible={modalVisible}
          title={editingGuest ? 'Edit Guest' : 'Add Guest'}
          initialName={editingGuest?.fullName}
          onClose={() => setModalVisible(false)}
          onSubmit={handleSubmit}
        />
        <TicketPreviewSheet
          visible={!!previewGuest}
          guest={previewGuest}
          onClose={() => setPreviewGuest(undefined)}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  primaryButton: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E88E5',
    elevation: 4,
  },
});
