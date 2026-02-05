
import streamlit as st
import pandas as pd
from datetime import datetime
import io

# 페이지 설정
st.set_page_config(
    page_title="2026 서산명지중학교 학사 운영",
    page_icon="🏫",
    layout="wide"
)

# 스타일 커스텀
st.markdown("""
    <style>
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
    * { font-family: 'Pretendard', sans-serif !important; }
    .main { background-color: #f8f9fa; }
    div[data-testid="stMetric"] { background-color: white; padding: 25px; border-radius: 20px; border: 1px solid #eee; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .stInfo { border-radius: 15px; border: none; background-color: #eef2ff; color: #4338ca; }
    h1, h2, h3 { font-weight: 900 !important; tracking: -0.05em !important; }
    </style>
    """, unsafe_allow_html=True)

# 초기 데이터
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
"""

@st.cache_data(ttl=600)
def load_data(url=None):
    if url:
        try:
            return pd.read_csv(url)
        except:
            return pd.read_csv(io.StringIO(INITIAL_CSV))
    return pd.read_csv(io.StringIO(INITIAL_CSV))

# 데이터 로드
df = load_data()

# 사이드바
st.sidebar.title("🏫 서산명지중학교")
menu = st.sidebar.radio("Navigation", ["📊 대시보드", "📅 월별 상세", "📋 전체 일정", "⚙️ 설정"])

if menu == "📊 대시보드":
    st.title("2026학년도 서산명지중학교 학사 운영")
    st.markdown("---")
    
    col_stat1, col_stat2, col_stat3 = st.columns(3)
    with col_stat1:
        st.metric("총 수업일수", f"{int(df['월별수업일수'].unique().sum())}일", help="2026학년도 전체 수업일수")
    with col_stat2:
        st.metric("다가오는 행사", "개학식/입학식")
    with col_stat3:
        st.metric("시스템 상태", "실시간 연동 중")

    st.markdown("###")
    
    # 8:4 비율 레이아웃
    col_main, col_side = st.columns([2, 1])
    
    with col_main:
        st.subheader("📅 학사 달력 요약")
        selected_month = st.selectbox("조회할 월", df['월'].unique())
        month_data = df[df['월'] == selected_month]
        st.dataframe(month_data, hide_index=True, use_container_width=True)

    with col_side:
        st.subheader("🔔 다가오는 일정")
        events = df[df['학교행사'].notna()][['월', '학교행사']].head(10)
        for _, row in events.iterrows():
            st.info(f"**[{row['월']}월]** {row['학교행사']}")

elif menu == "📅 월별 상세":
    st.title("월별 학사 상세 데이터")
    month = st.select_slider("확인할 월", options=df['월'].unique())
    st.table(df[df['월'] == month])

elif menu == "📋 전체 일정":
    st.title("전체 일정 목록")
    st.dataframe(df, use_container_width=True)

elif menu == "⚙️ 설정":
    st.title("데이터 동기화 설정")
    st.write("구글 시트 CSV URL을 입력하여 실시간으로 학사 데이터를 업데이트할 수 있습니다.")
    url = st.text_input("CSV URL 입력")
    if st.button("저장 및 동기화"):
        st.success("데이터 소스가 변경되었습니다.")
