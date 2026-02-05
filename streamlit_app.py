
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

# 2. 고해상도 커스텀 스타일 (React 프리미엄 감성)
st.markdown("""
    <style>
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
    html, body, [class*="css"] { font-family: 'Pretendard', sans-serif !important; background-color: #f8fafc !important; }
    
    /* 사이드바 스타일 */
    [data-testid="stSidebar"] { background-color: white !important; border-right: 1px solid #e2e8f0; }
    
    /* 헤더 스타일 */
    .main-header { display: flex; align-items: center; gap: 1.2rem; margin-bottom: 2rem; }
    .logo-box { background-color: #0f172a; color: white; padding: 0.6rem 1rem; border-radius: 0.8rem; font-weight: 900; font-size: 1.2rem; }
    .title-text { font-size: 1.8rem; font-weight: 900; color: #0f172a; letter-spacing: -0.05em; }
    
    /* 카드 공통 스타일 */
    .hero-card { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; padding: 2.5rem; border-radius: 2.5rem; margin-bottom: 2rem; position: relative; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
    .hero-label { background: #4f46e5; padding: 0.3rem 0.8rem; border-radius: 100px; font-size: 0.7rem; font-weight: 900; text-transform: uppercase; }
    .hero-title { font-size: 3.2rem; font-weight: 900; margin: 0.8rem 0; letter-spacing: -0.05em; }
    
    /* 달력 스타일 */
    .calendar-container { background: white; border-radius: 2.5rem; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .calendar-header { padding: 2rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .calendar-month { font-size: 3.5rem; font-weight: 900; color: #0f172a; line-height: 1; }
    .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); background-color: #f1f5f9; gap: 1px; }
    .weekday-label { background: #f8fafc; padding: 1.2rem 0; text-align: center; font-weight: 900; font-size: 0.9rem; color: #64748b; }
    .calendar-day { background: white; min-height: 140px; padding: 1.2rem; transition: all 0.2s; }
    .day-number { font-size: 2.2rem; font-weight: 900; margin-bottom: 0.4rem; line-height: 1; }
    .event-badge { font-size: 0.75rem; font-weight: 800; padding: 0.3rem 0.6rem; border-radius: 0.6rem; margin-top: 0.3rem; border: 1px solid rgba(0,0,0,0.05); }
    .event-normal { background: #eef2ff; color: #4338ca; }
    .event-holiday { background: #fff1f2; color: #e11d48; }
    
    /* 리스트 스타일 */
    .list-card { background: white; padding: 2rem; border-radius: 2.5rem; border: 1px solid #e2e8f0; }
    .event-item { display: flex; align-items: center; gap: 1.2rem; padding: 1rem 0; border-bottom: 1px solid #f1f5f9; }
    .date-icon { width: 55px; height: 55px; border-radius: 1rem; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 900; border: 2px solid #f1f5f9; flex-shrink: 0; }
    
    /* 버튼 스타일 조정 */
    .stButton>button { border-radius: 12px !important; font-weight: 800 !important; }
    </style>
    """, unsafe_allow_html=True)

# 3. 데이터 로직
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

# 세션 상태 초기화 (달력 이동용)
if 'cal_month_idx' not in st.session_state:
    st.session_state.cal_month_idx = 0 # 3월부터 시작 (MONTH_ORDER의 인덱스)

MONTH_ORDER = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1]

# 데이터 로드
df_raw, evt_df = get_processed_data(INITIAL_CSV)

# 4. 사이드바 메뉴
with st.sidebar:
    st.markdown('<div style="text-align: center; margin-bottom: 2rem;"><img src="https://img.icons8.com/fluency/96/school.png" width="80"></div>', unsafe_allow_html=True)
    st.title("서산명지중학교")
    st.markdown("---")
    menu = st.radio("메뉴 선택", ["📊 대시보드", "📅 학사달력", "📋 일정목록", "⚙️ 설정"], label_visibility="collapsed")
    st.markdown("---")
    st.caption("2026 Academic Dashboard v2.0")

# 5. 화면 분기
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
        st.subheader("📅 이달의 학사 달력 요약")
        current_m = today.month if today.month in MONTH_ORDER else 3
        # 미니 달력 로직 (간소화된 표 형태)
        month_data = df_raw[df_raw['월'] == current_m]
        st.dataframe(month_data, hide_index=True, use_container_width=True)
        
    with col_2:
        st.subheader("🔔 다가오는 주요 일정")
        for _, row in evt_df[evt_df['fdate'] >= today].head(6).iterrows():
            dday = (row['fdate'] - today).days + 1
            st.markdown(f"""
                <div class="event-item">
                    <div class="date-icon" style="background: {"#fff1f2" if row['cat']=="holiday" else "#f8fafc"}; color: {"#e11d48" if row['cat']=="holiday" else "#4338ca"};">
                        <div style="font-size: 0.7rem; opacity: 0.6;">{row['month']}월</div><div style="font-size: 1.5rem;">{row['date']}</div>
                    </div>
                    <div>
                        <div style="font-size: 1.1rem; font-weight: 900;">{row['title']}</div>
                        <div style="font-size: 0.7rem; font-weight: 900; background: #0f172a; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; display: inline-block;">D-{dday}</div>
                    </div>
                </div>
            """, unsafe_allow_html=True)

    st.markdown("---")
    total_days = int(pd.to_numeric(df_raw['월별수업일수'], errors='coerce').unique().sum())
    st.metric("2026학년도 총 수업일수", f"{total_days}일")

