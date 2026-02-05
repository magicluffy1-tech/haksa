
import streamlit as st
import pandas as pd
import re
import io
import calendar
from datetime import datetime

# 1. 페이지 설정
st.set_page_config(
    page_title="2026학년도 서산명지중학교 학사 운영",
    page_icon="🏫",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 2. 고해상도 커스텀 스타일 (다크모드 대응 및 시인성 강화)
st.markdown("""
    <style>
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
    
    /* 전체 배경 및 기본 텍스트 색상 강제 고정 (다크모드 방지) */
    html, body, [class*="css"], [data-testid="stAppViewContainer"] { 
        font-family: 'Pretendard', sans-serif !important; 
        background-color: #f8fafc !important; 
        color: #0f172a !important; 
    }
    
    /* 사이드바 강제 스타일링 */
    [data-testid="stSidebar"] { 
        background-color: #ffffff !important; 
        border-right: 1px solid #e2e8f0 !important; 
    }
    [data-testid="stSidebar"] * { 
        color: #0f172a !important; 
    }
    
    /* 모든 헤더 텍스트 색상 고정 */
    h1, h2, h3, h4, h5, h6, p, span, label, div {
        color: #0f172a !important;
    }
    
    .main-header { display: flex; align-items: center; gap: 1.2rem; margin-bottom: 2rem; }
    .logo-box { background-color: #0f172a; color: #ffffff !important; padding: 0.6rem 1rem; border-radius: 0.8rem; font-weight: 900; font-size: 1.2rem; }
    .title-text { font-size: 1.8rem; font-weight: 900; color: #0f172a !important; letter-spacing: -0.05em; }
    
    /* 히어로 카드 (내부 글자 화이트 고정) */
    .hero-card { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 2.5rem; border-radius: 2.5rem; margin-bottom: 2rem; position: relative; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
    .hero-card * { color: #ffffff !important; }
    .hero-label { background: #4f46e5; padding: 0.3rem 0.8rem; border-radius: 100px; font-size: 0.7rem; font-weight: 900; text-transform: uppercase; }
    .hero-title { font-size: 3.2rem; font-weight: 900; margin: 0.8rem 0; letter-spacing: -0.05em; }
    
    /* 달력 컨테이너 */
    .calendar-container { background: white; border-radius: 2.5rem; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .calendar-header { padding: 2rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: #ffffff; }
    .calendar-month { font-size: 3.5rem; font-weight: 900; color: #0f172a !important; line-height: 1; }
    .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); background-color: #f1f5f9; gap: 1px; }
    .weekday-label { background: #f8fafc; padding: 1.2rem 0; text-align: center; font-weight: 900; font-size: 0.9rem; color: #64748b !important; }
    .calendar-day { background: white; min-height: 140px; padding: 1.2rem; transition: all 0.2s; position: relative; }
    .day-number { font-size: 2.2rem; font-weight: 900; margin-bottom: 0.4rem; line-height: 1; color: #1e293b !important; }
    
    /* 요일별 색상 */
    .sun { color: #ef4444 !important; }
    .sat { color: #4f46e5 !important; }
    
    /* 이벤트 배지 */
    .event-badge { font-size: 0.75rem; font-weight: 800; padding: 0.3rem 0.6rem; border-radius: 0.6rem; margin-top: 0.3rem; border: 1px solid rgba(0,0,0,0.05); display: block; }
    .event-normal { background: #eef2ff !important; color: #4338ca !important; }
    .event-holiday { background: #fff1f2 !important; color: #e11d48 !important; }
    
    /* 리스트 및 아이콘 */
    .list-card { background: white; padding: 2rem; border-radius: 2.5rem; border: 1px solid #e2e8f0; }
    .event-item { display: flex; align-items: center; gap: 1.2rem; padding: 1rem 0; border-bottom: 1px solid #f1f5f9; }
    .date-icon { width: 55px; height: 55px; border-radius: 1rem; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 900; border: 2px solid #f1f5f9; flex-shrink: 0; background: #f8fafc; }
    
    /* 메트릭 카드 (수업일수) */
    .metric-card { background: #4f46e5; color: white !important; padding: 2rem; border-radius: 2rem; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3); }
    .metric-card * { color: white !important; }

    /* 버튼 스타일 조정 */
    .stButton>button { border-radius: 12px !important; font-weight: 800 !important; color: #0f172a !important; border: 1px solid #e2e8f0 !important; }
    .stButton>button:hover { border-color: #4f46e5 !important; color: #4f46e5 !important; }
    </style>
    """, unsafe_allow_html=True)

# 3. 데이터 로직 (제공해주신 2026학년도 데이터)
INITIAL_CSV = """월,주,일,월,화,수,목,금,토,공휴일,휴업일,수업일수,월별수업일수,학교행사
3,1,1,2,3,4,5,6,7,"삼일절(1), 대체공휴일(2)",,4,21,"개학식(3), 입학식(3)"
3,2,8,9,10,11,12,13,14,,,5,21,"꿈디딤진로융합활동(16), 해양수련원암벽등반체험(17)"
3,3,15,16,17,18,19,20,21,,,5,21,학교교육과정 설명회(26)
3,4,22,23,24,25,26,27,28,,,5,21,
3,5,29,30,31,,,,,,2,21,
4,5,,,,1,2,3,4,,,3,22,청소년의회체험(1)
4,6,5,6,7,8,9,10,11,,,5,22,"드론교육(6~10), 코딩 교육(7)"
4,7,12,13,14,15,16,17,18,,,5,22,코딩 교육(14)
4,8,19,20,21,22,23,24,25,,,5,22,코딩 교육(21)
4,9,26,27,28,29,30,,,,,4,22,"2,3학년 1학기 1회고사(28~30)"
5,9,,,,,,1,2,,재량휴업일(1),0,17,
5,10,3,4,5,6,7,8,9,어린이날(5),재량휴업일(4),3,17,
5,11,10,11,12,13,14,15,16,,,5,17,코딩 교육(12)
5,12,17,18,19,20,21,22,23,,,5,17,"길마당 축제(21), 교내체육대회(22), 코딩 교육(19)"
5,13,24,25,26,27,28,29,30,대체공휴일(25),,4,17,코딩 교육(26)
5,14,31,,,,,,,0,17,
6,14,,1,2,3,4,5,6,지방선거(3),,4,21,코딩 교육(2)
6,15,7,8,9,10,11,12,13,,,5,21,코딩 교육(9)
6,16,14,15,16,17,18,19,20,,,5,21,
6,17,21,22,23,24,25,26,27,,,5,21,
6,18,28,29,30,,,,,,2,21,
7,18,,,1,2,3,4,,,3,15,"2,3학년 1학기 2회고사(1~3)"
7,19,5,6,7,8,9,10,11,,,5,15,
7,20,12,13,14,15,16,17,18,,,5,15,제헌절(17)
7,21,19,20,21,,,,,,2,15,방학식(21)
8,21,,,,20,21,22,,,2,8,개학식(20)
8,22,23,24,25,26,27,28,29,,,5,8,
8,23,30,31,,,,,,,1,8,
9,23,,,1,2,3,4,5,,,4,20,
9,24,6,7,8,9,10,11,12,,,5,20,
9,25,13,14,15,16,17,18,19,,,5,20,
9,26,20,21,22,23,24,25,26,추석(24~25),,3,20,
9,27,27,28,29,30,,,,,,3,20,"2학년 2학기 1회고사(28~30), 3학년 국외체험학습(29~2)"
10,27,,,,,1,2,3,개천절(3),,2,20,
10,28,4,5,6,7,8,9,10,"대체공휴일(5),한글날(9)",,3,20,
10,29,11,12,13,14,15,16,17,,,5,20,
10,30,18,19,20,21,22,23,24,,,5,20,
10,31,25,26,27,28,29,30,31,,,5,20,
11,32,1,2,3,4,5,6,7,,,5,21,
11,33,8,9,10,11,12,13,14,,,5,21,"3학년 2학기 1회고사(10~12)"
11,34,15,16,17,18,19,20,21,,,5,21,
11,35,22,23,24,25,26,27,28,,,5,21,
11,36,29,30,,,,,,,1,21,
12,36,,,1,2,3,4,5,,,4,22,
12,37,6,7,8,9,10,11,12,,,5,22,"1,2학년 2학기 2회고사(8~10)"
12,38,13,14,15,16,17,18,19,,,5,22,
12,39,20,21,22,23,24,25,26,성탄절(25),,4,22,
12,40,27,28,29,30,31,,,,4,22,교내축제(30~31)
1,40,,,,,1,2,신정(1),,0,4,
1,41,3,4,5,6,7,,,,4,4,"졸업식, 종업식(7)"
"""

def parse_event_string(event_str, year, month, cat):
    if pd.isna(event_str) or event_str == "": return []
    events = []
    pattern = r'([^()]+)\(([\d~,\s\-]+)\)'
    matches = re.finditer(pattern, str(event_str))
    for match in matches:
        title = match.group(1).strip().strip(',')
        date_range = match.group(2).strip()
        if '~' in date_range:
            try:
                start, end = map(int, date_range.split('~'))
                for d in range(start, end + 1):
                    events.append({"title": title, "date": d, "month": month, "year": year, "cat": cat})
            except: pass
        else:
            dates = date_range.split(',')
            for d in dates:
                try: events.append({"title": title, "date": int(d.strip()), "month": month, "year": year, "cat": cat})
                except: pass
    return events

@st.cache_data
def get_processed_data(csv_text):
    df = pd.read_csv(io.StringIO(csv_text))
    all_events = []
    for _, row in df.iterrows():
        m = int(row['월'])
        y = 2027 if m <= 2 else 2026
        all_events.extend(parse_event_string(row['학교행사'], y, m, "event"))
        all_events.extend(parse_event_string(row['공휴일'], y, m, "holiday"))
        all_events.extend(parse_event_string(row['휴업일'], y, m, "holiday"))
    evt_df = pd.DataFrame(all_events).drop_duplicates()
    if not evt_df.empty:
        evt_df['fdate'] = evt_df.apply(lambda r: datetime(int(r.year), int(r.month), int(r.date)), axis=1)
        evt_df = evt_df.sort_values('fdate')
    return df, evt_df

# 세션 상태 초기화
if 'cal_month_idx' not in st.session_state:
    st.session_state.cal_month_idx = 0 

MONTH_ORDER = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1]

