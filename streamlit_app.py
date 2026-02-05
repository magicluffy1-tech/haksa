
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

# 2. 다크모드 강제 방어 및 고해상도 스타일링
st.markdown("""
    <style>
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
    
    /* 배경 및 텍스트 색상 강제 고정 (다크모드에서도 라이트 유지) */
    html, body, [data-testid="stAppViewContainer"], [data-testid="stHeader"], .main {
        background-color: #f8fafc !important;
        color: #0f172a !important;
        font-family: 'Pretendard', sans-serif !important;
    }

    /* 전역 텍스트 색상을 지정하되, 개별 색상 클래스가 우선하도록 처리 */
    p, span, div, label, h1, h2, h3, h4, h5, h6, .stMarkdown, .stText {
        color: #0f172a;
    }

    /* 사이드바 강제 스타일링 */
    [data-testid="stSidebar"] {
        background-color: #ffffff !important;
        border-right: 1px solid #e2e8f0 !important;
    }
    [data-testid="stSidebar"] * {
        color: #0f172a !important;
    }

    /* 버튼 스타일 */
    .stButton>button {
        background-color: #ffffff !important;
        color: #0f172a !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 12px !important;
        font-weight: 800 !important;
        height: 3rem !important;
    }
    .stButton>button:hover {
        border-color: #4f46e5 !important;
        color: #4f46e5 !important;
    }

    /* 헤더 디자인 */
    .main-header { display: flex; align-items: center; gap: 1.2rem; margin-bottom: 2rem; }
    .logo-box { background-color: #0f172a; color: white !important; padding: 0.6rem 1rem; border-radius: 0.8rem; font-weight: 900; font-size: 1.2rem; }
    .title-text { font-size: 1.8rem; font-weight: 900; color: #0f172a !important; letter-spacing: -0.05em; }
    
    /* 히어로 카드 */
    .hero-card { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white !important; padding: 2.5rem; border-radius: 2.5rem; margin-bottom: 2rem; position: relative; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
    .hero-card * { color: white !important; }
    .hero-label { background: #ef4444; padding: 0.3rem 0.8rem; border-radius: 100px; font-size: 0.7rem; font-weight: 900; text-transform: uppercase; }
    
    /* 달력 디자인 */
    .calendar-container { background: white; border-radius: 2.5rem; border: 1px solid #e2e8f0; overflow: hidden; }
    .calendar-header { padding: 2rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: white; }
    .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); background-color: #f1f5f9; gap: 1px; }
    .weekday-label { background: #f8fafc; padding: 1rem 0; text-align: center; font-weight: 900; color: #64748b !important; font-size: 0.8rem; }
    .calendar-day { background: white; min-height: 140px; padding: 1rem; transition: background 0.2s; }
    .calendar-day:hover { background: #f1f5f9; }
    .day-number { font-size: 2rem; font-weight: 900; line-height: 1; margin-bottom: 0.5rem; }
    
    /* 휴일 텍스트 색상 강제 지정 클래스 */
    .day-red { color: #ef4444 !important; }
    .day-blue { color: #4f46e5 !important; }
    .day-black { color: #1e293b !important; }
    
    /* 이벤트 배지 */
    .event-badge { font-size: 0.75rem; font-weight: 800; padding: 0.4rem 0.6rem; border-radius: 0.6rem; margin-top: 0.3rem; display: block; border: 1px solid rgba(0,0,0,0.05); }
    .event-normal { background: #eef2ff !important; color: #4338ca !important; }
    .event-holiday { background: #fee2e2 !important; color: #dc2626 !important; border-color: #fecaca !important; font-weight: 900; }
    
    .date-icon { width: 55px; height: 55px; background: #f8fafc; border: 2px solid #f1f5f9; border-radius: 1rem; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 900; flex-shrink: 0; }
    </style>
    """, unsafe_allow_html=True)

# 3. 데이터 로드 및 전처리
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

def parse_events(event_str, year, month, cat):
    if pd.isna(event_str) or event_str == "": return []
    events = []
    matches = re.finditer(r'([^()]+)\(([\d~,\s\-]+)\)', str(event_str))
    for m in matches:
        title = m.group(1).strip().strip(',')
        date_raw = m.group(2).strip()
        if '~' in date_raw:
            try:
                start, end = map(int, date_raw.split('~'))
                for d in range(start, end+1):
                    events.append({"title": title, "date": d, "month": month, "year": year, "cat": cat})
            except: pass
        else:
            for d in date_raw.split(','):
                try: events.append({"title": title, "date": int(d.strip()), "month": month, "year": year, "cat": cat})
                except: pass
    return events

