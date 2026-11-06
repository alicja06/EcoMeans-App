import type { Room } from '@/types';

export const ROOMS: Room[] = [
  { id: 'kitchen', name: 'Kuchnia' },
  { id: 'bathroom', name: 'Łazienka' },
  { id: 'living', name: 'Salon' },
  { id: 'bedroom', name: 'Sypialnia' },
  { id: 'hallway', name: 'Przedpokój' },
  { id: 'other', name: 'Inne pomieszczenia' },
];

export function findRoom(roomId: Room['id']): Room | undefined {
  return ROOMS.find((room) => room.id === roomId);
}
