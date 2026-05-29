// 단어/문장 데이터 (초등 고학년 ~ 중학생 수준)
// 각 항목: { en: 영어, ko: 뜻 }
// 받아쓰기·따라쓰기·단어 연습에 공통으로 사용한다.

const WORD_SETS = [
  {
    id: "alphabet-lower",
    title: "알파벳 (소문자)",
    level: "기초",
    items: "a b c d e f g h i j k l m n o p q r s t u v w x y z"
      .split(" ").map((c) => ({ en: c, ko: "소문자 " + c.toUpperCase() })),
  },
  {
    id: "alphabet-upper",
    title: "알파벳 (대문자)",
    level: "기초",
    items: "A B C D E F G H I J K L M N O P Q R S T U V W X Y Z"
      .split(" ").map((c) => ({ en: c, ko: "대문자 " + c })),
  },
  {
    id: "numbers",
    title: "숫자",
    level: "기초",
    items: [
      { en: "one", ko: "1, 하나" },
      { en: "two", ko: "2, 둘" },
      { en: "three", ko: "3, 셋" },
      { en: "four", ko: "4, 넷" },
      { en: "five", ko: "5, 다섯" },
      { en: "six", ko: "6, 여섯" },
      { en: "seven", ko: "7, 일곱" },
      { en: "eight", ko: "8, 여덟" },
      { en: "nine", ko: "9, 아홉" },
      { en: "ten", ko: "10, 열" },
      { en: "eleven", ko: "11, 열하나" },
      { en: "twelve", ko: "12, 열둘" },
      { en: "twenty", ko: "20, 스물" },
      { en: "hundred", ko: "100, 백" },
    ],
  },
  {
    id: "days-months",
    title: "요일·월",
    level: "기초",
    items: [
      { en: "Monday", ko: "월요일" },
      { en: "Tuesday", ko: "화요일" },
      { en: "Wednesday", ko: "수요일" },
      { en: "Thursday", ko: "목요일" },
      { en: "Friday", ko: "금요일" },
      { en: "Saturday", ko: "토요일" },
      { en: "Sunday", ko: "일요일" },
      { en: "January", ko: "1월" },
      { en: "February", ko: "2월" },
      { en: "March", ko: "3월" },
      { en: "April", ko: "4월" },
      { en: "August", ko: "8월" },
    ],
  },
  {
    id: "school",
    title: "학교·일상",
    level: "초급",
    items: [
      { en: "teacher", ko: "선생님" },
      { en: "student", ko: "학생" },
      { en: "pencil", ko: "연필" },
      { en: "notebook", ko: "공책" },
      { en: "classroom", ko: "교실" },
      { en: "homework", ko: "숙제" },
      { en: "library", ko: "도서관" },
      { en: "lunch", ko: "점심" },
      { en: "friend", ko: "친구" },
      { en: "question", ko: "질문" },
      { en: "answer", ko: "대답" },
      { en: "computer", ko: "컴퓨터" },
    ],
  },
  {
    id: "verbs",
    title: "자주 쓰는 동사",
    level: "초급",
    items: [
      { en: "read", ko: "읽다" },
      { en: "write", ko: "쓰다" },
      { en: "speak", ko: "말하다" },
      { en: "listen", ko: "듣다" },
      { en: "study", ko: "공부하다" },
      { en: "learn", ko: "배우다" },
      { en: "remember", ko: "기억하다" },
      { en: "understand", ko: "이해하다" },
      { en: "practice", ko: "연습하다" },
      { en: "answer", ko: "대답하다" },
    ],
  },
  {
    id: "adjectives",
    title: "형용사",
    level: "중급",
    items: [
      { en: "beautiful", ko: "아름다운" },
      { en: "difficult", ko: "어려운" },
      { en: "important", ko: "중요한" },
      { en: "different", ko: "다른" },
      { en: "interesting", ko: "흥미로운" },
      { en: "favorite", ko: "가장 좋아하는" },
      { en: "delicious", ko: "맛있는" },
      { en: "dangerous", ko: "위험한" },
      { en: "comfortable", ko: "편안한" },
      { en: "wonderful", ko: "멋진" },
    ],
  },
  {
    id: "sentences",
    title: "짧은 문장",
    level: "중급",
    items: [
      { en: "How are you today?", ko: "오늘 기분 어때요?" },
      { en: "My name is Minji.", ko: "내 이름은 민지예요." },
      { en: "I like to read books.", ko: "나는 책 읽는 것을 좋아해요." },
      { en: "What is your favorite color?", ko: "가장 좋아하는 색은 뭐예요?" },
      { en: "Let's go to school.", ko: "학교에 가자." },
      { en: "Thank you very much.", ko: "정말 고맙습니다." },
      { en: "See you tomorrow.", ko: "내일 봐요." },
      { en: "Have a nice day.", ko: "좋은 하루 보내요." },
    ],
  },
];

function getWordSet(id) {
  return WORD_SETS.find((s) => s.id === id) || WORD_SETS[0];
}
