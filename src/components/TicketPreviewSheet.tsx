import React, {useMemo, useRef, useState} from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import {Guest} from '../models/Guest';
import {palette} from '../theme/colors';
import {renderTicketToPdf, shareFile} from '../services/PDFService';

interface Props {
  visible: boolean;
  guest?: Guest;
  onClose: () => void;
}

export const TicketPreviewSheet: React.FC<Props> = ({visible, guest, onClose}) => {
  const ticketRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const issuedAt = useMemo(() => {
    if (!guest?.qrIssuedAt) {
      return null;
    }
    return new Date(guest.qrIssuedAt).toLocaleString();
  }, [guest?.qrIssuedAt]);

  const handleShare = async () => {
    if (!guest) {
      return;
    }
    setSharing(true);
    try {
      const pdfPath = await renderTicketToPdf(ticketRef, `${guest.fullName}-ticket`);
      await shareFile(pdfPath);
    } catch (error) {
      console.warn('Failed to share ticket', error);
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={styles.link}>Done</Text>
          </Pressable>
          <Text style={styles.title}>Ticket Preview</Text>
          <Pressable onPress={handleShare} disabled={sharing}>
            <Text style={[styles.link, sharing && styles.disabled]}>Share</Text>
          </Pressable>
        </View>
        {guest ? (
          <View style={styles.content}>
            <View style={styles.ticket} ref={ticketRef}>
              <Text style={styles.eventTitle}>Ticket for {guest.fullName}</Text>
              <View style={styles.qrContainer}>
                {guest.qrPayload && guest.qrSignature ? (
                  <QRCode
                    value={`${guest.qrPayload}.${guest.qrSignature}`}
                    size={220}
                    backgroundColor="#FFFFFF"
                    color="#111827"
                  />
                ) : null}
              </View>
              <Text style={styles.ticketCode}>Code: {guest.ticketCode}</Text>
              {issuedAt ? <Text style={styles.issued}>Issued {issuedAt}</Text> : null}
            </View>
          </View>
        ) : (
          <View style={styles.empty}> 
            <Text style={styles.emptyText}>Select a guest to preview their ticket.</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  link: {
    color: palette.primary,
    fontSize: 16,
  },
  disabled: {
    opacity: 0.4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  ticket: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
  },
  ticketCode: {
    fontSize: 16,
    color: '#111827',
  },
  issued: {
    fontSize: 12,
    color: '#6B7280',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});
