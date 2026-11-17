/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// 品種改良ゲームの「次にやること」。いまの状態から一手だけ決める
import { PlantData, PlantPhenotype, PlantStage } from '../types';
import { phenotypeLabel } from '../utils/genetics';
import { GameData, isUniformLot, Lot, lotGroups, ORDERS, phenoKey, samePheno, STARTERS } from './logic';

export type GameSelection = { kind: 'starter'; id: string } | { kind: 'lot'; lotId: string; key: string };

export interface GameGuide {
  steps: string[];
  current: number;
  text: string;
  why?: string;
  button?: 'sowAll' | 'fastForward' | 'advance' | 'harvest' | 'crackAll' | 'store' | 'deliver' | 'emptyBox';
  plot?: number; // 目立たせる区画（0始まり）
  sel?: GameSelection; // まくとよい豆
  picks?: string[]; // 納品箱に入れるとよい豆（`${lotId}|${key}`）
}

const CROSS_STEPS = ['種をまく', 'つぼみまで育てる', 'おしべを取る', '花粉をつける', '収穫する', 'サヤを割る', '納品する'];
const SELF_STEPS = ['種をまく', '育てる', '収穫する', 'サヤを割る', '納品する'];
const STAGES: PlantStage[] = ['SEEDED', 'SPROUT', 'GROWING', 'BUD', 'FLOWER', 'PODS'];
const [STARTER_A, STARTER_B] = STARTERS;
const YELLOW_ROUND: PlantPhenotype = { shape: 'round', color: 'yellow' };
const MAX_EMASCULATE = 2; // 案内でおしべを取らせる株数（多いと作業になる）

const isStarter = (p: PlantData, id: string) => p.seed.id === id;
export const hasBothStarters = (plants: (PlantData | null)[]) =>
  plants.some((p) => p && isStarter(p, STARTER_A.id)) && plants.some((p) => p && isStarter(p, STARTER_B.id));

const countOf = (lot: Lot, want: PlantPhenotype) => lot.seeds.filter((s) => samePheno(s.phenotype, want)).length;

// 安心して納品できる豆。「毎年同じ豆」の注文で顕性の見た目なら、子がそろった株の豆だけ
function safeLots(game: GameData): Lot[] {
  const order = ORDERS[game.orderIndex];
  if (!order) return [];
  const recessive = order.want.shape === 'wrinkled' && order.want.color === 'green';
  return game.lots.filter((lot) => {
    if (countOf(lot, order.want) === 0) return false;
    if (!order.pure || recessive) return true;
    return lot.pollination === 'self' && isUniformLot(lot);
  });
}

// 次にまく豆。純系らしい株 → 自家受精の子 → 交配の子（F1）の順で丸・黄を探す
function sowPlan(game: GameData): { mode: 'cross' } | { mode: 'self'; lot: Lot; kind: 'pure' | 'candidate' | 'f1' } {
  const order = ORDERS[game.orderIndex];
  const want = order?.pure && samePheno(order.want, YELLOW_ROUND) ? order.want : YELLOW_ROUND;
  const withWant = game.lots.filter((l) => countOf(l, want) > 0);
  const selfLots = withWant.filter((l) => l.pollination === 'self');
  const pure = selfLots.find(isUniformLot);
  if (pure) return { mode: 'self', lot: pure, kind: 'pure' };
  if (order?.id === 'pure-yellow-round' && selfLots[0]) return { mode: 'self', lot: selfLots[0], kind: 'candidate' };
  const f1 = withWant.find((l) => l.pollination === 'cross');
  if (f1) return { mode: 'self', lot: f1, kind: 'f1' };
  if (selfLots[0]) return { mode: 'self', lot: selfLots[0], kind: 'candidate' };
  return { mode: 'cross' };
}

