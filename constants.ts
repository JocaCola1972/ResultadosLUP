
import { ResultType, ShiftID } from './types';

export const POINTS_MAP: Record<ResultType, number> = {
  [ResultType.WIN]: 4,
  [ResultType.DRAW]: 2,
  [ResultType.LOSS]: 1,
};

export const SHIFTS = [
  ShiftID.SHIFT_1,
  ShiftID.SHIFT_2,
  ShiftID.SHIFT_3,
];

export const ADMIN_CODE = "admin123";

export const MASTER_ADMIN = {
  username: 'JocaCola',
  password: 'JocaScoreLuP25'
};
