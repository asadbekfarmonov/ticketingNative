import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {palette} from '../theme/colors';

export type ScanStatus = 'success' | 'duplicate' | 'invalid';

type Props = {
  status: ScanStatus;
  message: string;
  subtitle?: string;
};

export const ScanResultCard: React.FC<Props> = ({status, message, subtitle}) => {
  return (
    <View style={[styles.card, styles[status]]}>
      <Text style={styles.message}>{message}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  success: {
    backgroundColor: palette.success,
  },
  duplicate: {
    backgroundColor: palette.warning,
  },
  invalid: {
    backgroundColor: palette.error,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: '#F3F4F6',
    fontSize: 12,
    marginTop: 4,
  },
});
