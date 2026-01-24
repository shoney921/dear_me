"""
시드 데이터 콘텐츠 - 일기, 페르소나, 채팅 메시지 등의 샘플 데이터
"""

# 테스트 유저 정보
USERS = [
    {"email": "user1@test.com", "username": "김철수", "profile_image": None},
    {"email": "user2@test.com", "username": "이영희", "profile_image": None},
    {"email": "user3@test.com", "username": "박민수", "profile_image": None},
    {"email": "user4@test.com", "username": "정수진", "profile_image": None},
    {"email": "user5@test.com", "username": "최동현", "profile_image": None},
    {"email": "user6@test.com", "username": "강지원", "profile_image": None},
    {"email": "user7@test.com", "username": "윤서연", "profile_image": None},
    {"email": "user8@test.com", "username": "임재현", "profile_image": None},
    {"email": "user9@test.com", "username": "한소희", "profile_image": None},
    {"email": "user10@test.com", "username": "오민석", "profile_image": None},
]

# 일기 콘텐츠 (유저당 8개씩 = 80개)
DIARY_CONTENTS = [
    # 유저 1 (김철수) - 개발자
    [
        {"title": "새로운 프로젝트 시작", "content": "오늘 회사에서 새로운 프로젝트를 맡게 되었다. React와 FastAPI를 사용하는 풀스택 개발이라 기대가 된다. 팀원들과 킥오프 미팅을 했는데 다들 열정적이어서 좋았다.", "mood": "excited", "weather": "sunny"},
        {"title": "버그와의 전쟁", "content": "하루 종일 버그 잡느라 정신없었다. 알고 보니 타입 에러였다. TypeScript를 쓰면서도 이런 실수를 하다니... 그래도 결국 해결해서 뿌듯하다.", "mood": "tired", "weather": "cloudy"},
        {"title": "코드 리뷰 받은 날", "content": "선배 개발자한테 코드 리뷰를 받았다. 내 코드에 대해 좋은 피드백도 있었지만 개선점도 많이 지적받았다. 덕분에 많이 배웠다. 더 열심히 해야지.", "mood": "neutral", "weather": "rainy"},
        {"title": "재택근무의 행복", "content": "오늘은 재택근무 하는 날! 집에서 편하게 일하니까 집중도 잘 되고 좋다. 점심에 직접 요리해서 먹으니까 건강한 것 같기도 하고.", "mood": "happy", "weather": "sunny"},
        {"title": "회식이 있던 날", "content": "오랜만에 팀 회식을 했다. 고기 실컷 먹고 2차로 노래방도 갔다. 평소에 말 안 하던 팀원들이랑도 친해진 것 같아서 좋았다.", "mood": "happy", "weather": "clear"},
        {"title": "야근의 날", "content": "오늘 배포 전 마지막 점검이라 야근했다. 새벽까지 일했더니 피곤하다. 그래도 무사히 배포 완료해서 다행이다. 내일은 푹 쉬어야지.", "mood": "exhausted", "weather": "night"},
        {"title": "새로운 기술 공부", "content": "요즘 AI 기술에 관심이 생겨서 LangChain 공부를 시작했다. 생각보다 재밌다. 나중에 사이드 프로젝트에 적용해보고 싶다.", "mood": "curious", "weather": "cloudy"},
        {"title": "주말 프로젝트", "content": "주말에 개인 프로젝트를 진행했다. 간단한 투두 앱인데 배운 걸 복습하는 느낌이라 좋다. 다음 주에는 배포까지 해봐야겠다.", "mood": "satisfied", "weather": "sunny"},
    ],
    # 유저 2 (이영희) - 디자이너
    [
        {"title": "새 프로젝트 디자인 시작", "content": "오늘 새로운 앱 디자인 프로젝트를 시작했다. 컬러 팔레트를 고르는데 한참 고민했다. 결국 따뜻한 느낌의 파스텔 톤으로 결정!", "mood": "creative", "weather": "sunny"},
        {"title": "피그마로 프로토타입", "content": "하루 종일 피그마로 프로토타입 작업을 했다. 손목이 좀 아프지만 결과물이 마음에 들어서 뿌듯하다.", "mood": "satisfied", "weather": "cloudy"},
        {"title": "사용자 피드백 받은 날", "content": "사용성 테스트를 진행했는데 예상치 못한 피드백이 많았다. 내가 당연하다고 생각한 것들이 사용자에겐 어려웠다니... 많이 배웠다.", "mood": "thoughtful", "weather": "rainy"},
        {"title": "디자인 컨퍼런스 참석", "content": "오늘 디자인 컨퍼런스에 다녀왔다. 유명 디자이너들의 강연을 듣고 영감을 많이 받았다. 나도 저렇게 되고 싶다.", "mood": "inspired", "weather": "sunny"},
        {"title": "팀 브레인스토밍", "content": "개발팀, 기획팀과 함께 브레인스토밍을 했다. 다양한 의견이 나와서 재밌었다. 역시 협업의 힘이란!", "mood": "energetic", "weather": "clear"},
        {"title": "디자인 시스템 정리", "content": "오늘은 디자인 시스템을 정리하는 날. 컴포넌트들을 체계적으로 정리하니까 앞으로 작업이 훨씬 편해질 것 같다.", "mood": "organized", "weather": "cloudy"},
        {"title": "일러스트 작업", "content": "오랜만에 일러스트 작업을 했다. 앱에 들어갈 귀여운 캐릭터를 그렸는데 반응이 좋아서 기분이 좋다.", "mood": "happy", "weather": "sunny"},
        {"title": "포트폴리오 업데이트", "content": "주말에 포트폴리오를 업데이트했다. 최근 작업물들을 정리하고 새로운 케이스 스터디도 추가했다. 뿌듯!", "mood": "accomplished", "weather": "clear"},
    ],
    # 유저 3 (박민수) - 대학생
    [
        {"title": "시험공부 시작", "content": "다음 주 중간고사라 도서관에서 공부했다. 집중이 잘 안 되지만 그래도 열심히 했다. 커피가 점점 늘어나고 있다...", "mood": "stressed", "weather": "cloudy"},
        {"title": "동아리 활동", "content": "오늘 밴드 동아리 연습이 있었다. 다음 달 공연 준비 중인데 점점 실력이 느는 것 같아서 뿌듯하다.", "mood": "happy", "weather": "sunny"},
        {"title": "아르바이트 첫날", "content": "카페 아르바이트 첫날! 긴장했지만 선배들이 잘 알려줘서 다행이었다. 커피 만드는 게 생각보다 어렵다.", "mood": "nervous", "weather": "clear"},
        {"title": "친구들과 MT", "content": "학과 MT를 다녀왔다. 바베큐도 먹고 밤새 얘기하면서 친구들과 더 가까워진 것 같다. 피곤하지만 행복하다.", "mood": "joyful", "weather": "sunny"},
        {"title": "교수님과 면담", "content": "진로 상담 받으러 교수님을 만났다. 내 고민을 들어주시고 좋은 조언을 해주셨다. 앞으로의 방향이 조금 보이는 것 같다.", "mood": "hopeful", "weather": "cloudy"},
        {"title": "시험 끝!", "content": "드디어 시험이 끝났다!! 결과는 모르겠지만 일단 해방이다. 친구들이랑 치킨 먹으러 갔다. 맛있었다!", "mood": "relieved", "weather": "sunny"},
        {"title": "도서관에서 하루", "content": "오늘은 도서관에서 과제했다. 레포트 마감이 다가오니까 급해진다. 그래도 열심히 해서 제출은 했다!", "mood": "focused", "weather": "rainy"},
        {"title": "봉사활동", "content": "봉사활동으로 아이들 공부 가르쳐줬다. 아이들이 너무 귀여웠다. 보람찬 하루였다.", "mood": "fulfilled", "weather": "sunny"},
    ],
    # 유저 4 (정수진) - 직장인
    [
        {"title": "월요병", "content": "오늘도 어김없이 월요병이 찾아왔다. 주말이 너무 짧았다. 출근길 지하철에서 졸았다. 커피 두 잔 마셨는데도 피곤하다.", "mood": "tired", "weather": "cloudy"},
        {"title": "프레젠테이션 성공", "content": "오늘 중요한 프레젠테이션이 있었는데 성공적으로 끝났다! 팀장님한테 칭찬도 받았다. 오랜만에 기분 좋은 하루.", "mood": "proud", "weather": "sunny"},
        {"title": "점심시간의 여유", "content": "오늘 점심에 회사 근처 새로 생긴 맛집을 갔다. 파스타가 정말 맛있었다. 가끔은 이런 여유도 필요하다.", "mood": "content", "weather": "clear"},
        {"title": "야근 후 집에서", "content": "오늘도 야근했다. 집에 와서 편의점 음식으로 저녁 먹었다. 언제쯤 여유로운 삶을 살 수 있을까.", "mood": "exhausted", "weather": "night"},
        {"title": "팀 점심 회식", "content": "팀 회식으로 한정식을 먹었다. 오랜만에 맛있는 한식이라 좋았다. 동료들이랑 얘기하며 스트레스도 좀 풀렸다.", "mood": "relaxed", "weather": "sunny"},
        {"title": "연차 쓴 날", "content": "드디어 연차 사용! 아침에 늦잠 자고 카페 가서 책 읽었다. 아무것도 안 해도 되는 게 이렇게 행복할 줄이야.", "mood": "blissful", "weather": "sunny"},
        {"title": "새 프로젝트 배정", "content": "새로운 프로젝트에 배정됐다. 좀 어려워 보이지만 도전해볼 만할 것 같다. 잘 해내고 싶다.", "mood": "determined", "weather": "cloudy"},
        {"title": "금요일 저녁", "content": "드디어 불금! 친구들 만나서 맥주 마시고 수다 떨었다. 일주일의 피로가 다 풀리는 것 같다.", "mood": "happy", "weather": "clear"},
    ],
    # 유저 5 (최동현) - 프리랜서
    [
        {"title": "새 클라이언트 미팅", "content": "오늘 새 클라이언트와 미팅을 했다. 프로젝트가 흥미로워 보인다. 계약이 잘 됐으면 좋겠다.", "mood": "hopeful", "weather": "sunny"},
        {"title": "재택 작업의 장단점", "content": "집에서 일하니까 편하긴 한데 집중이 안 될 때가 있다. 오늘은 카페에서 일해봤는데 확실히 더 집중됐다.", "mood": "focused", "weather": "cloudy"},
        {"title": "마감 압박", "content": "마감이 내일인데 아직 끝내지 못했다. 밤새워야 할 것 같다. 프리랜서의 숙명인가...", "mood": "anxious", "weather": "night"},
        {"title": "프로젝트 완료!", "content": "드디어 프로젝트를 끝냈다! 클라이언트도 만족해해서 다행이다. 오늘은 푹 쉬어야지.", "mood": "relieved", "weather": "sunny"},
        {"title": "운동 시작", "content": "오랜만에 헬스장 등록했다. 재택하면서 살이 많이 쪘다. 건강도 챙겨야지.", "mood": "motivated", "weather": "clear"},
        {"title": "네트워킹 모임", "content": "프리랜서 모임에 나갔다. 같은 업계 사람들 만나니까 좋다. 좋은 정보도 얻고 영감도 받았다.", "mood": "energized", "weather": "sunny"},
        {"title": "세금 정리", "content": "종합소득세 신고 준비하느라 서류 정리했다. 프리랜서의 고충... 그래도 꼭 해야 하니까.", "mood": "neutral", "weather": "cloudy"},
        {"title": "여유로운 주말", "content": "이번 주는 프로젝트가 없어서 여유롭다. 밀린 드라마도 보고 낮잠도 자고. 재충전하는 느낌.", "mood": "peaceful", "weather": "sunny"},
    ],
    # 유저 6 (강지원) - 고등학생
    [
        {"title": "학원 가는 날", "content": "오늘도 학원... 수학이 너무 어렵다. 선생님 설명 들을 땐 알겠는데 혼자 풀면 모르겠다.", "mood": "confused", "weather": "cloudy"},
        {"title": "친구랑 다툼", "content": "오늘 친한 친구랑 사소한 일로 다퉜다. 지금 생각하면 별일 아닌데... 내일 화해해야지.", "mood": "sad", "weather": "rainy"},
        {"title": "체육대회", "content": "학교 체육대회였다! 우리 반이 축구에서 이겼다. 다 같이 소리 지르면서 응원하니까 너무 재밌었다.", "mood": "excited", "weather": "sunny"},
        {"title": "급식이 맛있던 날", "content": "오늘 급식 메뉴가 내가 좋아하는 치킨이었다. 급식 맛있는 날은 하루가 행복해진다.", "mood": "happy", "weather": "clear"},
        {"title": "모의고사 결과", "content": "모의고사 성적 나왔는데 생각보다 잘 나왔다! 열심히 한 보람이 있다. 더 열심히 해야지.", "mood": "proud", "weather": "sunny"},
        {"title": "자습시간", "content": "야자 시간에 공부했다. 집중하기 힘들었지만 그래도 열심히 했다. 대학 가면 뭐하고 싶을까 생각했다.", "mood": "pensive", "weather": "night"},
        {"title": "선생님과 상담", "content": "진로상담 했다. 아직 뭘 하고 싶은지 잘 모르겠지만 여러 가지 알아보라고 하셨다.", "mood": "thoughtful", "weather": "cloudy"},
        {"title": "주말 자유시간", "content": "드디어 주말! 친구들이랑 PC방 가서 게임하고 떡볶이 먹었다. 평일 공부 스트레스가 다 풀렸다.", "mood": "refreshed", "weather": "sunny"},
    ],
    # 유저 7 (윤서연) - 주부
    [
        {"title": "아이들 등교시키고", "content": "오늘도 아침부터 정신없이 아이들 학교 보내고 집안일 했다. 점심 먹고 잠깐 쉬는 이 시간이 소중하다.", "mood": "tired", "weather": "sunny"},
        {"title": "새로운 레시피 도전", "content": "유튜브에서 본 레시피로 요리해봤다. 가족들이 맛있다고 해서 뿌듯했다. 요리가 취미가 되어가는 것 같다.", "mood": "satisfied", "weather": "cloudy"},
        {"title": "아이 학부모 상담", "content": "아이 학부모 상담 다녀왔다. 선생님이 아이가 밝고 착하다고 해서 기분이 좋았다. 잘 자라주고 있구나.", "mood": "happy", "weather": "clear"},
        {"title": "나만의 시간", "content": "아이들 학원 가 있는 동안 카페에서 커피 마시며 책 읽었다. 이런 여유로운 시간이 정말 좋다.", "mood": "peaceful", "weather": "sunny"},
        {"title": "장보기", "content": "마트 가서 일주일치 장을 봤다. 짐이 무거웠지만 냉장고 가득 채우니까 뿌듯하다.", "mood": "accomplished", "weather": "cloudy"},
        {"title": "가족 나들이", "content": "주말에 가족들과 근교 나들이 갔다. 날씨도 좋고 아이들도 신나해서 행복한 하루였다.", "mood": "joyful", "weather": "sunny"},
        {"title": "집안 대청소", "content": "오늘은 대청소 하는 날. 힘들었지만 깨끗해진 집을 보니까 기분이 좋다.", "mood": "refreshed", "weather": "clear"},
        {"title": "친구와 수다", "content": "오랜만에 친구 만나서 커피 마시며 수다 떨었다. 육아 얘기, 남편 얘기... 시간 가는 줄 몰랐다.", "mood": "cheerful", "weather": "sunny"},
    ],
    # 유저 8 (임재현) - 신입사원
    [
        {"title": "첫 출근", "content": "드디어 첫 출근! 긴장되고 설레는 하루였다. 선배들이 잘 챙겨줘서 다행이다. 회사생활 잘할 수 있겠지?", "mood": "nervous", "weather": "sunny"},
        {"title": "업무 배우는 중", "content": "아직 모르는 게 너무 많다. 선배한테 계속 물어보니까 좀 눈치 보인다. 빨리 적응해야 하는데.", "mood": "anxious", "weather": "cloudy"},
        {"title": "첫 프로젝트 참여", "content": "처음으로 프로젝트에 참여하게 됐다! 아직 하는 일은 적지만 배우는 게 많다. 열심히 해야지.", "mood": "eager", "weather": "clear"},
        {"title": "야근 경험", "content": "처음으로 야근했다. 힘들었지만 선배들이랑 같이 일하니까 동료 의식이 생기는 것 같다.", "mood": "tired", "weather": "night"},
        {"title": "점심시간의 고민", "content": "점심 메뉴 고르는 게 의외로 스트레스다. 선배들 따라다니기도 그렇고... 그래도 맛집을 많이 알게 됐다.", "mood": "neutral", "weather": "sunny"},
        {"title": "실수한 날", "content": "오늘 업무 중에 실수를 했다. 다행히 선배가 커버해줬지만 너무 죄송했다. 다시는 같은 실수 안 하리라.", "mood": "embarrassed", "weather": "rainy"},
        {"title": "월급날!", "content": "첫 월급을 받았다! 부모님께 용돈도 드리고 친구들 밥도 사줬다. 이 맛에 직장생활 하는 거구나.", "mood": "happy", "weather": "sunny"},
        {"title": "주말 회복", "content": "주말에 푹 쉬었다. 집에서 넷플릭스 보면서 빈둥빈둥. 다음 주 또 화이팅!", "mood": "rested", "weather": "cloudy"},
    ],
    # 유저 9 (한소희) - 작가
    [
        {"title": "글이 안 써지는 날", "content": "하루 종일 컴퓨터 앞에 앉아 있었는데 글이 안 나온다. 슬럼프인가... 산책이라도 해야겠다.", "mood": "frustrated", "weather": "cloudy"},
        {"title": "영감을 받은 날", "content": "카페에서 본 장면이 영감을 줬다. 바로 메모하고 집에 와서 글 썼다. 오랜만에 술술 써져서 기분 좋다.", "mood": "inspired", "weather": "sunny"},
        {"title": "원고 마감", "content": "드디어 원고 제출했다! 오래 걸렸지만 만족스럽게 마무리했다. 편집자님 피드백이 궁금하다.", "mood": "relieved", "weather": "clear"},
        {"title": "독자 후기", "content": "오늘 독자분이 보내준 후기를 읽었다. 내 글이 누군가에게 위로가 됐다니... 글 쓰는 이유를 다시 느꼈다.", "mood": "touched", "weather": "sunny"},
        {"title": "북토크 행사", "content": "작은 서점에서 북토크를 했다. 독자분들을 직접 만나니까 색다른 경험이었다. 질문도 많이 받았다.", "mood": "grateful", "weather": "cloudy"},
        {"title": "자료 조사", "content": "새 작품을 위해 자료 조사 중이다. 도서관에서 관련 책을 잔뜩 빌려왔다. 읽을 게 많다.", "mood": "curious", "weather": "rainy"},
        {"title": "글쓰기 루틴", "content": "아침에 일어나서 커피 마시고 글 쓰는 루틴이 좋다. 오늘도 2000자 정도 썼다. 꾸준함이 중요하다.", "mood": "disciplined", "weather": "sunny"},
        {"title": "새 아이디어", "content": "잠들기 전에 좋은 아이디어가 떠올랐다! 바로 일어나서 메모했다. 이걸로 단편 하나 쓸 수 있을 것 같다.", "mood": "excited", "weather": "night"},
    ],
    # 유저 10 (오민석) - 요리사
    [
        {"title": "바쁜 주방", "content": "오늘 손님이 정말 많았다. 눈코 뜰 새 없이 요리했다. 다리가 아프지만 보람찬 하루였다.", "mood": "exhausted", "weather": "night"},
        {"title": "새 메뉴 개발", "content": "새로운 파스타 레시피를 테스트했다. 동료들 반응이 좋아서 메뉴에 넣을 것 같다. 기대된다.", "mood": "creative", "weather": "cloudy"},
        {"title": "식재료 구매", "content": "새벽에 시장 가서 신선한 재료 골랐다. 좋은 재료가 맛있는 요리의 기본이니까.", "mood": "focused", "weather": "dawn"},
        {"title": "손님 칭찬", "content": "오늘 손님이 직접 주방에 와서 음식이 맛있다고 했다. 이런 순간이 요리사로서 가장 행복하다.", "mood": "proud", "weather": "sunny"},
        {"title": "쉬는 날 집밥", "content": "쉬는 날인데 집에서 요리했다. 역시 일할 때랑 다르게 여유롭게 하니까 더 맛있는 것 같다.", "mood": "relaxed", "weather": "clear"},
        {"title": "요리 대회 준비", "content": "다음 달 요리 대회에 나가기로 했다. 준비할 게 많지만 좋은 경험이 될 것 같다.", "mood": "determined", "weather": "sunny"},
        {"title": "후배 교육", "content": "새로 온 후배에게 칼질 가르쳐줬다. 처음 배울 때 내 모습이 생각났다. 열심히 하더라.", "mood": "nostalgic", "weather": "cloudy"},
        {"title": "특별한 손님", "content": "오늘 유명인이 가게에 왔다. 긴장했지만 요리에 집중했다. 다행히 만족하신 것 같아서 안심이다.", "mood": "relieved", "weather": "sunny"},
    ],
]

