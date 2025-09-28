import React, {createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef} from 'react';
import {v4 as uuidv4} from 'uuid';
import {EventConfig, FilterMode, Guest, SortMode} from '../models/Guest';
import {
  clearAllData,
  loadEventConfig,
  loadGuests,
  persistEventConfig,
  persistGuests,
} from '../storage/GuestStorage';
import {buildTicketPayload} from '../services/QRCodeService';
import {normalizeName} from '../services/NameNormalizer';

interface GuestsState {
  guests: Guest[];
  sortMode: SortMode;
  filterMode: FilterMode;
  searchTerm: string;
  eventConfig: EventConfig;
  pendingUndo?: Guest;
}

const defaultConfig: EventConfig = {
  eventId: uuidv4(),
  eventName: 'My Event',
  hmacSecret: uuidv4().replace(/-/g, ''),
  keyVersion: 1,
};

const initialState: GuestsState = {
  guests: [],
  sortMode: 'A_TO_Z',
  filterMode: 'ALL',
  searchTerm: '',
  eventConfig: defaultConfig,
};

type Action =
  | {type: 'LOAD'; guests: Guest[]; config: EventConfig}
  | {type: 'SET_SORT'; sort: SortMode}
  | {type: 'SET_FILTER'; filter: FilterMode}
  | {type: 'SET_SEARCH'; term: string}
  | {type: 'ADD_GUEST'; guest: Guest}
  | {type: 'UPDATE_GUEST'; guest: Guest}
  | {type: 'DELETE_GUEST'; guestId: string; guest: Guest}
  | {type: 'CONFIRM_DELETE'}
  | {type: 'TOGGLE_ENTERED'; guestId: string; entered: boolean}
  | {type: 'UPDATE_CONFIG'; config: Partial<EventConfig>}
  | {type: 'SET_TICKETS'; guestId: string; ticket: Guest}
  | {type: 'CLEAR_ALL'; config: EventConfig};

function reducer(state: GuestsState, action: Action): GuestsState {
  switch (action.type) {
    case 'LOAD':
      return {...state, guests: action.guests, eventConfig: action.config};
    case 'SET_SORT':
      return {...state, sortMode: action.sort};
    case 'SET_FILTER':
      return {...state, filterMode: action.filter};
    case 'SET_SEARCH':
      return {...state, searchTerm: action.term};
    case 'ADD_GUEST':
      return {...state, guests: [action.guest, ...state.guests]};
    case 'UPDATE_GUEST':
      return {
        ...state,
        guests: state.guests.map(g => (g.id === action.guest.id ? action.guest : g)),
      };
    case 'DELETE_GUEST':
      return {
        ...state,
        guests: state.guests.filter(g => g.id !== action.guestId),
        pendingUndo: action.guest,
      };
    case 'CONFIRM_DELETE':
      return {...state, pendingUndo: undefined};
    case 'TOGGLE_ENTERED':
      return {
        ...state,
        guests: state.guests.map(guest =>
          guest.id === action.guestId
            ? {
                ...guest,
                entered: action.entered,
                enteredAt: action.entered ? new Date().toISOString() : undefined,
              }
            : guest,
        ),
      };
    case 'UPDATE_CONFIG':
      return {...state, eventConfig: {...state.eventConfig, ...action.config}};
    case 'SET_TICKETS':
      return {
        ...state,
        guests: state.guests.map(guest => (guest.id === action.guestId ? action.ticket : guest)),
      };
    case 'CLEAR_ALL':
      return {...state, guests: [], eventConfig: action.config};
    default:
      return state;
  }
}

interface GuestContextValue {
  state: GuestsState;
  guests: Guest[];
  addGuest: (name: string) => Promise<Guest>;
  editGuest: (id: string, name: string) => Promise<void>;
  deleteGuest: (guest: Guest) => Promise<void>;
  undoDelete: () => Promise<void>;
  toggleEntered: (guest: Guest) => Promise<void>;
  setSortMode: (sort: SortMode) => void;
  setFilterMode: (filter: FilterMode) => void;
  setSearchTerm: (term: string) => void;
  updateEventConfig: (config: Partial<EventConfig>) => Promise<void>;
  generateTicket: (guest: Guest) => Promise<Guest>;
  clearData: () => Promise<void>;
}

const GuestContext = createContext<GuestContextValue | undefined>(undefined);

