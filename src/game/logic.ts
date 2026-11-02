/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// 品種改良ゲームのルール（画面から分離し、scripts/balance-game.ts でも使う）
import { PlantData, PlantPhenotype, PodData, SeedItem } from '../types';
import { fertilize, getRandomInt, phenotypeLabel } from '../utils/genetics';

export interface Order {
  id: string;
  client: string;
  title: string;
  story: string;
  hint: string;
  lesson: string; // 納品できたときの解説
  qty: number;
  want: PlantPhenotype;
  pure: boolean; // お客さんが翌年まいて、同じ豆だけが出るか確かめる
  grows: number; // 期限（栽培できる回数）
  plotsAfter: number; // 達成後の畑の広さ
}

export const ORDERS: Order[] = [
  {
    id: 'yellow-round',
    client: '八百屋のハナさん',
    title: '丸くて黄色い豆を10粒',
    story: '畑にあるのは「丸・緑」と「しわ・黄」の純系だけ。丸くて黄色い豆って、作れないかな？',
    hint: '自家受精では親と同じ豆しかできません。つぼみのうちに一方の株のおしべを取り除き、咲いたらもう一方の花粉を筆でつけましょう。',
    lesson: '丸としわでは丸が、黄と緑では黄が顕性です。だから両親のどちらにもなかった「丸・黄」が、子のすべてに現れました。',
    qty: 10,
    want: { shape: 'round', color: 'yellow' },
    pure: false,
    grows: 2,
    plotsAfter: 6,
  },
  {
    id: 'wrinkled-green',
    client: '料理人のゲンさん',
    title: 'しわで緑の豆を5粒（毎年同じ豆が育つもの）',
    story: '「しわで緑」なんて豆、誰も見たことがない。あの黄色い丸豆から作れないかい？',
    hint: '丸・黄の豆は、見た目に現れていない性質を隠し持っています。自家受精させて次の世代を見てみましょう。',
    lesson: 'しわも緑も潜性なので、この見た目なら遺伝子型は aabb しかありません。確かめなくても、毎年同じ豆が育ちます。',
    qty: 5,
    want: { shape: 'wrinkled', color: 'green' },
    pure: true,
    grows: 2,
    plotsAfter: 12,
  },
  {
    id: 'pure-yellow-round',
    client: '種屋のサトウさん',
    title: '丸くて黄色い豆を10粒（毎年同じ豆が育つもの）',
    story: '売り物にする種がほしい。来年まいても、丸くて黄色い豆だけが実るものを頼むよ。',
    hint: '見た目が丸・黄でも、AA か Aa か、BB か Bb かは分かりません。候補を1株ずつ自家受精させ、子がすべて同じになった株を探しましょう。その子が、求める豆です。',
    lesson: '子がそろわない株には、潜性の遺伝子が隠れていました。子がすべて同じ見た目の株は AABB で、その子もすべて AABB です。これが見た目と遺伝子型の違いです。',
    qty: 10,
    want: { shape: 'round', color: 'yellow' },
    pure: true,
    grows: 3,
    plotsAfter: 12,
  },
];

export const STARTERS: SeedItem[] = [
  {
    id: 'starter_round_green',
    genotype: { shape: 'AA', color: 'bb' },
    phenotype: { shape: 'round', color: 'green' },
    generation: 'P',
    parentLabel: '純系 丸・緑',
  },
  {
    id: 'starter_wrinkled_yellow',
    genotype: { shape: 'aa', color: 'BB' },
    phenotype: { shape: 'wrinkled', color: 'yellow' },
    generation: 'P',
    parentLabel: '純系 しわ・黄',
  },
];

// 1株から収穫した豆のまとまり。子がそろうかを見るため、株ごとに分けて保管する
export interface Lot {
  id: string;
  season: number;
  plotNo: number;
  label: string;
  pollination: 'self' | 'cross';
  seeds: SeedItem[];
}

export interface HarvestPlant {
  plotNo: number;
  label: string;
  pollination: 'self' | 'cross' | 'failed';
  pods: PodData[];
}

export interface DeliveryResult {
  orderId: string;
  passed: boolean;
  wrongLook: number;
  impure: number;
  total: number;
}

export interface GameData {
  season: number;
  credit: number;
  orderIndex: number;
  growsLeft: number;
  plotCount: number;
  growing: boolean;
  plants: (PlantData | null)[];
  lots: Lot[];
  harvest: HarvestPlant[] | null;
  notice: string | null;
  lastDelivery: DeliveryResult | null;
}

