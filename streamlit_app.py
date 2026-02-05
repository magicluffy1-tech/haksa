
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
    layout="wide"
)

# 2. 고해상도 커스텀 스타일 (React 버전의 Look & Feel 재현)
st.markdown("""
    <style>
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
    
    html, body, [class*="css"] {
        font-family: 'Pretendard', sans-serif !important;
        background-color: #f8fafc !important;
    }
    
    /* 헤더 스타일 */
    .main-header {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        margin-bottom: 2rem;
    }
    .logo-box {
        background-color: #0f172a;
        color: white;
        padding: 0.8rem 1.2rem;
        border-radius: 1rem;
        font-weight: 900;
        font-size: 1.5rem;
    }
    .title-text {
        font-size: 2.2rem;
        font-weight: 900;
        color: #0f172a;
        letter-spacing: -0.05em;
    }

    /* 히어로 섹션 (카운트다운) */
    .hero-card {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        color: white;
        padding: 3rem;
        border-radius: 3rem;
        margin-bottom: 3rem;
        position: relative;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .hero-label {
        background: #4f46e5;
        padding: 0.4rem 1rem;
        border-radius: 100px;
        font-size: 0.75rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }
    .hero-title {
        font-size: 4rem;
        font-weight: 900;
        margin: 1rem 0;
        letter-spacing: -0.05em;
    }

    /* 달력 그리드 스타일 (핵심) */
    .calendar-container {
        background: white;
        border-radius: 3rem;
        border: 1px solid #e2e8f0;
        overflow: hidden;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }
    .calendar-header {
        padding: 2.5rem;
        border-bottom: 1px solid #f1f5f9;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .calendar-month {
        font-size: 4.5rem;
        font-weight: 900;
        color: #0f172a;
        line-height: 1;
    }
    .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        background-color: #f1f5f9;
        gap: 1px;
    }
    .weekday-label {
        background: #f8fafc;
        padding: 1.5rem 0;
        text-align: center;
        font-weight: 900;
        font-size: 1rem;
        color: #64748b;
        text-transform: uppercase;
    }
    .calendar-day {
        background: white;
        min-height: 180px;
        padding: 1.5rem;
        transition: all 0.2s;
    }
    .calendar-day:hover {
        background: #fdfeff;
    }
    .day-number {
        font-size: 3rem;
        font-weight: 900;
        margin-bottom: 0.5rem;
        line-height: 1;
    }
    .event-badge {
        font-size: 0.85rem;
        font-weight: 800;
        padding: 0.5rem 0.8rem;
        border-radius: 0.8rem;
        margin-top: 0.4rem;
        border: 1px solid rgba(0,0,0,0.05);
    }
    .event-normal { background: #eef2ff; color: #4338ca; }
    .event-holiday { background: #fff1f2; color: #e11d48; }

    /* 우측 일정 카드 */
    .list-card {
        background: white;
        padding: 2.5rem;
        border-radius: 3rem;
        border: 1px solid #e2e8f0;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }
    .event-item {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        padding: 1.2rem 0;
        border-bottom: 1px solid #f1f5f9;
    }
    .date-icon {
        width: 70px;
        height: 70px;
        border-radius: 1.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        border: 2px solid #f1f5f9;
    }
    </style>
    """, unsafe_allow_html=True)

# 3. 데이터 로드 및 파싱 함수
FULL_CSV_DATA = """월,주,일,월,화,수,목,금,토,공휴일,휴업일,수업일수,월별수업일수,학교행사
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
            start, end = map(int, date_range.split('~'))
            for d in range(start, end + 1):
                events.append({"title": title, "date": d, "month": month, "year": year, "cat": cat})
        else:
            dates = date_range.split(',')
            for d in dates:
                try: events.append({"title": title, "date": int(d.strip()), "month": month, "year": year, "cat": cat})
                except: pass
    return events

@st.cache_data
def get_data():
    df = pd.read_csv(io.StringIO(FULL_CSV_DATA))
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

df_raw, evt_df = get_data()

# 4. 화면 구성
st.markdown("""
    <div class="main-header">
        <div class="logo-box">MJ</div>
        <div class="title-text">2026학년도 서산명지중학교 학사 운영</div>
    </div>