export const GuestProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const undoTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const guests = await loadGuests();
      const config = await loadEventConfig(defaultConfig);
      dispatch({type: 'LOAD', guests, config});
    })();
  }, []);

  useEffect(() => {
    persistGuests(state.guests);
  }, [state.guests]);

  useEffect(() => {
    persistEventConfig(state.eventConfig);
  }, [state.eventConfig]);

  const sortedGuests = useMemo(() => {
    const filtered = state.guests.filter(guest => {
      if (!state.searchTerm) {
        return true;
      }
      return guest.fullName.toLowerCase().includes(state.searchTerm.toLowerCase());
    });

    const filterMatches = filtered.filter(guest => {
      switch (state.filterMode) {
        case 'ENTERED':
          return guest.entered;
        case 'NOT_ENTERED':
          return !guest.entered;
        default:
          return true;
      }
    });

    const sorted = [...filterMatches];
    if (state.sortMode === 'A_TO_Z') {
      sorted.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } else if (state.sortMode === 'Z_TO_A') {
      sorted.sort((a, b) => b.fullName.localeCompare(a.fullName));
    } else {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return sorted;
  }, [state.guests, state.filterMode, state.searchTerm, state.sortMode]);

  const addGuest = useCallback(
    async (name: string) => {
      const normalized = normalizeName(name);
      const exists = state.guests.some(guest => normalizeName(guest.fullName) === normalized);
      if (exists) {
        throw new Error('Duplicate guest');
      }
      const newGuest: Guest = {
        id: uuidv4(),
        fullName: name.trim(),
        createdAt: new Date().toISOString(),
        entered: false,
      };
      dispatch({type: 'ADD_GUEST', guest: newGuest});
      return newGuest;
    },
    [state.guests],
  );

  const editGuest = useCallback(
    async (id: string, name: string) => {
      const normalized = normalizeName(name);
      const exists = state.guests.some(
        guest => guest.id !== id && normalizeName(guest.fullName) === normalized,
      );
      if (exists) {
        throw new Error('Duplicate guest');
      }
      const guest = state.guests.find(g => g.id === id);
      if (!guest) {
        return;
      }
      dispatch({type: 'UPDATE_GUEST', guest: {...guest, fullName: name.trim()}});
    },
    [state.guests],
  );

  const deleteGuest = useCallback(async (guest: Guest) => {
    if (undoTimeout.current) {
      clearTimeout(undoTimeout.current);
    }
    dispatch({type: 'DELETE_GUEST', guestId: guest.id, guest});
    undoTimeout.current = setTimeout(() => {
      dispatch({type: 'CONFIRM_DELETE'});
    }, 5000);
  }, []);

  const undoDelete = useCallback(async () => {
    if (!state.pendingUndo) {
      return;
    }
    const guest = state.pendingUndo;
    if (undoTimeout.current) {
      clearTimeout(undoTimeout.current);
    }
    dispatch({type: 'ADD_GUEST', guest});
    dispatch({type: 'CONFIRM_DELETE'});
  }, [state.pendingUndo]);

  const toggleEntered = useCallback(async (guest: Guest) => {
    dispatch({type: 'TOGGLE_ENTERED', guestId: guest.id, entered: !guest.entered});
  }, []);

  const setSortMode = useCallback((sort: SortMode) => {
    dispatch({type: 'SET_SORT', sort});
  }, []);

  const setFilterMode = useCallback((filter: FilterMode) => {
    dispatch({type: 'SET_FILTER', filter});
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    dispatch({type: 'SET_SEARCH', term});
  }, []);

  const updateEventConfig = useCallback(
    async (config: Partial<EventConfig>) => {
      dispatch({type: 'UPDATE_CONFIG', config});
    },
    [],
  );

  const generateTicket = useCallback(
    async (guest: Guest) => {
      const ticket = buildTicketPayload(guest, state.eventConfig).guest;
      dispatch({type: 'SET_TICKETS', guestId: guest.id, ticket});
      return ticket;
    },
    [state.eventConfig],
  );

  const clearData = useCallback(async () => {
    await clearAllData();
    const config: EventConfig = {
      eventId: uuidv4(),
      eventName: 'My Event',
      hmacSecret: uuidv4().replace(/-/g, ''),
      keyVersion: 1,
    };
    dispatch({type: 'CLEAR_ALL', config});
  }, []);

  const value = useMemo(
    () => ({
      state,
      guests: sortedGuests,
      addGuest,
      editGuest,
      deleteGuest,
      undoDelete,
      toggleEntered,
      setSortMode,
      setFilterMode,
      setSearchTerm,
      updateEventConfig,
      generateTicket,
      clearData,
    }),
    [
      state,
      sortedGuests,
      addGuest,
      editGuest,
      deleteGuest,
      undoDelete,
      toggleEntered,
      setSortMode,
      setFilterMode,
      setSearchTerm,
      updateEventConfig,
      generateTicket,
      clearData,
    ],
  );

  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>;
};

export function useGuestContext(): GuestContextValue {
  const ctx = useContext(GuestContext);
  if (!ctx) {
    throw new Error('Guest context not found');
  }
  return ctx;
}
