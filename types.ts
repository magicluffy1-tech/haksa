
export enum EventCategory {
  EVENT = 'event',
  HOLIDAY = 'holiday'
}

export interface SchoolEvent {
  id?: string; // 수동 등록 시 식별을 위한 ID
  title: string;
  date: number;
  month: number;
  year: number;
  category: EventCategory;
  isRange?: boolean;
  isManual?: boolean; // 수동으로 등록된 일정인지 여부
}

export interface WeeklyData {
  month: number;
  weekNum: number;
  days: (number | null)[];
  events: SchoolEvent[];
  schoolDays: number;
  year: number;
}

export interface DashboardStats {
  totalSchoolDays: number;
  totalEvents: number;
  totalHolidays: number;
  monthlySchoolDays: { month: string; days: number }[];
  categoryDistribution: { name: string; value: number }[];
}

export type TabType = 'dashboard' | 'calendar' | 'list' | 'settings';
