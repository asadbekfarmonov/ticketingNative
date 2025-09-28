import {useGuestContext} from '../context/GuestProvider';

export function useGuests() {
  const ctx = useGuestContext();
  return ctx;
}
