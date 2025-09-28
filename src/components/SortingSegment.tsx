import React from 'react';
import {StyleSheet, View, Pressable, Text} from 'react-native';
import {SortMode} from '../models/Guest';
import {palette} from '../theme/colors';

type Props = {
  value: SortMode;
  onChange: (value: SortMode) => void;
};

const OPTIONS: {label: string; value: SortMode}[] = [
  {label: 'A–Z', value: 'A_TO_Z'},
  {label: 'Z–A', value: 'Z_TO_A'},
  {label: 'Latest', value: 'LATEST'},
];

export const SortingSegment: React.FC<Props> = ({value, onChange}) => {
  return (
    <View style={styles.container}>
      {OPTIONS.map(option => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            onPress={() => onChange(option.value)}
            style={[styles.option, active && styles.active]}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  option: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    color: '#374151',
  },
  active: {
    backgroundColor: palette.primary,
  },
  activeLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