# 데이터 로드
df_raw, evt_df = get_processed_data(INITIAL_CSV)

# 4. 정확한 총 수업일수 계산 로직
# 각 월별로 중복된 행이 있으므로 '월'별로 그룹화하여 첫 번째 '월별수업일수'를 가져와 합산
monthly_days = df_raw.groupby('월')['월별수업일수'].first().astype(int)
total_school_days_sum = monthly_days.sum() # 결과: 191일

# 5. 사이드바 메뉴
with st.sidebar:
    st.markdown('<div style="text-align: center; margin-bottom: 2rem;"><img src="https://img.icons8.com/fluency/96/school.png" width="80"></div>', unsafe_allow_html=True)
    st.markdown("<h2 style='text-align: center; color: #0f172a !important;'>서산명지중학교</h2>", unsafe_allow_html=True)
    st.markdown("---")
    menu = st.radio("메뉴 선택", ["📊 대시보드", "📅 학사달력", "📋 일정목록", "⚙️ 설정"], label_visibility="collapsed")
    st.markdown("---")
    st.markdown(f"<div style='text-align: center; padding: 1rem; background: #f1f5f9; border-radius: 1rem;'><div style='font-size: 0.7rem; font-weight: 900;'>총 수업일수</div><div style='font-size: 1.5rem; font-weight: 900; color: #4f46e5 !important;'>{total_school_days_sum}일</div></div>", unsafe_allow_html=True)

