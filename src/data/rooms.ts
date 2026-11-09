import type { Room, RoomId } from '@/types';

export const ROOMS: Room[] = [
  { id: 'kitchen', name: 'Kuchnia' },
  { id: 'bathroom', name: 'Łazienka' },
  { id: 'toilet', name: 'Toaleta' },
  { id: 'living', name: 'Salon' },
  { id: 'bedroom', name: 'Sypialnia' },
  { id: 'hallway', name: 'Przedpokój' },
  { id: 'kids', name: 'Pokój dziecięcy' },
  { id: 'utility', name: 'Pomieszczenie gospodarcze' },
  { id: 'balcony', name: 'Balkon lub taras' },
  { id: 'other', name: 'Inne' },
];

export function findRoom(roomId: Room['id']): Room | undefined {
  return ROOMS.find((room) => room.id === roomId);
}

export function hasPlace(places: RoomId[], id: RoomId): boolean {
  return places.includes(id);
}
