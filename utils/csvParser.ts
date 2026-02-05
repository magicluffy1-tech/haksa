
import { WeeklyData, EventCategory, SchoolEvent } from '../types';

const splitCSVLine = (text: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

// 휴업일 여부 판단 로직
const isHolidayTitle = (title: string): boolean => {
  const holidayKeywords = ['휴업', '공휴일', '방학', '절', '날', '토요일', '일요일', '대체'];
  return holidayKeywords.some(key => title.includes(key));
};

const extractEventsFromDescription = (desc: string, baseYear: number, baseMonth: number): SchoolEvent[] => {
  if (!desc) return [];
  const events: SchoolEvent[] = [];
  const regex = /([^()]+?)\s*\(([\d~,\s\-]+)\)/g;
  let match;

  while ((match = regex.exec(desc)) !== null) {
    const title = match[1].trim().replace(/^[,\s]+|[,\s]+$/g, '');
    const datePart = match[2].trim();
    const category = isHolidayTitle(title) ? EventCategory.HOLIDAY : EventCategory.EVENT;

    if (datePart.includes('~') || datePart.includes('-')) {
      const sep = datePart.includes('~') ? '~' : '-';
      const [s, e] = datePart.split(sep).map(b => parseInt(b.trim()));
      if (!isNaN(s) && !isNaN(e)) {
        // 월을 넘어가는 경우 (예: 29~2) 처리
        if (e < s) {
          // 시작 월에 기록
          for (let d = s; d <= 31; d++) {
            const lastDay = new Date(baseYear, baseMonth, 0).getDate();
            if (d <= lastDay) events.push({ title, date: d, month: baseMonth, year: baseYear, category });
          }
          // 다음 월에 기록
          const nextMonth = baseMonth === 12 ? 1 : baseMonth + 1;
          const nextYear = baseMonth === 12 ? baseYear + 1 : baseYear;
          for (let d = 1; d <= e; d++) {
            events.push({ title, date: d, month: nextMonth, year: nextYear, category });
          }
        } else {
          for (let d = s; d <= e; d++) {
            events.push({ title, date: d, month: baseMonth, year: baseYear, category });
          }
        }
      }
    } else {
      datePart.split(',').forEach(dStr => {
        const d = parseInt(dStr.trim());
        if (!isNaN(d)) events.push({ title, date: d, month: baseMonth, year: baseYear, category });
      });
    }
  }
  return events;
};

export const parseCSVToWeeklyData = (csvText: string): WeeklyData[] => {
  if (!csvText) return [];
  const lines = csvText.trim().split(/\r?\n/);
  const eventPool: SchoolEvent[] = [];

  // 1. 모든 행을 돌며 이벤트 추출
  lines.forEach((line, idx) => {
    if (idx === 0) return; // 헤더 건너뛰기
    const cols = splitCSVLine(line);
    if (cols.length < 4) return;

    const mainTitle = cols[0]; // 행사명
    const startDateStr = cols[1]; // 시작일 (2026-03-03)
    const description = cols[3]; // 설명

    if (!startDateStr || !startDateStr.includes('-')) return;

    const [y, m, d] = startDateStr.split('-').map(v => parseInt(v));
    
    // 설명(D열)에 데이터가 있으면 거기서 추출하고, 없으면 행사명(A열)을 사용
    if (description && description.includes('(')) {
      eventPool.push(...extractEventsFromDescription(description, y, m));
    } else {
      const cat = isHolidayTitle(mainTitle) ? EventCategory.HOLIDAY : EventCategory.EVENT;
      eventPool.push({ title: mainTitle, date: d, month: m, year: y, category: cat });
    }
  });

  // 2. 달력 표시를 위한 주간 스켈레톤 생성 (2026년 3월 ~ 2027년 2월)
  const result: WeeklyData[] = [];
  const startMonthOrder = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2];
  
  startMonthOrder.forEach(month => {
    const year = month <= 2 ? 2027 : 2026;
    const firstDay = new Date(year, month - 1, 1).getDay();
    const lastDate = new Date(year, month, 0).getDate();
    
    let currentDay = 1;
    let weekNum = 1;

    while (currentDay <= lastDate) {
      const days: (number | null)[] = Array(7).fill(null);
      let hasData = false;
      
      for (let i = (weekNum === 1 ? firstDay : 0); i < 7 && currentDay <= lastDate; i++) {
        days[i] = currentDay++;
        hasData = true;
      }

      if (hasData) {
        const weekEvents = eventPool.filter(e => 
          e.year === year && e.month === month && days.includes(e.date)
        );

        // 수업일수 계산 (월~금 중 휴업일이 아닌 날)
        let sDays = 0;
        for (let i = 1; i <= 5; i++) {
          const d = days[i];
          if (d) {
            const isHoliday = eventPool.some(e => e.year === year && e.month === month && e.date === d && e.category === EventCategory.HOLIDAY);
            if (!isHoliday) sDays++;
          }
        }

        result.push({ year, month, weekNum, days, events: weekEvents, schoolDays: sDays });
        weekNum++;
      }
    }
  });

  return result;
};
