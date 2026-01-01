
import { User, MatchRecord, ShiftConfig, ShiftID } from '../types';

const USERS_KEY = 'padel_users';
const RECORDS_KEY = 'padel_records';
const SHIFT_CONFIGS_KEY = 'padel_shift_configs';

export const storage = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveUser: (user: User) => {
    const users = storage.getUsers();
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },
  getRecords: (): MatchRecord[] => {
    const data = localStorage.getItem(RECORDS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveRecord: (record: MatchRecord) => {
    const records = storage.getRecords();
    records.push(record);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  },
  deleteRecord: (id: string) => {
    const records = storage.getRecords();
    const filtered = records.filter(r => r.id !== id);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(filtered));
  },
  getShiftConfigs: (): Record<string, number> => {
    const data = localStorage.getItem(SHIFT_CONFIGS_KEY);
    return data ? JSON.parse(data) : {};
  },
  saveShiftConfigs: (configs: Record<string, number>) => {
    localStorage.setItem(SHIFT_CONFIGS_KEY, JSON.stringify(configs));
  }
};
