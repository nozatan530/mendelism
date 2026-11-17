/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameState, PlantData, PlantStage } from '../types';
import { REQUIRED_SEEDS } from './genetics';

// 初めての人向けに、いまの状態から「次にやること」を1つだけ決める
export interface Guide {
  steps: string[];
  current: number; // steps.length なら、このレベルは完了
  text: string;
  why?: string;
  tab: GameState['activeTab'];
  button?: 'advance' | 'fastForward' | 'harvest' | 'sowAll';
  plot?: number; // 目立たせる区画
  seedId?: string; // まくとよい種
}

const STAGES: PlantStage[] = ['SEEDED', 'SPROUT', 'GROWING', 'BUD', 'FLOWER', 'PODS'];

// 人工交配が必要なレベル（それ以外は自家受精させるだけ）
export const isCrossLevel = (level: number) => level === 1 || level === 3;

// 自家受精のレベルでまく種。収穫した豆より、こちらを先に選ぶ
export const RECOMMENDED_SEED: { [level: number]: string } = {
  2: 'seed_lv2_f1_round',
  4: 'seed_lv4_f1_round_yellow',
};

// 何も選んでいないときに選んでおく種（前のレベルの種が先頭に来ても、取り違えないように）
export function defaultSeedId(state: GameState): string {
  const lv = state.currentLevel;
  if (lv === 1) return 'seed_lv1_pure_round';
  if (lv === 3) {
    const next = state.lv3MysterySeeds.find((m) => !state.lv3Results[m.id]) || state.lv3MysterySeeds[0];
    return `seed_bag_${next.id}`;
  }
  return RECOMMENDED_SEED[lv];
}

// 交配するレベルで、いままいた種の相手になる種。相手がもう畑にあるときは null
export function partnerSeedId(state: GameState, sownId: string): string | null {
  const plants = state.plots.filter((p): p is PlantData => p !== null);
  if (state.currentLevel === 1) {
    if (sownId === 'seed_lv1_pure_round') {
      return plants.some((p) => p.seed.genotype.shape === 'aa') ? null : 'seed_lv1_pure_wrinkled';
    }
    if (sownId === 'seed_lv1_pure_wrinkled') {
      return plants.some((p) => p.seed.genotype.shape === 'AA') ? null : 'seed_lv1_pure_round';
    }
  }
  if (state.currentLevel === 3 && sownId.startsWith('seed_bag_')) {
    return plants.some((p) => p.seed.phenotype.shape === 'wrinkled') ? null : 'seed_lv3_test_wrinkled';
  }
  return null;
}

const CROSS_STEPS = [
  '予想する',
  '種をまく',
  'つぼみまで育てる',
  'おしべを取る',
  '花粉をつける',
  '収穫する',
  'サヤを割る',
  'ノートで確かめる',
];
const SELF_STEPS = ['予想する', '種をまく', '育てる', '収穫する', 'サヤを割る', 'ノートで確かめる'];

const plantName = (p: PlantData) => `${p.slotIndex + 1}番（${p.seed.parentLabel || p.seed.generation}）`;

