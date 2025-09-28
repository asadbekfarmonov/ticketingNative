import AsyncStorage from '@react-native-async-storage/async-storage';
import {EventConfig, Guest} from '../models/Guest';

const GUESTS_KEY = 'ticketingNative.guests';
const EVENT_KEY = 'ticketingNative.eventConfig';

export async function loadGuests(): Promise<Guest[]> {
  const raw = await AsyncStorage.getItem(GUESTS_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as Guest[];
  } catch (error) {
    console.warn('Failed to parse guests', error);
    return [];
  }
}

export async function persistGuests(guests: Guest[]): Promise<void> {
  await AsyncStorage.setItem(GUESTS_KEY, JSON.stringify(guests));
}

export async function loadEventConfig(defaultConfig: EventConfig): Promise<EventConfig> {
  const raw = await AsyncStorage.getItem(EVENT_KEY);
  if (!raw) {
    return defaultConfig;
  }
  try {
    return JSON.parse(raw) as EventConfig;
  } catch (error) {
    console.warn('Failed to parse event config', error);
    return defaultConfig;
  }
}

export async function persistEventConfig(config: EventConfig): Promise<void> {
  await AsyncStorage.setItem(EVENT_KEY, JSON.stringify(config));
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove([GUESTS_KEY, EVENT_KEY]);
}
