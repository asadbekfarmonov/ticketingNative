import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Pressable, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {Camera, useCameraDevices} from 'react-native-vision-camera';
import {useScanBarcodes, BarcodeFormat} from 'vision-camera-code-scanner';
import HapticFeedback from 'react-native-haptic-feedback';
import {Ionicons} from '@expo/vector-icons';
import {useGuests} from '../hooks/useGuests';
import {parseTicket, verifyTicket} from '../services/QRCodeService';
import {formatDateTime} from '../utils/format';
import {ScanResultCard, ScanStatus} from '../components/ScanResultCard';

interface HistoryItem {
  id: string;
  name: string;
  status: ScanStatus;
  timestamp: string;
  message: string;
  detail?: string;
}

export const ScanScreen: React.FC = () => {
  const {state, toggleEntered} = useGuests();
  const devices = useCameraDevices();
  const device = devices.back;
  const [hasPermission, setHasPermission] = useState(false);
  const [torch, setTorch] = useState(false);
  const recentTokens = useRef(new Set<string>());
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [frameProcessor, barcodes] = useScanBarcodes([BarcodeFormat.QR_CODE], {
    checkInverted: true,
  });

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized');
    })();
  }, []);

  const pushHistory = useCallback((item: HistoryItem) => {
    setHistory(prev => [item, ...prev].slice(0, 20));
  }, []);

  const processTicket = useCallback(
    (rawValue: string) => {
      if (recentTokens.current.has(rawValue)) {
        return;
      }
      recentTokens.current.add(rawValue);
      setTimeout(() => recentTokens.current.delete(rawValue), 3000);

      const parts = rawValue.split('.');
      if (parts.length < 3) {
        pushHistory({
          id: rawValue,
          name: 'Unknown',
          status: 'invalid',
          timestamp: new Date().toISOString(),
          message: 'Invalid QR format',
        });
        HapticFeedback.trigger('notificationError');
        return;
      }
      const signature = parts.pop()!;
      const token = parts.join('.');
      if (!verifyTicket(token, signature, state.eventConfig)) {
        pushHistory({
          id: rawValue,
          name: 'Unknown',
          status: 'invalid',
          timestamp: new Date().toISOString(),
          message: 'Invalid or tampered ticket',
        });
        HapticFeedback.trigger('notificationError');
        return;
      }

      try {
        const {payload} = parseTicket(token);
        const guest = state.guests.find(g => g.id === payload.gid);
        if (!guest) {
          pushHistory({
            id: rawValue,
            name: 'Unknown',
            status: 'invalid',
            timestamp: new Date().toISOString(),
            message: 'Guest not found',
          });
          HapticFeedback.trigger('notificationError');
          return;
        }
        if (guest.entered) {
          pushHistory({
            id: guest.id,
            name: guest.fullName,
            status: 'duplicate',
            timestamp: new Date().toISOString(),
            message: 'Already checked in',
            detail: formatDateTime(guest.enteredAt),
          });
          HapticFeedback.trigger('notificationWarning');
          return;
        }
        const now = new Date().toISOString();
        toggleEntered(guest);
        pushHistory({
          id: guest.id,
          name: guest.fullName,
          status: 'success',
          timestamp: now,
          message: 'Admitted',
          detail: payload.tc ? `Ticket ${payload.tc}` : undefined,
        });
        HapticFeedback.trigger('notificationSuccess');
      } catch (error) {
        pushHistory({
          id: rawValue,
          name: 'Unknown',
          status: 'invalid',
          timestamp: new Date().toISOString(),
          message: 'Failed to decode ticket',
        });
        HapticFeedback.trigger('notificationError');
      }
    },
    [pushHistory, state.eventConfig, state.guests, toggleEntered],
  );

  useEffect(() => {
    barcodes.forEach(code => {
      if (code.rawValue) {
        processTicket(code.rawValue);
      }
    });
  }, [barcodes, processTicket]);

  const latestResult = history[0];

  const renderHistory = useMemo(
    () =>
      history.map(item => (
        <View key={`${item.id}-${item.timestamp}`} style={styles.historyRow}>
          <Text style={styles.historyName}>{item.name}</Text>
          <Text style={styles.historyMeta}>{item.message}</Text>
          {item.detail ? <Text style={styles.historyMeta}>{item.detail}</Text> : null}
          <Text style={styles.historyMeta}>{formatDateTime(item.timestamp)}</Text>
        </View>
      )),
    [history],
  );

  if (!device || !hasPermission) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera access required</Text>
          <Text style={styles.permissionSubtitle}>
            Enable camera permissions in Settings to scan guest tickets.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.cameraContainer}>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive
            torch={torch ? 'on' : 'off'}
            frameProcessor={frameProcessor}
            frameProcessorFps={5}
          />
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>Scan Tickets</Text>
            <Pressable style={styles.torch} onPress={() => setTorch(prev => !prev)}>
              <Ionicons name={torch ? 'flash' : 'flash-off'} size={24} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
        <View style={styles.results}>
          {latestResult ? (
            <ScanResultCard
              status={latestResult.status}
              message={
                latestResult.status === 'success'
                  ? `Admitted: ${latestResult.name}`
                  : latestResult.message
              }
              subtitle={
                latestResult.status === 'success'
                  ? latestResult.detail ?? latestResult.message
                  : latestResult.detail
              }
            />
          ) : null}
          <Text style={styles.historyTitle}>Recent scans</Text>
          <View>{renderHistory}</View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  cameraContainer: {
    height: '55%',
    backgroundColor: '#000000',
  },
  overlay: {
    position: 'absolute',
    top: 32,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overlayTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  torch: {
    backgroundColor: '#1E88E5',
    padding: 12,
    borderRadius: 24,
  },
  results: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  historyTitle: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  historyRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#374151',
    paddingVertical: 8,
  },
  historyName: {
    color: '#F3F4F6',
    fontSize: 16,
    fontWeight: '600',
  },
  historyMeta: {
    color: '#D1D5DB',
    fontSize: 12,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  permissionSubtitle: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
  },
});