export function getGuide(state: GameState): Guide {
  const lv = state.currentLevel;
  const cross = isCrossLevel(lv);
  const steps = cross ? CROSS_STEPS : SELF_STEPS;
  const at = (label: string) => steps.indexOf(label);
  const note = state.notebooks[lv];
  const plants = state.plots.filter((p): p is PlantData => p !== null);
  const total = state.levelStats[lv].totalSeeds;
  const untested = state.lv3MysterySeeds.filter((m) => !state.lv3Results[m.id]);

  if (!note.predictionLocked) {
    return {
      steps,
      current: 0,
      tab: 'garden',
      text: 'まず結果を予想します。選択肢を1つ選んで「この予想で畑に出る」を押そう。',
      why: '外れても大丈夫。予想してから実験すると、結果の意味がよく分かります。',
    };
  }

  const done = lv === 3 ? state.lv3MysterySeeds.every((m) => m.confirmed) : note.isSubmitted;
  if (done) {
    return {
      steps,
      current: steps.length,
      tab: 'notebook',
      text:
        lv < 4
          ? `Lv${lv} はクリア！ 画面上の「Lv${lv + 1}」を押して次へ進もう。謎解きノートで解説も読めます。`
          : 'すべてのレベルをクリア！ 謎解きノートで解説を読み返せます。',
    };
  }

  if (state.currentHarvestPods.length > 0) {
    const cracked = state.currentHarvestPods.some((p) => p.isCracked);
    return {
      steps,
      current: at('サヤを割る'),
      tab: 'harvest',
      text: cracked
        ? '豆の形を見たら、「種袋に保管 & 集計に追加」を押そう。'
        : 'サヤをタップして割り、中の豆を見よう。多いときは「全部割る」が便利です。',
    };
  }

  const canVerify = lv === 3 ? untested.length === 0 : total >= REQUIRED_SEEDS[lv];
  if (canVerify) {
    return {
      steps,
      current: at('ノートで確かめる'),
      tab: 'notebook',
      text:
        lv === 3
          ? '謎解きノートで、3粒それぞれの遺伝子型を選び「遺伝子型の推理を判定する」を押そう。子にしわが混ざったかどうかが手がかりです。'
          : '豆が集まりました。謎解きノートで「実験結果と照合して検証する」を押そう。',
    };
  }

  // ここから畑の作業
  if (plants.length === 0) {
    if (lv === 1) {
      return {
        steps,
        current: at('種をまく'),
        tab: 'garden',
        text: '空いている区画を1つタップして「純系 丸」をまき、続けて別の区画をタップして「純系 しわ」をまこう。1株ずつで十分です。',
        why: '丸としわをかけ合わせるので、両方の株が必要です。',
      };
    }
    if (lv === 3) {
      const names = untested.map((m) => m.name).join('・');
      return {
        steps,
        current: at('種をまく'),
        tab: 'garden',
        text: `空いている区画を1つタップして謎の豆をまき、続けて別の区画をタップして「検定交雑用 しわ」をまこう。（まだ調べていない豆：${names}）`,
        why: '1回の栽培で調べるのは1粒ずつが分かりやすいです。3粒とも調べたらノートへ進めます。',
      };
    }
    const remain = REQUIRED_SEEDS[lv] - total;
    return {
      steps,
      current: at('種をまく'),
      tab: 'garden',
      button: 'sowAll',
      seedId: RECOMMENDED_SEED[lv],
      text: `「${lv === 2 ? '交配済 F1の丸い種子' : 'F1雑種 丸・黄'}」を選んで「空き区画すべてにまく」を押そう。（集計まであと ${remain} 粒）`,
      why: 'たくさん育てるほど、豆の数の比がはっきりします。',
    };
  }

  const stageIndex = Math.min(...plants.map((p) => STAGES.indexOf(p.stage)));
  const stage = STAGES[stageIndex];
  const waiting = plants.find((p) => p.stage === 'FLOWER' && p.isEmasculated && !p.pollinatedByPlantId);

  if (plants.every((p) => p.stage === 'PODS')) {
    return {
      steps,
      current: at('収穫する'),
      tab: 'garden',
      button: 'harvest',
      text: 'サヤが実りました。「すべて収穫する」を押そう。',
    };
  }

  if (waiting) {
    const donor = plants.find(
      (p) => p.id !== waiting.id && p.stage === 'FLOWER' && p.seed.parentLabel !== waiting.seed.parentLabel
    );
    return {
      steps,
      current: cross ? at('花粉をつける') : at('育てる'),
      tab: 'garden',
      plot: waiting.slotIndex,
      text: donor
        ? `${plantName(waiting)}の花をタップ →「${donor.slotIndex + 1}番区画」を花粉親に選ぶ → 緑のめしべをタップ。`
        : `${plantName(waiting)}の花をタップして、別の株の花粉をつけよう。花粉をもらえる株がないときは、ごみ箱ボタンで片付けてまき直そう。`,
      why: 'おしべを取った花は、花粉をつけないと実りません。',
    };
  }

  if (!cross) {
    return {
      steps,
      current: at('育てる'),
      tab: 'garden',
      button: 'fastForward',
      text: '「収穫まで早送り」を押そう。花には何もしなくて大丈夫です。',
      why: 'エンドウは、何もしなければ自分の花粉で受粉します（自家受精）。',
    };
  }

  // 交配するレベル：2種類の株がそろっているか
  const hasA = lv === 1 ? plants.some((p) => p.seed.genotype.shape === 'AA') : plants.some((p) => p.seed.generation === 'Lv3Mystery');
  const hasB = lv === 1 ? plants.some((p) => p.seed.genotype.shape === 'aa') : plants.some((p) => p.seed.phenotype.shape === 'wrinkled');
  if (!hasA || !hasB) {
    const missing = lv === 1 ? (hasA ? '純系 しわ' : '純系 丸') : hasA ? '検定交雑用 しわ' : '謎の豆';
    return {
      steps,
      current: at('種をまく'),
      tab: 'garden',
      text:
        stage === 'SEEDED'
          ? `次は「${missing}」です。空いている別の区画をタップしてまこう。（選ばれていなければ、上の種のボタンで選ぶ）`
          : `かけ合わせる相手の「${missing}」がありません。ごみ箱ボタンで畑を片付けて、2種類をまき直そう。`,
      why: '2種類の株を同時に育てて、片方の花粉をもう片方につけます。',
    };
  }

  if (stageIndex < STAGES.indexOf('BUD')) {
    return {
      steps,
      current: at('つぼみまで育てる'),
      tab: 'garden',
      button: 'advance',
      text: '「時間を進める」を押して、つぼみになるまで育てよう。',
    };
  }

  const emasculated = plants.some((p) => p.isEmasculated);
  if (stage === 'BUD') {
    if (!emasculated) {
      const target = (lv === 3 && plants.find((p) => p.seed.generation === 'Lv3Mystery')) || plants[0];
      return {
        steps,
        current: at('おしべを取る'),
        tab: 'garden',
        plot: target.slotIndex,
        text: `${plantName(target)}のつぼみをタップして、黄色いおしべを8本ぜんぶタップして取ろう（除雄）。`,
        why: 'おしべを残すと、花が開く前に自分の花粉で受粉してしまい、かけ合わせになりません。',
      };
    }
    return {
      steps,
      current: at('花粉をつける'),
      tab: 'garden',
      button: 'advance',
      text: 'おしべが取れました。「時間を進める」を押して花を咲かせよう。',
    };
  }

  // 開花している
  if (plants.some((p) => p.pollinatedByPlantId)) {
    return {
      steps,
      current: at('収穫する'),
      tab: 'garden',
      button: 'advance',
      text: '受粉できました。「時間を進める」を押してサヤを実らせよう。',
    };
  }
  return {
    steps,
    current: at('おしべを取る'),
    tab: 'garden',
    text: 'おしべを取らないまま花が咲いたので、このままだと自家受精になります。ごみ箱ボタンで畑を片付けて、もう一度まき、つぼみのうちにおしべを取ろう。',
    why: 'かけ合わせるには、つぼみのうちにおしべを取る必要があります。',
  };
}

// しまった豆が、そのレベルで調べる豆ではなかったときの説明
export function offTargetMessage(level: number): string {
  if (level === 1) {
    return 'いまの豆は自家受精でできた豆（親と同じ純系）だったので、集計には入っていません。F1 を作るには、つぼみでおしべを取り、もう一方の株の花粉をつけよう。';
  }
  if (level === 3) {
    return 'いまの豆は検定交雑の子ではなかったので、記録には入っていません。謎の豆としわの豆を、おしべを取ってかけ合わせよう。';
  }
  return `いまの豆は F2 ではなかったので、集計には入っていません。「${level === 2 ? '交配済 F1の丸い種子' : 'F1雑種 丸・黄'}」をまいて、何もせずに育てよう。`;
}
