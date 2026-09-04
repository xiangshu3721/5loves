export type LangCode = "A" | "B" | "C" | "D" | "E";

export type Language = {
  code: LangCode;
  name: string;
  english: string;
  meaning: string;
  how: string;
  disc: string;
};

export const LANGUAGES: Language[] = [
  {
    code: "A",
    name: "肯定的言词",
    english: "Words of Affirmation",
    meaning: "赞美、鼓励、感激。口头和书面的肯定，是被看见的证据。",
    how: "认真称赞，说「我爱你」，写短笺，肯定对方的选择。",
    disc: "L",
  },
  {
    code: "B",
    name: "精心的时刻",
    english: "Quality Time",
    meaning: "全神贯注的陪伴。一起做事，或只是在一起，不被打断。",
    how: "放下手机，一起散步，把一段对话听完。",
    disc: "O",
  },
  {
    code: "C",
    name: "接受礼物",
    english: "Receiving Gifts",
    meaning: "礼物是看见与惦记的可见记号。贵重与否不重要，有心才重要。",
    how: "记得日子，带一个小物件回来，亲手做也算。",
    disc: "V",
  },
  {
    code: "D",
    name: "服务的行动",
    english: "Acts of Service",
    meaning: "愿意做对方希望被帮忙的事，把负担从对方肩上挪开。",
    how: "做饭、洗碗、代办琐事，不用等对方开口。",
    disc: "E",
  },
  {
    code: "E",
    name: "身体的接触",
    english: "Physical Touch",
    meaning: "靠近、触碰、被抱住。身体在场，才会觉得安全。",
    how: "牵手、拥抱、坐近一点，允许亲昵。",
    disc: "Y",
  },
];

export const LANGUAGE_MAP = Object.fromEntries(
  LANGUAGES.map((item) => [item.code, item]),
) as Record<LangCode, Language>;
