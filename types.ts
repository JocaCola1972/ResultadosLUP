export enum ResultType {
  WIN = 'Vitória',
  DRAW = 'Empate',
  LOSS = 'Derrota'
}

export enum ShiftID {
  SHIFT_1 = '08:00 - 09:30',
  SHIFT_2 = '09:30 - 11:00',
  SHIFT_3 = '11:00 - 13:00'
}

export interface User {
  id: string;
  name: string;
  phone: string; // Changed from email to phone
  password?: string;
  isAdmin: boolean;
}

export interface MatchRecord {
  id: string;
  userId: string;
  userName: string;
  date: string; // ISO String (YYYY-MM-DD)
  shift: ShiftID;
  results: ResultType[];
  points: number;
}

export interface ShiftConfig {
  shiftId: ShiftID;
  maxGames: number;
}

export interface AppState {
  currentUser: User | null;
  records: MatchRecord[];
}