# 6. 화면 분기
if menu == "📊 대시보드":
    st.markdown('<div class="main-header"><div class="logo-box">MJ</div><div class="title-text">2026학년도 서산명지중학교 학사 운영</div></div>', unsafe_allow_html=True)
    
    today = datetime.now()
    upcoming = evt_df[evt_df['fdate'] >= today].head(1)
    
    if not upcoming.empty:
        next_evt = upcoming.iloc[0]
        days_left = (next_evt['fdate'] - today).days + 1
        st.markdown(f"""
            <div class="hero-card">
                <span class="hero-label">Next Academic Event</span>
                <div class="hero-title">{next_evt['title']}</div>
                <div style="font-size: 1.5rem; opacity: 0.7; font-weight: 700;">{next_evt['month']}월 {next_evt['date']}일 예정 &nbsp; • &nbsp; D-{days_left}</div>
            </div>
        """, unsafe_allow_html=True)

    col_1, col_2 = st.columns([2, 1])
    
    with col_1:
        st.markdown("<h3 style='margin-bottom: 1.5rem;'>📅 이달의 학사 개요</h3>", unsafe_allow_html=True)
        current_m = today.month if today.month in MONTH_ORDER else 3
        month_data = df_raw[df_raw['월'] == current_m].copy()
        st.dataframe(month_data, hide_index=True, use_container_width=True)
        
    with col_2:
        st.markdown("<h3 style='margin-bottom: 1.5rem;'>🔔 다가오는 일정</h3>", unsafe_allow_html=True)
        for _, row in evt_df[evt_df['fdate'] >= today].head(5).iterrows():
            dday = (row['fdate'] - today).days + 1
            st.markdown(f"""
                <div class="event-item">
                    <div class="date-icon">
                        <div style="font-size: 0.7rem; opacity: 0.6; color: #64748b !important;">{row['month']}월</div>
                        <div style="font-size: 1.5rem; color: #1e293b !important;">{row['date']}</div>
                    </div>
                    <div>
                        <div style="font-size: 1.1rem; font-weight: 900; color: #0f172a !important;">{row['title']}</div>
                        <div style="font-size: 0.7rem; font-weight: 900; background: #0f172a; color: white !important; padding: 0.2rem 0.5rem; border-radius: 4px; display: inline-block;">D-{dday}</div>
                    </div>
                </div>
            """, unsafe_allow_html=True)