@st.cache_data
def get_processed_data(csv_text):
    df = pd.read_csv(io.StringIO(csv_text))
    all_evts = []
    for _, row in df.iterrows():
        m = int(row['월'])
        y = 2027 if m <= 2 else 2026
        all_evts.extend(parse_events(row['학교행사'], y, m, "event"))
        all_evts.extend(parse_events(row['공휴일'], y, m, "holiday"))
        all_evts.extend(parse_events(row['휴업일'], y, m, "holiday"))
    evt_df = pd.DataFrame(all_evts).drop_duplicates()
    if not evt_df.empty:
        evt_df['fdate'] = evt_df.apply(lambda r: datetime(int(r.year), int(r.month), int(r.date)), axis=1)
    return df, evt_df

df_raw, evt_df = get_processed_data(INITIAL_CSV)

monthly_days_series = pd.to_numeric(df_raw.groupby('월')['월별수업일수'].first(), errors='coerce').fillna(0).astype(int)
total_days_sum = int(monthly_days_series.sum())

if 'cur_month_idx' not in st.session_state:
    st.session_state.cur_month_idx = 0
MONTH_ORDER = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2]

with st.sidebar:
    st.markdown('<div style="text-align: center; margin-bottom: 2rem;"><img src="https://img.icons8.com/fluency/96/school.png" width="80"></div>', unsafe_allow_html=True)
    st.markdown("<h3 style='text-align: center; color: #0f172a !important;'>서산명지중학교</h3>", unsafe_allow_html=True)
    st.markdown("---")
    menu = st.radio("메뉴", ["📊 대시보드", "📅 학사달력", "📋 일정목록", "⚙️ 설정"], label_visibility="collapsed")
    st.markdown("---")
    st.markdown(f"""
        <div style="background:#f1f5f9; padding:1.5rem; border-radius:1.5rem; text-align:center; border:1px solid #e2e8f0;">
            <div style="font-size:0.75rem; font-weight:900; opacity:0.6; color:#64748b !important;">2026 총 수업일수</div>
            <div style="font-size:2.5rem; font-weight:900; color:#4f46e5 !important; line-height:1.2;">{total_days_sum}<span style="font-size:1rem; margin-left:2px;">일</span></div>
        </div>
    """, unsafe_allow_html=True)

if menu == "📊 대시보드":
    st.markdown('<div class="main-header"><div class="logo-box">MJ</div><div class="title-text">2026학년도 학사 운영 대시보드</div></div>', unsafe_allow_html=True)
    today = datetime.now()
    upcoming = evt_df[evt_df['fdate'] >= today].sort_values('fdate').head(1)
    
    if not upcoming.empty:
        nxt = upcoming.iloc[0]
        dday = (nxt['fdate'] - today).days + 1
        is_holiday = nxt['cat'] == "holiday"
        st.markdown(f"""
            <div class="hero-card" style="background: { 'linear-gradient(135deg, #be123c 0%, #9f1239 100%)' if is_holiday else 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' };">
                <span class="hero-label" style="background: white; color: { '#be123c' if is_holiday else '#0f172a' } !important;">{ '쉬는 날' if is_holiday else '학사 일정' }</span>
                <div class="hero-title">{nxt['title']}</div>
                <div style="font-size:1.4rem; font-weight:700; opacity:0.9;">{nxt['month']}월 {nxt['date']}일 예정 &nbsp;•&nbsp; D-{dday}</div>
            </div>
        """, unsafe_allow_html=True)

    col1, col2 = st.columns([2, 1])
    with col1:
        st.markdown("<h4 style='margin-bottom:1rem;'>📅 이번 달 운영 데이터</h4>", unsafe_allow_html=True)
        cur_m = today.month if today.month in MONTH_ORDER else 3
        st.dataframe(df_raw[df_raw['월']==cur_m], hide_index=True, use_container_width=True)
    with col2:
        st.markdown("<h4 style='margin-bottom:1rem;'>🔔 다가오는 주요 일정</h4>", unsafe_allow_html=True)
        for _, row in evt_df[evt_df['fdate'] >= today].sort_values('fdate').head(5).iterrows():
            is_holiday_row = row['cat'] == "holiday"
            st.markdown(f"""
                <div style="display:flex; align-items:center; gap:1.2rem; margin-bottom:1.2rem; padding-bottom:1rem; border-bottom:1px solid #f1f5f9;">
                    <div class="date-icon" style="background: { '#fee2e2' if is_holiday_row else '#f8fafc' }; border-color: { '#fecaca' if is_holiday_row else '#f1f5f9' };">
                        <span style="font-size:0.7rem; color:#64748b !important;">{row['month']}월</span>
                        <span style="font-size:1.4rem; color: { '#dc2626' if is_holiday_row else '#1e293b' } !important;">{row['date']}</span>
                    </div>
                    <div style="font-weight:900; font-size:1.1rem; color: { '#dc2626' if is_holiday_row else '#0f172a' } !important;">{row['title']}</div>
                </div>
            """, unsafe_allow_html=True)

