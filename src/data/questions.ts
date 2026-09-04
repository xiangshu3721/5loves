import type { LangCode } from "./languages";

export type Option = {
  text: string;
  code: LangCode;
};

export type Item = {
  id: number;
  left: Option;
  right: Option;
};

/**
 * 30 forced pairs from the source poster, wording kept.
 * Pairing is balanced so each language appears 12 times
 * (poster item 14 labeled both options B; the second line is scored as E / 牵手).
 */
export const QUESTIONS: Item[] = [
  {
    id: 1,
    left: { text: "我喜欢收到体现爱意的字条。", code: "A" },
    right: { text: "我喜欢被拥抱。", code: "E" },
  },
  {
    id: 2,
    left: { text: "我喜欢和心爱的人独处。", code: "B" },
    right: { text: "对方为我做具体的事，我会觉得被爱。", code: "D" },
  },
  {
    id: 3,
    left: { text: "为心爱的人物色礼物是件开心的事。", code: "C" },
    right: { text: "我喜欢和心爱的人共度时光。", code: "B" },
  },
  {
    id: 4,
    left: { text: "当对方为我分担家务，我会开心。", code: "D" },
    right: { text: "对方身体上的触碰对我很重要。", code: "E" },
  },
  {
    id: 5,
    left: { text: "当被对方拥抱时，我会很有安全感。", code: "E" },
    right: { text: "我喜欢听对方赞美我。", code: "A" },
  },
  {
    id: 6,
    left: { text: "跟对方呆在一起，我会很开心。", code: "B" },
    right: { text: "我喜欢对方送我小礼物。", code: "C" },
  },
  {
    id: 7,
    left: { text: "我喜欢听对方说「我爱你」。", code: "A" },
    right: { text: "我喜欢对方为我做实质性的事。", code: "D" },
  },
  {
    id: 8,
    left: { text: "我喜欢坐在心爱的人身边。", code: "E" },
    right: { text: "我喜欢听对方称赞我。", code: "A" },
  },
  {
    id: 9,
    left: { text: "对方的小礼物，令我觉得贴心。", code: "C" },
    right: { text: "我喜欢听到对方赞美我的话语。", code: "A" },
  },
  {
    id: 10,
    left: { text: "对方肯花时间陪我，我会有被爱的感觉。", code: "B" },
    right: { text: "我喜欢听到对方肯定我的话语。", code: "A" },
  },
  {
    id: 11,
    left: { text: "即使是再小的礼物，我也觉得非常开心。", code: "C" },
    right: { text: "当对方愿意分担我面临的家务，我会觉得被爱。", code: "D" },
  },
  {
    id: 12,
    left: { text: "对方一直专注于我，不因其他事打断，我会觉得被爱。", code: "B" },
    right: { text: "我喜欢对方为我做事。", code: "D" },
  },
  {
    id: 13,
    left: { text: "对方送我的生日礼物，我会格外珍惜。", code: "C" },
    right: { text: "听到对方说「我想你」，我会非常开心。", code: "A" },
  },
  {
    id: 14,
    left: { text: "我喜欢对方陪我一起出游。", code: "B" },
    right: { text: "我喜欢牵着对方的手。", code: "E" },
  },
  {
    id: 15,
    left: { text: "我喜欢和对方有肢体上的亲密举动。", code: "E" },
    right: { text: "我喜欢收到的礼物，即使是平平常常的。", code: "C" },
  },
  {
    id: 16,
    left: { text: "我很享受和对方一起探讨问题的时光。", code: "B" },
    right: { text: "我希望能感受到对方对我的肯定和赞扬。", code: "A" },
  },
  {
    id: 17,
    left: { text: "我喜欢收到心爱的人送我的礼物。", code: "C" },
    right: { text: "对方为我分担不喜欢的家务，我会很感激。", code: "D" },
  },
  {
    id: 18,
    left: { text: "对方赞赏我的外表和举止，我会开心。", code: "A" },
    right: { text: "对方花时间陪我探讨有趣的话题，我会很开心。", code: "B" },
  },
  {
    id: 19,
    left: { text: "对方在身体上的亲密行为，让我觉得被爱。", code: "E" },
    right: { text: "对方送我礼物，我会觉得很快乐。", code: "C" },
  },
  {
    id: 20,
    left: { text: "对方为我做家务，我会心怀感激。", code: "D" },
    right: { text: "当听到对方的夸奖，我会觉得很有动力。", code: "A" },
  },
  {
    id: 21,
    left: { text: "我希望和对方有肢体上的接触。", code: "E" },
    right: { text: "对方如果送我一个小小的礼物，我也觉得很开心。", code: "C" },
  },
  {
    id: 22,
    left: { text: "我觉得两个人呆在一起什么也不做也是好的。", code: "B" },
    right: { text: "我喜欢对方能主动分担我身上的重任。", code: "D" },
  },
  {
    id: 23,
    left: { text: "我觉得收到礼物就是心意的体现。", code: "C" },
    right: { text: "对方如果能主动帮我做事，我会觉得很温馨。", code: "D" },
  },
  {
    id: 24,
    left: { text: "对方关注地倾听我说话，我会觉得被爱。", code: "B" },
    right: { text: "我觉得收到礼物是对爱的最好的回报。", code: "C" },
  },
  {
    id: 25,
    left: { text: "我希望能和心爱的人分享我的烦恼和忧虑。", code: "B" },
    right: { text: "如果对方愿意为我服务，我会很感动。", code: "D" },
  },
  {
    id: 26,
    left: { text: "如果对方亲吻我的脸颊，我会觉得很幸福。", code: "E" },
    right: { text: "听到对方肯定的赞美，我会非常有信心。", code: "A" },
  },
  {
    id: 27,
    left: { text: "如果对方能帮我度过难关，我会觉得很温暖。", code: "D" },
    right: { text: "我希望能感受到对方亲昵的举动。", code: "E" },
  },
  {
    id: 28,
    left: { text: "听到对方说「我爱你」，我会非常开心。", code: "A" },
    right: { text: "如果对方主动分担我忙碌时的事务，我会很感激。", code: "D" },
  },
  {
    id: 29,
    left: { text: "收到礼物时，哪怕只是一个小小的举动，也让我觉得很开心。", code: "C" },
    right: { text: "对方轻轻拍我的背，我会觉得安心。", code: "E" },
  },
  {
    id: 30,
    left: { text: "和对方一起发呆，什么也不做，我也觉得足够。", code: "B" },
    right: { text: "走路时对方挽着我，我会觉得被爱。", code: "E" },
  },
];
