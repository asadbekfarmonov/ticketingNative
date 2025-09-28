import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {FilterMode} from '../models/Guest';
import {palette} from '../theme/colors';

type Props = {
  value: FilterMode;
  onChange: (filter: FilterMode) => void;
};

const OPTIONS: {label: string; value: FilterMode}[] = [
  {label: 'All', value: 'ALL'},
  {label: 'Not Entered', value: 'NOT_ENTERED'},
  {label: 'Entered', value: 'ENTERED'},
];

export const FilterPills: React.FC<Props> = ({value, onChange}) => (
  <View style={styles.container}>
    {OPTIONS.map(option => {
      const active = option.value === value;
      return (
        <Pressable
          key={option.value}
          style={[styles.pill, active && styles.active]}
          onPress={() => onChange(option.value)}
        >
          <Text style={[styles.label, active && styles.activeLabel]}>{option.label}</Text>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    color: '#1F2937',
  },
  active: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  activeLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