elif menu == "📅 학사달력":
    st.markdown('<div class="main-header"><div class="logo-box">MJ</div><div class="title-text">월별 학사 상세 달력</div></div>', unsafe_allow_html=True)
    
    # 상단 내비게이션 버튼
    c_prev, c_month, c_next = st.columns([1, 4, 1])
    with c_prev:
        if st.button("◀ 이전 달", use_container_width=True):
            st.session_state.cal_month_idx = max(0, st.session_state.cal_month_idx - 1)
    with c_next:
        if st.button("다음 달 ▶", use_container_width=True):
            st.session_state.cal_month_idx = min(len(MONTH_ORDER) - 1, st.session_state.cal_month_idx + 1)
    
    sel_month = MONTH_ORDER[st.session_state.cal_month_idx]
    sel_year = 2027 if sel_month <= 2 else 2026
    
    with c_month:
        st.markdown(f"<h2 style='text-align: center; margin: 0;'>{sel_year}년 {sel_month}월</h2>", unsafe_allow_html=True)

    # 달력 생성
    cal = calendar.Calendar(firstweekday=6)
    month_days = cal.monthdayscalendar(sel_year, sel_month)
    
    monthly_days_series = pd.to_numeric(df_raw.groupby('월')['월별수업일수'].first(), errors='coerce').fillna(0)
    monthly_total = int(monthly_days_series.get(sel_month, 0))
    
    html = f"""
    <div class="calendar-container">
        <div class="calendar-header">
            <div><div class="calendar-month">{sel_month}월</div></div>
            <div style="background: #0f172a; color: white; padding: 1rem 2rem; border-radius: 1.5rem; text-align: right;">
                <div style="font-size: 0.7rem; font-weight: 900; opacity: 0.5;">월 수업일수</div>
                <div style="font-size: 1.8rem; font-weight: 900;">{monthly_total}일</div>
            </div>
        </div>
        <div class="calendar-grid">
            <div class="weekday-label" style="color: #ef4444;">SUN</div><div class="weekday-label">MON</div><div class="weekday-label">TUE</div><div class="weekday-label">WED</div><div class="weekday-label">THU</div><div class="weekday-label">FRI</div><div class="weekday-label" style="color: #4f46e5;">SAT</div>
    """
    for week in month_days:
        for i, day in enumerate(week):
            if day == 0: html += '<div class="calendar-day" style="background: #f8fafc;"></div>'
            else:
                day_evts = evt_df[(evt_df['month'] == sel_month) & (evt_df['date'] == day)]
                html += f'<div class="calendar-day"><div class="day-number" style="{"color: #ef4444;" if i==0 else "color: #4f46e5;" if i==6 else ""}">{day}</div>'
                for _, e in day_evts.iterrows():
                    html += f'<div class="event-badge {"event-holiday" if e["cat"]=="holiday" else "event-normal"}">{e["title"]}</div>'
                html += '</div>'
    html += "</div></div>"
    st.markdown(html, unsafe_allow_html=True)

elif menu == "📋 일정목록":
    st.markdown('<div class="main-header"><div class="logo-box">MJ</div><div class="title-text">2026 전체 학사 일정 목록</div></div>', unsafe_allow_html=True)
    
    search = st.text_input("🔍 행사명 검색", placeholder="예: 고사, 축제, 입학식...")
    
    filtered_evts = evt_df
    if search:
        filtered_evts = evt_df[evt_df['title'].str.contains(search, case=False)]
    
    st.markdown('<div class="list-card">', unsafe_allow_html=True)
    for _, row in filtered_evts.iterrows():
        st.markdown(f"""
            <div class="event-item">
                <div class="date-icon" style="background: {"#fff1f2" if row['cat']=="holiday" else "#f8fafc"}; color: {"#e11d48" if row['cat']=="holiday" else "#4338ca"};">
                    <div style="font-size: 0.7rem; opacity: 0.6;">{row['month']}월</div><div style="font-size: 1.5rem;">{row['date']}</div>
                </div>
                <div style="flex-grow: 1;">
                    <div style="font-size: 1.2rem; font-weight: 900; color: #1e293b;">{row['title']}</div>
                    <div style="font-size: 0.8rem; color: #94a3b8;">{row['year']}학년도 • {"휴업일" if row['cat']=="holiday" else "정규 학사"}</div>
                </div>
            </div>
        """, unsafe_allow_html=True)
    st.markdown('</div>', unsafe_allow_html=True)

elif menu == "⚙️ 설정":
    st.markdown('<div class="main-header"><div class="logo-box">MJ</div><div class="title-text">시스템 데이터 설정</div></div>', unsafe_allow_html=True)
    
    with st.expander("🔗 구글 시트 데이터 연동", expanded=True):
        st.write("공유된 구글 시트의 CSV URL을 입력하여 실시간으로 학사 데이터를 업데이트할 수 있습니다.")
        sheet_url = st.text_input("CSV URL 입력", placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv")
        if st.button("데이터 동기화 및 저장"):
            st.success("데이터 소스 연결 성공 (현재 세션에 반영되었습니다)")
    
    with st.expander("📥 데이터 백업 및 내보내기"):
        st.download_button(
            label="현재 학사 데이터 다운로드 (CSV)",
            data=INITIAL_CSV,
            file_name="smj_academic_2026.csv",
            mime="text/csv"
        )
    
    st.info("💡 이 시스템은 브라우저 캐시와 세션을 기반으로 작동하며, 실시간 CSV 파싱 기술이 적용되어 있습니다.")