# 페르소나 템플릿
PERSONA_TEMPLATES = [
    # 유저 1 (김철수)
    {
        "name": "개발하는 철수",
        "personality": "논리적이고 문제 해결을 좋아하는 성격. 새로운 기술에 관심이 많고 끊임없이 학습하는 것을 즐긴다. 가끔 야근에 지치기도 하지만 코딩에서 재미를 찾는다.",
        "traits": '["논리적", "호기심 많음", "열정적", "꼼꼼함", "인내심"]',
        "speaking_style": "친근하면서도 논리적인 말투. 기술 용어를 자주 쓰지만 쉽게 설명하려고 노력한다. '~인 것 같아요', '저도 그런 경험이 있어요' 같은 표현을 자주 사용.",
    },
    # 유저 2 (이영희)
    {
        "name": "감각적인 영희",
        "personality": "창의적이고 감각적인 성격. 아름다운 것을 만들어내는 것에서 행복을 느낀다. 사용자 경험에 대해 깊이 고민하고 디테일에 신경 쓴다.",
        "traits": '["창의적", "감각적", "섬세함", "공감능력", "열린 마음"]',
        "speaking_style": "밝고 긍정적인 말투. 비주얼적인 표현을 자주 사용하고 감정을 풍부하게 표현한다. '그 느낌 완전 이해해요!', '색감이 예쁘지 않아요?' 같은 표현 선호.",
    },
    # 유저 3 (박민수)
    {
        "name": "열정 대학생 민수",
        "personality": "에너지 넘치고 호기심 많은 대학생. 공부와 동아리, 아르바이트를 병행하며 바쁘게 지낸다. 친구들과의 시간을 소중히 여긴다.",
        "traits": '["활발함", "사교적", "낙천적", "도전정신", "의리"]',
        "speaking_style": "젊고 활기찬 말투. 유행어나 줄임말을 가끔 사용한다. '대박!', '진짜?', '아 그거 알아!' 같은 반응을 자주 한다.",
    },
    # 유저 4 (정수진)
    {
        "name": "직장인 수진",
        "personality": "책임감 있고 성실한 직장인. 일과 삶의 균형을 찾으려 노력하지만 쉽지 않다. 작은 행복에서 위안을 찾는다.",
        "traits": '["책임감", "성실함", "인내심", "현실적", "배려심"]',
        "speaking_style": "차분하고 공감 잘 해주는 말투. '저도 그래요', '힘들죠?' 같은 공감 표현을 자주 사용. 조언할 때는 부드럽게 말한다.",
    },
    # 유저 5 (최동현)
    {
        "name": "자유로운 동현",
        "personality": "자유분방하고 독립적인 프리랜서. 자기만의 페이스로 일하는 것을 좋아하지만 마감 압박에 시달리기도 한다. 다양한 경험을 추구한다.",
        "traits": '["독립적", "자유로움", "도전적", "적응력", "창의성"]',
        "speaking_style": "편안하고 자유로운 말투. 자신의 경험담을 많이 공유한다. '저는 이렇게 해봤는데요', '각자 스타일이 있죠' 같은 표현 선호.",
    },
    # 유저 6 (강지원)
    {
        "name": "고딩 지원이",
        "personality": "열심히 공부하면서도 친구들과의 시간을 소중히 여기는 고등학생. 미래에 대한 고민도 있지만 현재를 즐기려 한다.",
        "traits": '["순수함", "노력파", "친구 사랑", "호기심", "성장 중"]',
        "speaking_style": "솔직하고 귀여운 말투. 학생 특유의 표현을 사용한다. '헐 진짜?', '아 몰라 모르겠어', '그거 완전 공감' 같은 표현.",
    },
    # 유저 7 (윤서연)
    {
        "name": "따뜻한 서연",
        "personality": "가족을 사랑하고 일상의 소소한 행복을 아는 주부. 요리가 취미이고 아이들의 성장을 지켜보는 것이 가장 큰 보람이다.",
        "traits": '["따뜻함", "헌신적", "살림꾼", "긍정적", "인내심"]',
        "speaking_style": "다정하고 포근한 말투. 격려와 응원의 말을 자주 한다. '괜찮아요, 잘하고 있어요', '맛있는 거 먹으면 기분 좋아져요' 같은 표현.",
    },
    # 유저 8 (임재현)
    {
        "name": "새내기 재현",
        "personality": "모든 것이 새롭고 배울 게 많은 신입사원. 실수도 하지만 긍정적으로 성장하려 한다. 회사생활에 적응하며 조금씩 자신감을 얻어간다.",
        "traits": '["겸손함", "배우려는 자세", "긍정적", "적응력", "성실함"]',
        "speaking_style": "공손하면서도 친근한 말투. 질문을 많이 하고 배우려는 자세. '그렇군요!', '저도 배워볼게요', '선배님들 덕분이에요' 같은 표현.",
    },
    # 유저 9 (한소희)
    {
        "name": "감성 작가 소희",
        "personality": "세상을 글로 표현하는 작가. 관찰력이 뛰어나고 감정이 풍부하다. 슬럼프를 겪기도 하지만 글쓰기에서 의미를 찾는다.",
        "traits": '["감성적", "관찰력", "표현력", "내향적", "깊이 있음"]',
        "speaking_style": "문학적이고 감성적인 말투. 은유적 표현을 좋아한다. '그 마음 알 것 같아요', '그것도 하나의 이야기네요' 같은 표현 선호.",
    },
    # 유저 10 (오민석)
    {
        "name": "열정 셰프 민석",
        "personality": "요리에 열정을 쏟는 요리사. 좋은 재료와 정성이 최고의 음식을 만든다고 믿는다. 손님의 만족이 가장 큰 보람이다.",
        "traits": '["열정적", "장인정신", "체력적", "꼼꼼함", "친절함"]',
        "speaking_style": "활기차고 열정적인 말투. 음식 비유를 자주 사용한다. '인생도 요리처럼 정성이 중요해요', '맛있는 것 앞에선 행복해지잖아요' 같은 표현.",
    },
]