elif menu == "📅 학사달력":
    st.markdown('<div class="main-header"><div class="logo-box">MJ</div><div class="title-text">월별 학사 상세 달력</div></div>', unsafe_allow_html=True)
    c_nav1, c_nav2, c_nav3 = st.columns([1, 4, 1])
    with c_nav1:
        if st.button("◀ 이전 달", use_container_width=True, key="btn_prev"):
            st.session_state.cur_month_idx = max(0, st.session_state.cur_month_idx - 1)
    with c_nav3:
        if st.button("다음 달 ▶", use_container_width=True, key="btn_next"):
            st.session_state.cur_month_idx = min(len(MONTH_ORDER)-1, st.session_state.cur_month_idx + 1)
    sel_m = MONTH_ORDER[st.session_state.cur_month_idx]
    sel_y = 2027 if sel_m <= 2 else 2026
    with c_nav2:
        st.markdown(f"<h2 style='text-align:center; color:#0f172a !important; margin:0;'>{sel_y}년 {sel_m}월</h2>", unsafe_allow_html=True)
    cal = calendar.Calendar(firstweekday=6)
    weeks = cal.monthdayscalendar(sel_y, sel_m)
    sel_m_days = int(monthly_days_series.get(sel_m, 0))
    html = f"""
    <div class="calendar-container">
        <div class="calendar-header">
            <div style="font-size:2.5rem; font-weight:900;">{sel_m}월</div>
            <div style="background:#0f172a; color:white !important; padding:1rem 2rem; border-radius:1.5rem; text-align:right;">
                <span style="font-size:0.75rem; opacity:0.6; color:white !important;">월 수업일수</span><br/><span style="font-size:1.8rem; font-weight:900; color:white !important;">{sel_m_days}일</span>
            </div>
        </div>
        <div class="calendar-grid">
            <div class="weekday-label" style="color:#ef4444 !important;">일요일 (SUN)</div>
            <div class="weekday-label">월요일</div><div class="weekday-label">화요일</div><div class="weekday-label">수요일</div><div class="weekday-label">목요일</div><div class="weekday-label">금요일</div>
            <div class="weekday-label" style="color:#4f46e5 !important;">토요일 (SAT)</div>
    """
    for w in weeks:
        for i, d in enumerate(w):
            if d == 0:
                html += '<div class="calendar-day" style="background:#f8fafc;"></div>'
            else:
                evts = evt_df[(evt_df['month']==sel_m) & (evt_df['date']==d)]
                # 휴일 체크 로직 강화
                is_holiday_day = any(e['cat'] == "holiday" for _, e in evts.iterrows())
                # 클래스 기반 색상 할당
                d_class = "day-red" if i == 0 or is_holiday_day else "day-blue" if i == 6 else "day-black"
                
                html += f'<div class="calendar-day"><div class="day-number {d_class}">{d}</div>'
                for _, e in evts.iterrows():
                    cls = "event-holiday" if e['cat'] == "holiday" else "event-normal"
                    html += f'<span class="event-badge {cls}">{e["title"]}</span>'
                html += '</div>'
    html += "</div></div>"
    st.markdown(html, unsafe_allow_html=True)

elif menu == "📋 일정목록":
    st.markdown('<div class="main-header"><div class="logo-box">MJ</div><div class="title-text">2026 전체 학사 일정 목록</div></div>', unsafe_allow_html=True)
    search = st.text_input("🔍 일정 검색", placeholder="행사명을 입력하세요 (예: 고사, 축제, 입학)")
    disp_df = evt_df[['year', 'month', 'date', 'title', 'cat']].copy()
    if search:
        disp_df = disp_df[disp_df['title'].str.contains(search, case=False)]
    st.dataframe(
        disp_df.sort_values(['year', 'month', 'date']),
        column_config={"year": "학년도", "month": "월", "date": "일", "title": "일정명", "cat": "구분"},
        hide_index=True,
        use_container_width=True
    )