export const START_CREDIT = 3;
export const CUSTOMER_TEST_SEEDS = 30;

export function createGame(): GameData {
  return {
    season: 1,
    credit: START_CREDIT,
    orderIndex: 0,
    growsLeft: ORDERS[0].grows,
    plotCount: 4,
    growing: false,
    plants: Array(4).fill(null),
    lots: [],
    harvest: null,
    notice: null,
    lastDelivery: null,
  };
}

export function phenoKey(p: PlantPhenotype): string {
  return `${p.shape}_${p.color}`;
}

export function samePheno(a: PlantPhenotype, b: PlantPhenotype): boolean {
  return a.shape === b.shape && a.color === b.color;
}

// 収穫豆を見た目ごとに数える（遺伝子型は見せない）
export function lotGroups(lot: Lot): { key: string; label: string; phenotype: PlantPhenotype; count: number }[] {
  const groups = new Map<string, { key: string; label: string; phenotype: PlantPhenotype; count: number }>();
  lot.seeds.forEach((s) => {
    const key = phenoKey(s.phenotype);
    const g = groups.get(key);
    if (g) g.count++;
    else groups.set(key, { key, label: phenotypeLabel(s.phenotype), phenotype: s.phenotype, count: 1 });
  });
  return [...groups.values()];
}

// 子がすべて同じ見た目か（子の粒数が少ないと偶然そろうこともある）
export function isUniformLot(lot: Lot): boolean {
  return lotGroups(lot).length === 1;
}

export function takeFromLot(lots: Lot[], lotId: string, key: string): { lots: Lot[]; seed: SeedItem } | null {
  const lot = lots.find((l) => l.id === lotId);
  if (!lot) return null;
  const candidates = lot.seeds.filter((s) => phenoKey(s.phenotype) === key);
  if (candidates.length === 0) return null;
  const seed = candidates[getRandomInt(0, candidates.length - 1)];
  const seeds = lot.seeds.filter((s) => s !== seed);
  const nextLots = seeds.length > 0
    ? lots.map((l) => (l.id === lotId ? { ...l, seeds } : l))
    : lots.filter((l) => l.id !== lotId);
  return { lots: nextLots, seed };
}

// お客さんが翌年1粒ずつまいて、子がそろうか確かめる
export function customerFindsMixed(seed: SeedItem): boolean {
  for (let i = 0; i < CUSTOMER_TEST_SEEDS; i++) {
    if (!samePheno(fertilize(seed.genotype, seed.genotype).phenotype, seed.phenotype)) return true;
  }
  return false;
}

export function judgeDelivery(order: Order, seeds: SeedItem[]): DeliveryResult {
  const wrongLook = seeds.filter((s) => !samePheno(s.phenotype, order.want)).length;
  const impure = order.pure
    ? seeds.filter((s) => samePheno(s.phenotype, order.want) && customerFindsMixed(s)).length
    : 0;
  return {
    orderId: order.id,
    passed: seeds.length === order.qty && wrongLook === 0 && impure === 0,
    wrongLook,
    impure,
    total: seeds.length,
  };
}

// 納品の結果を反映する。合格なら次の依頼へ、不合格なら信用が下がり同じ依頼を続ける
export function applyDelivery(game: GameData, result: DeliveryResult): GameData {
  if (!result.passed) {
    return { ...game, credit: game.credit - 1, lastDelivery: result };
  }
  const order = ORDERS[game.orderIndex];
  const nextIndex = game.orderIndex + 1;
  const plants = [...game.plants];
  while (plants.length < order.plotsAfter) plants.push(null);
  return {
    ...game,
    orderIndex: nextIndex,
    growsLeft: nextIndex < ORDERS.length ? ORDERS[nextIndex].grows : 0,
    plotCount: order.plotsAfter,
    plants,
    lastDelivery: result,
  };
}

// 期限切れで栽培を始めると、信用が下がって期限が延びる
export function applyDeadline(game: GameData): GameData {
  if (game.growsLeft > 0 || game.orderIndex >= ORDERS.length) return game;
  return {
    ...game,
    credit: game.credit - 1,
    growsLeft: ORDERS[game.orderIndex].grows,
    notice: '納品の期限を過ぎてしまいました。お客さんは待ってくれましたが、信用が1つ下がりました。',
  };
}