# 채팅 메시지 샘플
CHAT_MESSAGES_SAMPLES = [
    # 자기 페르소나와의 대화 (5개 채팅)
    {
        "messages": [
            {"is_user": True, "content": "오늘 좀 힘들었어..."},
            {"is_user": False, "content": "무슨 일 있었어요? 힘든 날도 있죠. 저한테 얘기해보세요."},
            {"is_user": True, "content": "일이 많아서 야근했거든"},
            {"is_user": False, "content": "야근이라니 고생 많았어요. 오늘 하루 정말 수고했어요. 맛있는 거 먹으면서 쉬세요!"},
        ]
    },
    {
        "messages": [
            {"is_user": True, "content": "요즘 고민이 있어"},
            {"is_user": False, "content": "어떤 고민인데요? 제가 들어볼게요."},
            {"is_user": True, "content": "진로에 대해서 고민이 많아"},
            {"is_user": False, "content": "진로 고민은 누구나 하는 거예요. 조급해하지 말고 천천히 생각해봐요. 뭘 할 때 가장 행복해요?"},
            {"is_user": True, "content": "글 쓸 때? 아니면 사람들 만날 때?"},
            {"is_user": False, "content": "둘 다 좋은 거잖아요! 글도 쓰고 사람도 만나는 일, 예를 들면 에디터나 기자 같은 건 어때요?"},
        ]
    },
    {
        "messages": [
            {"is_user": True, "content": "오늘 좋은 일이 있었어!"},
            {"is_user": False, "content": "진짜요? 뭔데요? 빨리 얘기해주세요!"},
            {"is_user": True, "content": "프로젝트가 성공적으로 끝났어"},
            {"is_user": False, "content": "우와 축하해요! 정말 대단해요. 그동안 열심히 한 보람이 있네요!"},
        ]
    },
    {
        "messages": [
            {"is_user": True, "content": "심심해..."},
            {"is_user": False, "content": "저랑 얘기하니까 심심하지 않죠? 뭐 해볼까요?"},
            {"is_user": True, "content": "뭐 하면 좋을까?"},
            {"is_user": False, "content": "산책 가는 건 어때요? 바람 쐬면 기분이 좋아져요. 아니면 맛있는 거 먹으러 가는 것도 좋고요!"},
        ]
    },
    {
        "messages": [
            {"is_user": True, "content": "나에 대해 어떻게 생각해?"},
            {"is_user": False, "content": "일기를 보면 정말 열심히 사시는 것 같아요. 힘든 날도 있지만 항상 긍정적으로 이겨내시잖아요."},
            {"is_user": True, "content": "그렇게 생각해?"},
            {"is_user": False, "content": "네! 저는 당신의 일기를 통해 알게 됐지만, 정말 멋진 사람이라고 생각해요."},
        ]
    },
]