export function getGameGuide(game: GameData, box: { [pick: string]: number }): GameGuide {
  const order = ORDERS[game.orderIndex];
  if (!order) {
    return { steps: SELF_STEPS, current: SELF_STEPS.length, text: 'すべての依頼を達成しました。' };
  }
  const wantLabel = phenotypeLabel(order.want);
  const wantKey = phenoKey(order.want);
  const plants = game.plants.filter((p): p is PlantData => p !== null);
  const emptySlots = game.plants.map((p, i) => (p ? -1 : i)).filter((i) => i >= 0);
  const plan = sowPlan(game);

  // ── 収穫台 ──
  if (game.harvest) {
    const crossed = game.harvest.some((h) => h.pollination === 'cross');
    const steps = crossed ? CROSS_STEPS : SELF_STEPS;
    const current = steps.indexOf('サヤを割る');
    const allCracked = game.harvest.every((h) => h.pods.every((p) => p.isCracked));
    if (!allCracked) {
      return {
        steps,
        current,
        text: '「全部割る」を押して、サヤの中の豆を見よう。',
        why: '豆は株ごとに分けて並びます。どの株からどんな豆がとれたかが大事です。',
        button: 'crackAll',
      };
    }
    const look = crossed
      ? '人工交配した株の豆は、両親のどちらとも違う見た目になったかな？'
      : order.id === 'pure-yellow-round'
      ? '株ごとに見比べよう。丸・黄だけが実った株はあるかな？'
      : `${wantLabel}の豆はあるかな？`;
    return { steps, current, text: `${look} 見たら「倉庫にしまう」を押そう。`, button: 'store' };
  }

  // ── 納品 ──
  const safe = safeLots(game);
  const safePicks = safe.map((l) => `${l.id}|${wantKey}`);
  const safeTotal = safe.reduce((n, l) => n + countOf(l, order.want), 0);
  if (safeTotal >= order.qty) {
    const steps = game.orderIndex === 0 ? CROSS_STEPS : SELF_STEPS;
    const current = steps.length - 1;
    const boxTotal = Object.values(box).reduce((a, b) => a + b, 0);
    const boxOk = Object.keys(box).every((pick) => !box[pick] || safePicks.includes(pick));
    if (!boxOk) {
      return {
        steps,
        current,
        text: '納品箱に、確かめていない豆が入っています。「箱を空にする」を押して、入れ直そう。',
        button: 'emptyBox',
      };
    }
    if (boxTotal < order.qty) {
      const strict = order.pure && safe.length < game.lots.filter((l) => countOf(l, order.want) > 0).length;
      return {
        steps,
        current,
        text: `倉庫で、黄色い枠のついた「箱へ」を押して、${wantLabel}の豆を納品箱に${order.qty}粒入れよう。`,
        why: strict
          ? `枠があるのは、子がすべて${wantLabel}だった株の豆です。ほかの株の${wantLabel}は、見た目が同じでも潜性の遺伝子を隠しているかもしれません。`
          : order.pure
          ? 'しわも緑も潜性なので、この見た目の豆は隠れた性質を持てません。確かめなくても納品できます。'
          : '今回の注文は見た目だけ。注文どおりの見た目の豆がそろいました。',
        picks: safePicks.filter((pick) => {
          const lot = safe.find((l) => pick.startsWith(`${l.id}|`))!;
          return countOf(lot, order.want) > (box[pick] || 0);
        }),
      };
    }
    return { steps, current, text: '「納品する」を押そう。', button: 'deliver' };
  }

  // ── 畑 ──
  const stage = plants[0]?.stage ?? 'SEEDED';
  const nonStarter = plants.some((p) => !p.seed.id.startsWith('starter_'));
  const cross =
    plants.length === 0
      ? plan.mode === 'cross'
      : nonStarter
      ? false
      : game.growing
      ? hasBothStarters(plants)
      : plan.mode === 'cross';
  const steps = cross ? CROSS_STEPS : SELF_STEPS;
  const waiting = plants.find((p) => p.stage === 'FLOWER' && p.isEmasculated && !p.pollinatedByPlantId);

  if (stage === 'PODS' && plants.length > 0) {
    return { steps, current: steps.indexOf('収穫する'), text: 'サヤが実りました。「すべて収穫する」を押そう。', button: 'harvest' };
  }

  // 種まき
  if (!game.growing) {
    if (cross) {
      if (emptySlots.length > 0) {
        const slot = emptySlots[0];
        const starter = slot < game.plotCount / 2 ? STARTER_A : STARTER_B;
        return {
          steps,
          current: 0,
          text: `倉庫で「${starter.parentLabel}」を選んで（もう選んであります）、畑の${slot + 1}番をタップしてまこう。`,
          why: `${phenotypeLabel(YELLOW_ROUND)}の豆は倉庫にありません。2種類の純系をかけ合わせて作るので、両方を畑に植えます。`,
          sel: { kind: 'starter', id: starter.id },
          plot: slot,
        };
      }
      return {
        steps,
        current: 1,
        text: '「収穫まで早送り」を押そう。つぼみで一度止まります。',
        why: 'おしべを取れるのは、つぼみのうちだけです。咲くと自分の花粉で受粉してしまいます。',
        button: 'fastForward',
      };
    }
    const lot = plan.mode === 'self' ? plan.lot : null;
    const sel: GameSelection | undefined = lot
      ? { kind: 'lot', lotId: lot.id, key: phenoKey(YELLOW_ROUND) }
      : undefined;
    if (lot && sel && emptySlots.length > 0) {
      const kind = plan.mode === 'self' ? plan.kind : 'f1';
      return {
        steps,
        current: 0,
        text: `倉庫の「シーズン${lot.season}・${lot.plotNo}番の株」の「丸・黄」を選んで（もう選んであります）、「空き区画すべてにまく」を押そう。`,
        why:
          kind === 'pure'
            ? 'この株は子がすべて丸・黄でした。まいて増やせば、納品できる豆が増えます。'
            : kind === 'candidate'
            ? '見た目が丸・黄でも、隠れた性質を持つ豆と持たない豆があります。1区画に1粒ずつ育てて、株ごとに子を見比べます。'
            : '丸・黄の豆は、しわと緑の性質を隠し持っています。自家受精させると、子に現れます。',
        sel,
        button: 'sowAll',
      };
    }
    if (plants.length > 0) {
      return {
        steps,
        current: 1,
        text: '「収穫まで早送り」を押そう。',
        why: 'エンドウは何もしなければ自家受精します。今回はおしべを取りません。',
        button: 'fastForward',
      };
    }
  }

  // 栽培中
  // 同じ種類の花粉をつけてしまうと、かけ合わせにならない
  const sameKind = plants.find(
    (p) => p.stage === 'FLOWER' && p.isEmasculated && p.pollinatorSeed && p.pollinatorSeed.id === p.seed.id
  );
  if (cross && sameKind) {
    const donorKind = isStarter(sameKind, STARTER_A.id) ? STARTER_B : STARTER_A;
    return {
      steps,
      current: steps.indexOf('花粉をつける'),
      text: `${sameKind.slotIndex + 1}番には、同じ種類の株の花粉がついています。もう一度タップして、「${phenotypeLabel(donorKind.phenotype)}」の株の花粉をつけ直そう。`,
      why: '同じ純系どうしでは、親と同じ豆しかできません。',
      plot: sameKind.slotIndex,
    };
  }
  if (waiting) {
    const donorKind = isStarter(waiting, STARTER_A.id) ? STARTER_B : STARTER_A;
    return {
      steps,
      current: Math.max(steps.indexOf('花粉をつける'), 1),
      text: cross
        ? `${waiting.slotIndex + 1}番の花をタップして、「${phenotypeLabel(donorKind.phenotype)}」の株の花粉を筆でつけよう。`
        : `${waiting.slotIndex + 1}番の花をタップして、別の株の花粉を筆でつけよう。`,
      why: 'おしべを取った花は、花粉をつけないと実りません。',
      plot: waiting.slotIndex,
    };
  }
  if (cross && STAGES.indexOf(stage) < STAGES.indexOf('BUD')) {
    return {
      steps,
      current: 1,
      text: '「収穫まで早送り」を押そう。つぼみで一度止まります。',
      why: 'おしべを取れるのは、つぼみのうちだけです。咲くと自分の花粉で受粉してしまいます。',
      button: 'fastForward',
    };
  }
  if (cross && stage === 'BUD') {
    const done = plants.filter((p) => p.isEmasculated);
    // すでに取り始めた種類があればそれに合わせる
    const kind = done.length > 0 && done.every((p) => isStarter(p, STARTER_B.id)) ? STARTER_B : STARTER_A;
    const targets = plants.filter((p) => isStarter(p, kind.id));
    const next = targets.find((p) => !p.isEmasculated);
    if (next && done.length < Math.min(MAX_EMASCULATE, targets.length)) {
      return {
        steps,
        current: 2,
        text: `${next.slotIndex + 1}番（${phenotypeLabel(kind.phenotype)}）のつぼみをタップして、黄色いおしべを8本ぜんぶタップして取ろう。`,
        why: 'おしべを残すと、自分の花粉で受粉してしまい、かけ合わせになりません。取ったおしべは取っておけます。',
        plot: next.slotIndex,
      };
    }
    return {
      steps,
      current: 3,
      text: '「時間を進める」を1回押して、花を咲かせよう。',
      why: '花粉をつけられるのは、咲いてからです。',
      button: 'advance',
    };
  }
  if (cross && stage === 'FLOWER' && !plants.some((p) => p.isEmasculated)) {
    return {
      steps,
      current: 3,
      text: 'おしべを取らないまま咲いたので、今回はすべて自家受精になります。「収穫まで早送り」で進めて、次の栽培でやり直そう。',
      button: 'fastForward',
    };
  }
  return {
    steps,
    current: cross ? steps.indexOf('花粉をつける') : 1,
    text: '「収穫まで早送り」を押そう。',
    why: cross ? '受粉が済みました。あとは実るのを待ちます。' : 'エンドウは何もしなければ自家受精します。',
    button: 'fastForward',
  };
}
