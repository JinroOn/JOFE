import type { Major } from '../types/major';
import api from './axios';

export const getMajor = (majorId: number) =>
  api.get<Major>(`/majors/${majorId}`).then((r) => r.data);
