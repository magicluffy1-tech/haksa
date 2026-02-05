
import { WeeklyData, EventCategory, SchoolEvent } from '../types';

const parseEventString = (eventStr: string, year: number, month: number, category: EventCategory): SchoolEvent[] => {
  if (!eventStr || eventStr.trim() === '') return [];
  const events: SchoolEvent[] = [];
  
  const regex = /([^()]+)\(([\d~,\s\-]+)\)/g;
  let match;

  while ((match = regex.exec(eventStr)) !== null) {
    let title = match[1].trim();
    title = title.replace(/^[,\s]+/, '').trim();
    
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
  return events;
};

export const parseCSVToWeeklyData = (csvText: string): WeeklyData[] => {
  const lines = csvText.trim().split('\n');
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
    while (parts.length < 14) parts.push("");
    return parts;
  };

  // 1단계: 모든 이벤트 수집
  lines.forEach((line, index) => {
    if (index === 0) return;
    const parts = parseLine(line);
    const month = parseInt(parts[0]);
    if (isNaN(month)) return;
    const year = (month === 1 || month === 2) ? 2027 : 2026;

    const rawHolidays = parts[9];
    const rawBreaks = parts[10];
    const rawEvents = parts[13];

    masterEvents.push(...parseEventString(rawEvents, year, month, EventCategory.EVENT));
    masterEvents.push(...parseEventString(rawHolidays, year, month, EventCategory.HOLIDAY));
    masterEvents.push(...parseEventString(rawBreaks, year, month, EventCategory.HOLIDAY));

    const days = [parts[2], parts[3], parts[4], parts[5], parts[6], parts[7], parts[8]]
      .map(d => (d && d.trim() !== '') ? parseInt(d.trim()) : null);

    tempWeeklyData.push({
      month,
      year,
      weekNum: parseInt(parts[1]),
      days,
      schoolDays: 0 // 후속 계산
    });
  });

  // 2단계: 주별 수업일수 동적 계산 (월~금 중 휴일이 아닌 날)
  return tempWeeklyData.map(week => {
    const weekDays = week.days; // [일, 월, 화, 수, 목, 금, 토]
    let schoolDaysInWeek = 0;

    // 월요일(index 1)부터 금요일(index 5)까지 체크
    for (let i = 1; i <= 5; i++) {
      const dayNum = weekDays[i];
      if (dayNum !== null) {
        // 해당 일자에 HOLIDAY 카테고리 이벤트가 있는지 확인
        const isHoliday = masterEvents.some(e => 
          e.year === week.year && 
          e.month === week.month && 
          e.date === dayNum && 
          e.category === EventCategory.HOLIDAY
        );
        if (!isHoliday) {
          schoolDaysInWeek++;
        }
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
