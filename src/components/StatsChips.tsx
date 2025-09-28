import React from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {palette} from '../theme/colors';

type Props = {
  total: number;
  entered: number;
};

export const StatsChips: React.FC<Props> = ({total, entered}) => {
  const notEntered = total - entered;
  return (
    <View style={styles.container}>
      <View style={styles.chip}>
        <Text style={styles.label}>Total</Text>
        <Text style={styles.value}>{total}</Text>
      </View>
      <View style={[styles.chip, styles.entered]}>
        <Text style={styles.label}>Entered</Text>
        <Text style={styles.value}>{entered}</Text>
      </View>
      <View style={[styles.chip, styles.pending]}>
        <Text style={styles.label}>Not Entered</Text>
        <Text style={styles.value}>{notEntered}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: '#F2F4F7',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    color: '#4B5563',
  },
  value: {
    fontWeight: '600',
    fontSize: 16,
    color: '#111827',
  },
  entered: {
    borderColor: palette.success,
    borderWidth: 1,
  },
  pending: {
    borderColor: palette.primary,
    borderWidth: 1,
  },
});
