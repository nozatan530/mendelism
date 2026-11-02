/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ShapeGenotype = 'AA' | 'Aa' | 'aa';
export type ColorGenotype = 'BB' | 'Bb' | 'bb';

export interface PlantGenotype {
  shape: ShapeGenotype;
  color?: ColorGenotype;
}

export type ShapePhenotype = 'round' | 'wrinkled'; // 丸 | しわ
export type ColorPhenotype = 'yellow' | 'green';   // 黄 | 緑

export interface PlantPhenotype {
  shape: ShapePhenotype;
  color?: ColorPhenotype;
}

export interface Gamete {
  shape: 'A' | 'a';
  color?: 'B' | 'b';
}

export interface SeedItem {
  id: string;
  genotype: PlantGenotype;
  phenotype: PlantPhenotype;
  generation: 'P' | 'F1' | 'F2' | 'Lv3Mystery' | 'Test' | 'Custom';
  parentLabel?: string;
  identifiedGenotype?: ShapeGenotype; // For Lv3 when user solves the testcross
  mysteryId?: string; // Lv3の謎の豆なら、そのID
}

export type PlantStage =
  | 'SEEDED'   // まきたて（土が盛られた状態）
  | 'SPROUT'   // 発芽（小さな双葉）
  | 'GROWING'  // 成長中（青葉と巻きひげ）
  | 'BUD'      // つぼみ（★除雄が可能）
  | 'FLOWER'   // 開花（★筆で受粉が可能）
  | 'PODS';    // サヤ結実（収穫可能）

export interface PlantData {
  id: string;
  slotIndex: number;
  seed: SeedItem;
  stage: PlantStage;
  isEmasculated: boolean; // 除雄したか（おしべを取り除いたか）
  pollinatedByPlantId: string | null; // 花粉親株ID
  pollinatorSeed?: SeedItem; // 花粉親の豆（花粉親を収穫しても失われないよう保持）
  pollinationResult: 'self' | 'cross' | 'failed'; // 結実判定
  pods: PodData[];
}

export interface PodData {
  id: string;
  isCracked: boolean;
  seeds: SeedItem[];
  sourceNote: string; // どの株の、どんな受粉で実ったか
  pollination: 'self' | 'cross';
  testedMysteryId?: string; // しわ(aa)との検定交雑なら、調べた謎の豆のID
}

export interface LevelStats {
  totalSeeds: number;
  round: number;
  wrinkled: number;
  yellow: number;
  green: number;
  roundYellow: number;
  roundGreen: number;
  wrinkledYellow: number;
  wrinkledGreen: number;
  history: {
    cumulativeCount: number;
    roundRatio: number;
  }[];
}

export interface MysteryNoteItem {
  level: number;
  title: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  selectedOptionIndex: number | null;
  predictionLocked?: boolean; // 実験前に予想を確定したか
  isSubmitted: boolean;
  explanation: string;
  punnettSquare: {
    headersCol: string[];
    headersRow: string[];
    grid: { genotype: string; phenotype: string }[][];
  };
}

export interface Lv3MysterySeedStatus {
  id: string;
  name: string;
  realGenotype: ShapeGenotype; // AA or Aa (hidden from user until confirmed)
  userGuess: ShapeGenotype | null;
  confirmed: boolean;
}

export interface GameState {
  currentLevel: 1 | 2 | 3 | 4;
  unlockedLevels: number[];
  plots: (PlantData | null)[];
  seedBag: {
    id: string;
    sampleSeed: SeedItem;
    count: number;
    label: string;
    isStartingSeed?: boolean;
    hiddenGenotype?: boolean;
    seeds?: SeedItem[]; // 収穫した豆。1粒ずつ遺伝子型が違う
  }[];
  currentHarvestPods: PodData[]; // 収穫台に並んでいるサヤ
  harvestHistoryNote: string | null;
  levelStats: { [level: number]: LevelStats };
  notebooks: { [level: number]: MysteryNoteItem };
  lv3MysterySeeds: Lv3MysterySeedStatus[];
  lv3Results: { [mysteryId: string]: { round: number; wrinkled: number } };
  soundEnabled: boolean;
  activeTab: 'garden' | 'harvest' | 'stats' | 'notebook' | 'seedbag';
}
