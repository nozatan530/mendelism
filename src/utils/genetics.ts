/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ColorGenotype,
  ColorPhenotype,
  GameState,
  Gamete,
  PlantGenotype,
  PlantPhenotype,
  PodData,
  SeedItem,
  ShapeGenotype,
  ShapePhenotype,
} from '../types';

// ==========================================
// 1. 乱数生成器（シード指定可能 PRNG - Mulberry32）
// ==========================================
let currentSeed = Date.now() >>> 0;

export function setRandomSeed(seed: number): void {
  currentSeed = seed >>> 0;
}

export function getRandom(): number {
  currentSeed = (currentSeed + 0x6d2b79f5) | 0;
  let t = Math.imul(currentSeed ^ (currentSeed >>> 15), 1 | currentSeed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function getRandomInt(min: number, max: number): number {
  return Math.floor(getRandom() * (max - min + 1)) + min;
}

// ==========================================
// 2. 配偶子形成（各遺伝子座から独立に1/2の確率で選択）
// ==========================================
export function createGamete(genotype: PlantGenotype): Gamete {
  // 形の遺伝子座 (A or a)
  const shapeAlleles = genotype.shape.split('') as ('A' | 'a')[];
  const chosenShape = getRandom() < 0.5 ? shapeAlleles[0] : shapeAlleles[1];

  let chosenColor: ('B' | 'b') | undefined = undefined;
  if (genotype.color) {
    const colorAlleles = genotype.color.split('') as ('B' | 'b')[];
    chosenColor = getRandom() < 0.5 ? colorAlleles[0] : colorAlleles[1];
  }

  return {
    shape: chosenShape,
    color: chosenColor,
  };
}

// ==========================================
// 3. 受精（母の配偶子 + 父の配偶子 で胚の遺伝子型を決定）
// ==========================================
export function fertilize(mother: PlantGenotype, father: PlantGenotype): {
  genotype: PlantGenotype;
  phenotype: PlantPhenotype;
} {
  const egg = createGamete(mother);
  const sperm = createGamete(father);

  // 形の対立遺伝子を結合（大文字を先に並べる）
  const shapeArr = [egg.shape, sperm.shape].sort((a, b) => {
    if (a === 'A' && b === 'a') return -1;
    if (a === 'a' && b === 'A') return 1;
    return 0;
  });
  const shapeGenotype = shapeArr.join('') as ShapeGenotype;

  // 表現型：AA と Aa は丸、aa はしわ
  const shapePhenotype: ShapePhenotype =
    shapeGenotype === 'aa' ? 'wrinkled' : 'round';

  let colorGenotype: ColorGenotype | undefined = undefined;
  let colorPhenotype: ColorPhenotype | undefined = undefined;

  if (egg.color && sperm.color) {
    const colorArr = [egg.color, sperm.color].sort((a, b) => {
      if (a === 'B' && b === 'b') return -1;
      if (a === 'b' && b === 'B') return 1;
      return 0;
    });
    colorGenotype = colorArr.join('') as ColorGenotype;

    // 表現型：BB と Bb は黄、bb は緑
    colorPhenotype = colorGenotype === 'bb' ? 'green' : 'yellow';
  }

  return {
    genotype: {
      shape: shapeGenotype,
      color: colorGenotype,
    },
    phenotype: {
      shape: shapePhenotype,
      color: colorPhenotype,
    },
  };
}

// ==========================================
// 4. 世代の判定とサヤ・豆の生成
// 1株のサヤ数: 4〜8, 1サヤの豆数: 4〜8
// 豆の形・色は「その豆の中の胚(子)の遺伝子型」で決まる
// ==========================================
export function nextGeneration(mother: SeedItem, father: SeedItem | null): SeedItem['generation'] {
  if (!father) {
    if (mother.generation === 'P') return 'P'; // 純系の自家受精は純系のまま
    if (mother.generation === 'F1') return 'F2';
    return 'Custom';
  }
  const isTestCross = (mystery: SeedItem, other: SeedItem) =>
    mystery.generation === 'Lv3Mystery' && other.genotype.shape === 'aa';
  if (isTestCross(mother, father) || isTestCross(father, mother)) return 'Test';
  if (mother.generation === 'P' && father.generation === 'P') {
    const same =
      mother.genotype.shape === father.genotype.shape &&
      mother.genotype.color === father.genotype.color;
    return same ? 'P' : 'F1';
  }
  return 'Custom';
}

export function phenotypeLabel(phenotype: PlantPhenotype): string {
  const shape = phenotype.shape === 'round' ? '丸' : 'しわ';
  if (!phenotype.color) return shape;
  return `${shape}・${phenotype.color === 'yellow' ? '黄' : '緑'}`;
}

function seedName(seed: SeedItem): string {
  if (seed.generation === 'P' || seed.generation === 'Lv3Mystery') {
    return seed.parentLabel || seed.generation;
  }
  const gen = seed.generation === 'Custom' || seed.generation === 'Test' ? '収穫豆' : seed.generation;
  return `${gen}（${phenotypeLabel(seed.phenotype)}）`;
}

export function generatePodsForPlant(
  mother: SeedItem,
  isEmasculated: boolean,
  pollinator: SeedItem | null
): { pods: PodData[]; actualPollination: 'self' | 'cross' | 'failed' } {
  // 除雄したのに受粉させなかった花は実らない
  if (isEmasculated && !pollinator) {
    return { pods: [], actualPollination: 'failed' };
  }

  // 除雄していない花は必ず自家受精になる（他の花粉をつけても無効）
  const father = isEmasculated ? pollinator : null;
  const fatherGenotype = father ? father.genotype : mother.genotype;
  const generation = nextGeneration(mother, father);
  const sourceNote = father
    ? `${seedName(mother)} × ${seedName(father)}`
    : `${seedName(mother)} の自家受精`;

  let testedMysteryId: string | undefined;
  if (generation === 'Test' && father) {
    testedMysteryId = mother.generation === 'Lv3Mystery' ? mother.mysteryId : father.mysteryId;
  }

  const podCount = getRandomInt(4, 8);
  const pods: PodData[] = [];

  for (let i = 0; i < podCount; i++) {
    const seedCount = getRandomInt(4, 8);
    const seeds: SeedItem[] = [];

    for (let s = 0; s < seedCount; s++) {
      const { genotype, phenotype } = fertilize(mother.genotype, fatherGenotype);
      seeds.push({
        id: `seed_${Date.now()}_${i}_${s}_${Math.random().toString(36).substring(2, 6)}`,
        genotype,
        phenotype,
        generation,
        parentLabel: sourceNote,
      });
    }

    pods.push({
      id: `pod_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      isCracked: false,
      seeds,
      sourceNote,
      pollination: father ? 'cross' : 'self',
      testedMysteryId,
    });
  }

  return { pods, actualPollination: father ? 'cross' : 'self' };
}

// そのレベルの集計に入れる豆か（純系の自家受精などで比率が濁らないように）
export function isTargetSeed(level: number, seed: SeedItem): boolean {
  const hasColor = !!seed.genotype.color;
  if (level === 1) return seed.generation === 'F1' && !hasColor;
  if (level === 2) return seed.generation === 'F2' && !hasColor;
  if (level === 3) return seed.generation === 'Test';
  return seed.generation === 'F2' && hasColor;
}

// 検証に必要な粒数（Lv3は3粒すべての検定交雑が条件）
export const REQUIRED_SEEDS: { [level: number]: number } = { 1: 10, 2: 100, 3: 0, 4: 300 };

// 収穫した豆を「世代＋見た目」で種袋にまとめる。遺伝子型は1粒ずつ保持する
export function mergeHarvestIntoBag(bag: GameState['seedBag'], harvested: SeedItem[]): GameState['seedBag'] {
  const result = [...bag];
  harvested.forEach((seed) => {
    const key = `${seed.generation}_${seed.phenotype.shape}_${seed.phenotype.color || 'none'}`;
    const id = `harvest_${key}`;
    const index = result.findIndex((item) => item.id === id);
    if (index >= 0) {
      const item = result[index];
      const seeds = [...(item.seeds || []), seed];
      result[index] = { ...item, seeds, count: seeds.length };
    } else {
      const gen = seed.generation === 'Test' ? '検定交雑の子' : seed.generation === 'Custom' ? 'その他の交配' : seed.generation;
      result.unshift({
        id,
        sampleSeed: seed,
        seeds: [seed],
        count: 1,
        label: `${gen} 収穫豆（${phenotypeLabel(seed.phenotype)}）`,
      });
    }
  });
  return result;
}

// 種袋から1粒取り出す。収穫豆はランダムな1粒、最初の種は減らない
export function takeSeedFromBag(bag: GameState['seedBag'], itemId: string): { bag: GameState['seedBag']; seed: SeedItem } | null {
  const item = bag.find((i) => i.id === itemId);
  if (!item || item.count <= 0) return null;
  if (item.isStartingSeed || !item.seeds) {
    return { bag, seed: item.sampleSeed };
  }
  const index = getRandomInt(0, item.seeds.length - 1);
  const seed = item.seeds[index];
  const seeds = item.seeds.filter((_, i) => i !== index);
  return {
    bag: bag.map((i) => (i.id === itemId ? { ...i, seeds, count: seeds.length } : i)),
    seed,
  };
}

// そのレベルの畑で選べる豆か
export function isBagItemForLevel(item: GameState['seedBag'][number], level: number): boolean {
  const hasColor = !!item.sampleSeed.genotype.color;
  if (item.sampleSeed.generation === 'Lv3Mystery' && level !== 3) return false;
  return level === 4 ? hasColor : !hasColor;
}

// ==========================================
// 5. 開発用 ?check 検証シミュレーション
// F2（Aa×Aa）10000粒、Lv4 F2（AaBb×AaBb）10000粒
// ==========================================
export interface CheckValidationResult {
  f2Mono: {
    total: number;
    round: number;
    wrinkled: number;
    roundRatio: number;
    wrinkledRatio: number;
    passed: boolean; // ±1% (0.74 ~ 0.76)
  };
  f2Di: {
    total: number;
    roundYellow: number;
    roundGreen: number;
    wrinkledYellow: number;
    wrinkledGreen: number;
    ratioRY: number;
    ratioRG: number;
    ratioWY: number;
    ratioWG: number;
    passed: boolean; // 9:3:3:1 各 ±1% (56.25±1%, 18.75±1%, 18.75±1%, 6.25±1%)
  };
}

export function runGeneticsVerification(): CheckValidationResult {
  console.group('🌿 [メンデルの畑] 遺伝シミュレーション検証 (?check)');

  // 1. F2 単性雑種 (Aa × Aa) 10,000粒
  const monoMother: PlantGenotype = { shape: 'Aa' };
  const monoFather: PlantGenotype = { shape: 'Aa' };
  let roundCount = 0;
  let wrinkledCount = 0;
  const monoTotal = 10000;

  for (let i = 0; i < monoTotal; i++) {
    const result = fertilize(monoMother, monoFather);
    if (result.phenotype.shape === 'round') {
      roundCount++;
    } else {
      wrinkledCount++;
    }
  }

  const roundRatio = roundCount / monoTotal;
  const wrinkledRatio = wrinkledCount / monoTotal;
  const monoPassed = roundRatio >= 0.74 && roundRatio <= 0.76;

  console.log(
    `【F2 (Aa×Aa) 10000粒検証】\n` +
      `丸: ${roundCount} (${(roundRatio * 100).toFixed(2)}%), ` +
      `しわ: ${wrinkledCount} (${(wrinkledRatio * 100).toFixed(2)}%)\n` +
      `期待値: 75.00% : 25.00% (3:1) -> 判定: ${monoPassed ? '✅ 合格 (誤差±1%以内)' : '❌ 不合格'}`
  );

  // 2. F2 二性雑種 (AaBb × AaBb) 10,000粒
  const diMother: PlantGenotype = { shape: 'Aa', color: 'Bb' };
  const diFather: PlantGenotype = { shape: 'Aa', color: 'Bb' };
  let ry = 0; // 丸・黄 (A_B_)
  let rg = 0; // 丸・緑 (A_bb)
  let wy = 0; // しわ・黄 (aaB_)
  let wg = 0; // しわ・緑 (aabb)
  const diTotal = 10000;

  for (let i = 0; i < diTotal; i++) {
    const result = fertilize(diMother, diFather);
    const shape = result.phenotype.shape;
    const color = result.phenotype.color;

    if (shape === 'round' && color === 'yellow') ry++;
    else if (shape === 'round' && color === 'green') rg++;
    else if (shape === 'wrinkled' && color === 'yellow') wy++;
    else if (shape === 'wrinkled' && color === 'green') wg++;
  }

  const ratioRY = ry / diTotal;
  const ratioRG = rg / diTotal;
  const ratioWY = wy / diTotal;
  const ratioWG = wg / diTotal;

  // 期待値: 9/16=56.25%, 3/16=18.75%, 3/16=18.75%, 1/16=6.25%
  const passedRY = ratioRY >= 0.5525 && ratioRY <= 0.5725;
  const passedRG = ratioRG >= 0.1775 && ratioRG <= 0.1975;
  const passedWY = ratioWY >= 0.1775 && ratioWY <= 0.1975;
  const passedWG = ratioWG >= 0.0525 && ratioWG <= 0.0725;
  const diPassed = passedRY && passedRG && passedWY && passedWG;

  console.log(
    `【Lv4 F2 (AaBb×AaBb) 10000粒検証】\n` +
      `丸・黄: ${ry} (${(ratioRY * 100).toFixed(2)}%) [期待56.25%]\n` +
      `丸・緑: ${rg} (${(ratioRG * 100).toFixed(2)}%) [期待18.75%]\n` +
      `しわ・黄: ${wy} (${(ratioWY * 100).toFixed(2)}%) [期待18.75%]\n` +
      `しわ・緑: ${wg} (${(ratioWG * 100).toFixed(2)}%) [期待6.25%]\n` +
      `比率 ≒ ${(ratioRY / ratioWG).toFixed(2)} : ${(ratioRG / ratioWG).toFixed(2)} : ${(ratioWY / ratioWG).toFixed(2)} : 1\n` +
      `判定: ${diPassed ? '✅ 合格 (各項目誤差±1%以内)' : '❌ 不合格'}`
  );
  console.groupEnd();

  return {
    f2Mono: {
      total: monoTotal,
      round: roundCount,
      wrinkled: wrinkledCount,
      roundRatio,
      wrinkledRatio,
      passed: monoPassed,
    },
    f2Di: {
      total: diTotal,
      roundYellow: ry,
      roundGreen: rg,
      wrinkledYellow: wy,
      wrinkledGreen: wg,
      ratioRY,
      ratioRG,
      ratioWY,
      ratioWG,
      passed: diPassed,
    },
  };
}