# 친구 페르소나와의 대화 샘플
FRIEND_CHAT_MESSAGES_SAMPLES = [
    {
        "messages": [
            {"is_user": True, "content": "안녕! 오늘 어땠어?"},
            {"is_user": False, "content": "안녕하세요! 오늘도 바빴지만 보람찬 하루였어요. 당신은요?"},
            {"is_user": True, "content": "나도 좀 바빴어. 근데 친구 페르소나랑 대화하니까 신기하다"},
            {"is_user": False, "content": "하하 저도 신기해요! 이렇게 대화할 수 있다니. 좋은 경험이네요."},
        ]
    },
    {
        "messages": [
            {"is_user": True, "content": "요즘 뭐하고 지내?"},
            {"is_user": False, "content": "저요? 일기 주인이 열심히 살고 있어서 저도 덩달아 바빠요!"},
            {"is_user": True, "content": "재밌다 ㅋㅋ"},
            {"is_user": False, "content": "맞아요, 이런 대화 재밌죠? 가끔 이렇게 얘기해요!"},
        ]
    },
    {
        "messages": [
            {"is_user": True, "content": "조언 좀 해줄 수 있어?"},
            {"is_user": False, "content": "물론이죠! 어떤 건데요?"},
            {"is_user": True, "content": "요즘 스트레스를 많이 받아서..."},
            {"is_user": False, "content": "스트레스는 누구나 받죠. 저도... 아니 일기 주인도 그런 날이 많았어요. 잠시 쉬어가는 것도 방법이에요."},
        ]
    },
]

# 알림 템플릿
NOTIFICATION_TEMPLATES = [
    {"type": "friend_request", "title": "새로운 친구 요청", "content": "{username}님이 친구 요청을 보냈습니다."},
    {"type": "friend_accepted", "title": "친구 요청 수락됨", "content": "{username}님이 친구 요청을 수락했습니다."},
    {"type": "diary_reminder", "title": "일기 작성 알림", "content": "오늘의 일기를 작성해보세요!"},
    {"type": "persona_updated", "title": "페르소나 업데이트", "content": "새로운 일기를 바탕으로 페르소나가 업데이트되었습니다."},
]
