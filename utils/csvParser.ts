
import { WeeklyData, EventCategory, SchoolEvent } from '../types';

/**
 * 문자열에서 행사명과 날짜를 추출합니다.
 * 예: "꿈디딤진로융합활동(16), 해양수련원암벽등반체험(17)" -> 각각 16일, 17일 이벤트 생성
 */
const parseEventString = (eventStr: string, year: number, month: number, category: EventCategory): SchoolEvent[] => {
  if (!eventStr || eventStr.trim() === '') return [];
  const events: SchoolEvent[] = [];
  
  // 정규식 개선: 
  // ([^()]+?) : 괄호가 나오기 전까지의 문자 (비탐욕적 매칭으로 제목 확보)
  // \s* : 혹시 모를 공백 허용
  // \(([\d~,\s\-]+)\) : 괄호 안의 날짜 숫자 및 기호들
  const regex = /([^()]+?)\s*\(([\d~,\s\-]+)\)/g;
  let match;

  while ((match = regex.exec(eventStr)) !== null) {
    let title = match[1].trim();
    // 앞뒤 쉼표 제거
    title = title.replace(/^[,\s]+|[,\s]+$/g, '');
    const dateRange = match[2].trim();

    if (!title) continue;

    // 1. 범위형 처리 (예: 28~30)
    if (dateRange.includes('~')) {
      const parts = dateRange.split('~').map(d => parseInt(d.trim()));
      const start = parts[0];
      const end = parts[1];
      if (!isNaN(start) && !isNaN(end)) {
        for (let d = start; d <= end; d++) {
          events.push({ title, date: d, month, year, category, isRange: true });
        }
      }
    } 
    // 2. 개별/다중 날짜 처리 (예: 16 또는 12, 19)
    else {
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

/**
 * CSV 데이터를 WeeklyData 구조로 변환합니다.
 */
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
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) { parts.push(temp.trim()); temp = ''; }
      else temp += char;
    }
    parts.push(temp.trim());
    return parts;
  };

  lines.forEach((line) => {
    if (!line.trim()) return;
    
    const parts = parseLine(line);
    
    // B열 (Index 1) : 월
    const month = parseInt(parts[1]);
    
    // 데이터 행인지 검사 (월 정보가 1~12 사이여야 함)
    if (isNaN(month) || month < 1 || month > 12) return;
    
    // 학년도 설정
    const year = (month === 1 || month === 2) ? 2027 : 2026;

    // K(10)=공휴일, L(11)=휴업일, O(14)=학교행사
    const rawHolidays = parts[10] || ""; 
    const rawBreaks = parts[11] || "";   
    const rawEvents = parts[14] || "";   

    // 모든 행사를 하나의 마스터 리스트에 수집
    masterEvents.push(...parseEventString(rawEvents, year, month, EventCategory.EVENT));
    masterEvents.push(...parseEventString(rawHolidays, year, month, EventCategory.HOLIDAY));
    masterEvents.push(...parseEventString(rawBreaks, year, month, EventCategory.HOLIDAY));

    // D~J열 (Index 3~9) : 날짜
    const days = [3, 4, 5, 6, 7, 8, 9].map(idx => {
      const val = parts[idx];
      return (val && val.trim() !== '') ? parseInt(val.trim()) : null;
    });

    tempWeeklyData.push({
      month,
      year,
      weekNum: parseInt(parts[2]) || 0,
      days,
      schoolDays: 0
    });
  });

  // 주별 데이터에 행사 매칭
  return tempWeeklyData.map(week => {
    let schoolDaysCount = 0;
    
    // 수업일수 계산 (월~금 인덱스 1~5)
    for (let i = 1; i <= 5; i++) {
      const dayNum = week.days[i];
      if (dayNum !== null) {
        const isHoliday = masterEvents.some(e => 
          e.year === week.year && e.month === week.month && e.date === dayNum && e.category === EventCategory.HOLIDAY
        );
        if (!isHoliday) schoolDaysCount++;
      }
    }

    // 해당 주에 포함된 모든 날짜의 행사를 추출
    const matchedEvents = masterEvents.filter(e => 
      e.month === week.month && e.year === week.year && week.days.includes(e.date)
    );

    return { ...week, events: matchedEvents, schoolDays: schoolDaysCount };
  });
};
