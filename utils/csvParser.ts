
import { WeeklyData, EventCategory, SchoolEvent } from '../types';

const parseEventString = (eventStr: string, year: number, month: number, category: EventCategory): SchoolEvent[] => {
  if (!eventStr || eventStr.trim() === '') return [];
  const events: SchoolEvent[] = [];
  
  // 괄호가 포함된 형식(예: 개학식(3)) 뿐만 아니라 단순 텍스트도 처리하도록 보완
  const regex = /([^()]+)\(([\d~,\s\-]+)\)/g;
  let match;
  let hasMatches = false;

  while ((match = regex.exec(eventStr)) !== null) {
    hasMatches = true;
    let title = match[1].trim().replace(/^[,\s"']+/, '').trim();
    const dateRange = match[2].trim();

    if (dateRange.includes('~')) {
      const parts = dateRange.split('~').map(d => parseInt(d.trim()));
      const start = parts[0];
      const end = parts[1];
      if (!isNaN(start) && !isNaN(end)) {
        for (let d = start; d <= end; d++) {
          events.push({ title, date: d, month, year, category, isRange: true });
        }
      }
    } else {
      const dates = dateRange.split(',').map(d => parseInt(d.trim()));
      dates.forEach(d => {
        if (!isNaN(d)) {
          events.push({ title, date: d, month, year, category, isRange: false });
        }
      });
    }
  }

  // 괄호 형식이 아닌 경우 (예: "개학식, 입학식") 에 대한 기본 처리 시도 (날짜 정보가 없으므로 무시되겠지만 안전장치)
  return events;
};

export const parseCSVToWeeklyData = (csvText: string): WeeklyData[] => {
  if (!csvText || csvText.trim().length < 10) return [];

  const lines = csvText.trim().split(/\r?\n/);
  const tempWeeklyData: any[] = [];
  const masterEvents: SchoolEvent[] = [];

  const parseLine = (text: string) => {
    const parts: string[] = [];
    let temp = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') { 
        inQuotes = !inQuotes; 
      } else if (char === ',' && !inQuotes) { 
        parts.push(temp.trim()); 
        temp = ''; 
      } else { 
        temp += char; 
      }
    }
    parts.push(temp.trim());
    return parts;
  };

  // 1단계: 모든 이벤트 수집
  lines.forEach((line, index) => {
    if (index === 0) return; // 헤더 스킵
    const parts = parseLine(line);
    if (parts.length < 3) return; // 최소 데이터 부족 시 스킵

    const month = parseInt(parts[0]);
    if (isNaN(month)) return;
    const year = (month === 1 || month === 2) ? 2027 : 2026;

    // 인덱스 안전 처리 (구글 시트 컬럼 부족 대비)
    const rawHolidays = parts[9] || "";
    const rawBreaks = parts[10] || "";
    const rawEvents = parts[13] || "";

    masterEvents.push(...parseEventString(rawEvents, year, month, EventCategory.EVENT));
    masterEvents.push(...parseEventString(rawHolidays, year, month, EventCategory.HOLIDAY));
    masterEvents.push(...parseEventString(rawBreaks, year, month, EventCategory.HOLIDAY));

    // 일~토 날짜 추출 (2번~8번 인덱스)
    const days = [2, 3, 4, 5, 6, 7, 8].map(idx => {
      const val = parts[idx];
      return (val && val.trim() !== '') ? parseInt(val.trim()) : null;
    });

    tempWeeklyData.push({
      month,
      year,
      weekNum: parseInt(parts[1]) || 0,
      days,
      schoolDays: 0
    });
  });

  if (tempWeeklyData.length === 0) return [];

  // 2단계: 주별 수업일수 계산
  return tempWeeklyData.map(week => {
    const weekDays = week.days;
    let schoolDaysInWeek = 0;

    for (let i = 1; i <= 5; i++) {
      const dayNum = weekDays[i];
      if (dayNum !== null) {
        const isHoliday = masterEvents.some(e => 
          e.year === week.year && 
          e.month === week.month && 
          e.date === dayNum && 
          e.category === EventCategory.HOLIDAY
        );
        if (!isHoliday) schoolDaysInWeek++;
      }
    }

    const matchedEvents = masterEvents.filter(e => 
      e.month === week.month && e.year === week.year && week.days.includes(e.date)
    );

    return {
      ...week,
      events: matchedEvents,
      schoolDays: schoolDaysInWeek
    };
  });
};