""", unsafe_allow_html=True)

# 다음 주요 일정 카운트다운 (히어로 섹션)
today = datetime.now()
upcoming = evt_df[evt_df['fdate'] >= today].head(1)
if not upcoming.empty:
    next_evt = upcoming.iloc[0]
    days_left = (next_evt['fdate'] - today).days + 1
    st.markdown(f"""
        <div class="hero-card">
            <span class="hero-label">Next Milestone</span>
            <div class="hero-title">{next_evt['title']}</div>
            <div style="font-size: 1.5rem; opacity: 0.7; font-weight: 700;">
                {next_evt['month']}월 {next_evt['date']}일 예정 &nbsp; • &nbsp; <span style="color: #818cf8;">D-{days_left}</span>
            </div>
            <div style="position: absolute; right: -50px; bottom: -50px; font-size: 25rem; font-weight: 900; color: rgba(255,255,255,0.03); font-style: italic;">MYEONGJI</div>
        </div>
    """, unsafe_allow_html=True)

# 메인 그리드 레이아웃
col_cal, col_list = st.columns([2, 1])

with col_cal:
    # 달력 월 선택
    months = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1]
    sel_month = st.select_slider("표시할 달력을 선택하세요", options=months, value=today.month if today.month in months else 3)
    sel_year = 2027 if sel_month <= 2 else 2026
    
    # 달력 HTML 생성
    cal = calendar.Calendar(firstweekday=6)
    month_days = cal.monthdayscalendar(sel_year, sel_month)
    
    html = f"""
    <div class="calendar-container">
        <div class="calendar-header">
            <div>
                <div style="font-size: 0.8rem; font-weight: 900; color: #94a3b8; letter-spacing: 0.3em;">{sel_year} ACADEMIC</div>
                <div class="calendar-month">{sel_month}월</div>
            </div>
            <div style="background: #0f172a; color: white; padding: 1rem 2rem; border-radius: 1.5rem; text-align: right;">
                <div style="font-size: 0.7rem; font-weight: 900; opacity: 0.5;">MONTHLY SCHOOL DAYS</div>
                <div style="font-size: 1.8rem; font-weight: 900;">{int(df_raw[df_raw['월']==sel_month]['월별수업일수'].iloc[0])}일</div>
            </div>
        </div>
        <div class="calendar-grid">
            <div class="weekday-label" style="color: #ef4444;">SUN</div>
            <div class="weekday-label">MON</div><div class="weekday-label">TUE</div><div class="weekday-label">WED</div>
            <div class="weekday-label">THU</div><div class="weekday-label">FRI</div>
            <div class="weekday-label" style="color: #4f46e5;">SAT</div>
    """
    
    for week in month_days:
        for i, day in enumerate(week):
            if day == 0:
                html += '<div class="calendar-day" style="background: #f8fafc;"></div>'
            else:
                day_evts = evt_df[(evt_df['month'] == sel_month) & (evt_df['date'] == day)]
                num_style = ""
                if i == 0: num_style = "color: #ef4444;"
                elif i == 6: num_style = "color: #4f46e5;"
                
                html += f'<div class="calendar-day"><div class="day-number" style="{num_style}">{day}</div>'
                for _, e in day_evts.iterrows():
                    cls = "event-holiday" if e['cat'] == "holiday" else "event-normal"
                    html += f'<div class="event-badge {cls}">{e["title"]}</div>'
                html += '</div>'
    html += "</div></div>"
    st.markdown(html, unsafe_allow_html=True)

with col_list:
    st.markdown('<div class="list-card">', unsafe_allow_html=True)
    st.markdown('<div style="font-size: 1.5rem; font-weight: 900; margin-bottom: 2rem;">다가오는 주요 일정</div>', unsafe_allow_html=True)
    
    list_evts = evt_df[evt_df['fdate'] >= today].head(8)
    for _, row in list_evts.iterrows():
        dday = (row['fdate'] - today).days + 1
        dday_text = "D-DAY" if dday == 0 else f"D-{dday}"
        dday_color = "#ef4444" if dday == 0 else "#0f172a"
        bg_color = "#fff1f2" if row['cat'] == "holiday" else "#f8fafc"
        text_color = "#e11d48" if row['cat'] == "holiday" else "#4338ca"
        
        st.markdown(f"""
            <div class="event-item">
                <div class="date-icon" style="background: {bg_color}; color: {text_color}; border-color: {bg_color}">
                    <div style="font-size: 0.7rem; opacity: 0.6;">{row['month']}월</div>
                    <div style="font-size: 1.5rem;">{row['date']}</div>
                </div>
                <div style="flex-grow: 1;">
                    <div style="font-size: 1.1rem; font-weight: 900; color: #1e293b;">{row['title']}</div>
                    <div style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.3rem;">
                        <span style="font-size: 0.7rem; font-weight: 900; background: {dday_color}; color: white; padding: 0.2rem 0.5rem; border-radius: 4px;">{dday_text}</span>
                        <span style="font-size: 0.7rem; font-weight: 700; color: #94a3b8;">{sel_year}학년도</span>
                    </div>
                </div>
            </div>
        """, unsafe_allow_html=True)
    st.markdown('</div>', unsafe_allow_html=True)

    # 수업일수 요약 카드
    total_school_days = int(df_raw['월별수업일수'].unique().sum())
    st.markdown(f"""
        <div style="background: #4f46e5; color: white; padding: 2.5rem; border-radius: 3rem; margin-top: 2rem; box-shadow: 0 20px 25px -5px rgba(79, 70, 229, 0.2);">
            <div style="font-size: 0.8rem; font-weight: 900; opacity: 0.6; letter-spacing: 0.1em; margin-bottom: 0.5rem;">2026학년도 총 수업일수</div>
            <div style="display: flex; align-items: baseline; gap: 0.5rem;">
                <span style="font-size: 4.5rem; font-weight: 900;">{total_school_days}</span>
                <span style="font-size: 1.5rem; font-weight: 700; opacity: 0.8;">일</span>
            </div>
        </div>
    """, unsafe_allow_html=True)