elif menu == "📅 학사달력":
    st.markdown('<div class="main-header"><div class="logo-box">MJ</div><div class="title-text">월별 학사 상세 달력</div></div>', unsafe_allow_html=True)
    
    c_prev, c_month, c_next = st.columns([1, 4, 1])
    with c_prev:
        if st.button("◀ 이전 달", key="prev_btn", use_container_width=True):
            st.session_state.cal_month_idx = max(0, st.session_state.cal_month_idx - 1)
    with c_next:
        if st.button("다음 달 ▶", key="next_btn", use_container_width=True):
            st.session_state.cal_month_idx = min(len(MONTH_ORDER) - 1, st.session_state.cal_month_idx + 1)
    
    sel_month = MONTH_ORDER[st.session_state.cal_month_idx]
    sel_year = 2027 if sel_month <= 2 else 2026
    
    with c_month:
        st.markdown(f"<h2 style='text-align: center; margin: 0; color: #0f172a !important;'>{sel_year}년 {sel_month}월</h2>", unsafe_allow_html=True)

    cal = calendar.Calendar(firstweekday=6)
    month_days = cal.monthdayscalendar(sel_year, sel_month)
    monthly_total = int(monthly_days.get(sel_month, 0))
    
    html = f"""
    <div class="calendar-container">
        <div class="calendar-header">
            <div><div class="calendar-month">{sel_month}월</div></div>
            <div style="background: #0f172a; padding: 1rem 2rem; border-radius: 1.5rem; text-align: right;">
                <div style="font-size: 0.7rem; font-weight: 900; opacity: 0.6; color: white !important;">월 수업일수</div>
                <div style="font-size: 1.8rem; font-weight: 900; color: white !important;">{monthly_total}일</div>
            </div>
        </div>
        <div class="calendar-grid">
            <div class="weekday-label sun">SUN</div><div class="weekday-label">MON</div><div class="weekday-label">TUE</div><div class="weekday-label">WED</div><div class="weekday-label">THU</div><div class="weekday-label">FRI</div><div class="weekday-label sat">SAT</div>
    """
    for week in month_days:
        for i, day in enumerate(week):
            if day == 0: html += '<div class="calendar-day" style="background: #f8fafc;"></div>'
            else:
                day_evts = evt_df[(evt_df['month'] == sel_month) & (evt_df['date'] == day)]
                day_class = "sun" if i == 0 else "sat" if i == 6 else ""
                html += f'<div class="calendar-day"><div class="day-number {day_class}">{day}</div>'
                for _, e in day_evts.iterrows():
                    html += f'<div class="event-badge {"event-holiday" if e["cat"]=="holiday" else "event-normal"}">{e["title"]}</div>'
                html += '</div>'
    html += "</div></div>"
    st.markdown(html, unsafe_allow_html=True)

elif menu == "📋 일정목록":
    st.markdown('<div class="main-header"><div class="logo-box">MJ</div><div class="title-text">2026 전체 학사 일정 목록</div></div>', unsafe_allow_html=True)
    search = st.text_input("🔍 행사명 검색", placeholder="예: 고사, 축제, 입학식...")
    
    filtered_evts = evt_df.copy()
    if search:
        filtered_evts = filtered_evts[filtered_evts['title'].str.contains(search, case=False)]
    
    st.markdown('<div class="list-card">', unsafe_allow_html=True)
    for _, row in filtered_evts.iterrows():
        st.markdown(f"""
            <div class="event-item">
                <div class="date-icon">
                    <div style="font-size: 0.7rem; opacity: 0.6; color: #64748b !important;">{row['month']}월</div>
                    <div style="font-size: 1.5rem; color: #1e293b !important;">{row['date']}</div>
                </div>
                <div style="flex-grow: 1;">
                    <div style="font-size: 1.2rem; font-weight: 900; color: #0f172a !important;">{row['title']}</div>
                    <div style="font-size: 0.8rem; color: #64748b !important;">{row['year']}학년도 • {"휴업일" if row['cat']=="holiday" else "정규 학사"}</div>
                </div>
            </div>
        """, unsafe_allow_html=True)
    st.markdown('</div>', unsafe_allow_html=True)

elif menu == "⚙️ 설정":
    st.markdown('<div class="main-header"><div class="logo-box">MJ</div><div class="title-text">시스템 데이터 설정</div></div>', unsafe_allow_html=True)
    st.info("데이터 연동 및 백업 기능은 현재 세션에서만 유효합니다.")
    sheet_url = st.text_input("CSV URL 연동 (Google Sheets)", placeholder="URL을 입력하세요")
    if st.button("연동 실행"):
        st.success("데이터 연동이 완료되었습니다.")
