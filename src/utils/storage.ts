/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GameState,
  LevelStats,
  Lv3MysterySeedStatus,
  MysteryNoteItem,
  SeedItem,
  ShapeGenotype,
} from '../types';

const STORAGE_KEY = 'mendel_garden_save_v2';

export function createInitialLevelStats(): LevelStats {
  return {
    totalSeeds: 0,
    round: 0,
    wrinkled: 0,
    yellow: 0,
    green: 0,
    roundYellow: 0,
    roundGreen: 0,
    wrinkledYellow: 0,
    wrinkledGreen: 0,
    history: [],
  };
}

export function createDefaultNotebooks(): { [level: number]: MysteryNoteItem } {
  return {
    1: {
      level: 1,
      title: '第1章：顕性の発見',
      question:
        '純系の「丸（AA）」と「しわ（aa）」を人工交配してできた種子（F1）は、どんな形になるだろう？',
      options: [
        '丸としわの中間のような、少しでこぼこした豆になる',
        '丸としわが半々（1：1）で混ざってできる',
        'すべて丸い豆になる（丸の形質だけが現れる）',
      ],
      correctOptionIndex: 2,
      selectedOptionIndex: null,
      isSubmitted: false,
      explanation:
        '異なる対立形質をもつ純系同士を交配したとき、子（F1）には一方の形質だけが現れます。現れる形質を顕性（丸・A）、現れない形質を潜性（しわ・a）といいます。以前は優性・劣性と呼ばれていましたが、形質がすぐれている・劣っているという意味ではありません。',
      punnettSquare: {
        headersCol: ['A (丸親)', 'A (丸親)'],
        headersRow: ['a (しわ親)', 'a (しわ親)'],
        grid: [
          [
            { genotype: 'Aa', phenotype: '丸' },
            { genotype: 'Aa', phenotype: '丸' },
          ],
          [
            { genotype: 'Aa', phenotype: '丸' },
            { genotype: 'Aa', phenotype: '丸' },
          ],
        ],
      },
    },
    2: {
      level: 2,
      title: '第2章：分離の法則と3:1の比率',
      question:
        'F1（Aa）の株を自家受精させて得られる孫（F2）の種子は、どのような比率になるだろう？',
      options: [
        'すべて丸い豆のまま、しわは二度と現れない',
        '丸としわがおよそ 3：1 の比率で現れる',
        '丸としわがおよそ 1：1 の比率で現れる',
      ],
      correctOptionIndex: 1,
      selectedOptionIndex: null,
      isSubmitted: false,
      explanation:
        'F1の体細胞にある一対の遺伝子（Aa）は、配偶子（花粉・卵細胞）が作られるときに別々の細胞へ「分離」して入ります（分離の法則）。これらが受精でランダムに出会うため、F2の遺伝子型は AA：Aa：aa ＝ 1：2：1 となり、見た目の表現型は 丸：しわ ＝ 3：1 になります。',
      punnettSquare: {
        headersCol: ['A (1/2)', 'a (1/2)'],
        headersRow: ['A (1/2)', 'a (1/2)'],
        grid: [
          [
            { genotype: 'AA', phenotype: '丸' },
            { genotype: 'Aa', phenotype: '丸' },
          ],
          [
            { genotype: 'Aa', phenotype: '丸' },
            { genotype: 'aa', phenotype: 'しわ' },
          ],
        ],
      },
    },
    3: {
      level: 3,
      title: '第3章：検定交雑（テストクロス）',
      question:
        '見た目が丸いエンドウが純系（AA）かヘテロ（Aa）かを確かめるには、どうすればよいだろう？',
      options: [
        '虫眼鏡で表面を詳しく見比べれば見抜ける',
        '潜性の「しわ（aa）」と交配し、子にしわが出るか調べる',
        'もう一度丸い豆と交配して様子を見る',
      ],
      correctOptionIndex: 1,
      selectedOptionIndex: null,
      isSubmitted: false,
      explanation:
        '顕性の表現型を示す個体の遺伝子型（AA または Aa）を調べるために、潜性のホモ接合体（aa）と交配することを「検定交雑（テストクロス）」と呼びます。親が Aa であれば、子は 丸：しわ ＝ 1：1 で現れるため、1粒でもしわが出れば Aa だと確定できます（図）。親が AA なら子はすべて Aa（丸）です。',
      punnettSquare: {
        headersCol: ['A (Aa親)', 'a (Aa親)'],
        headersRow: ['a (検定親)', 'a (検定親)'],
        grid: [
          [
            { genotype: 'Aa', phenotype: '丸' },
            { genotype: 'aa', phenotype: 'しわ' },
          ],
          [
            { genotype: 'Aa', phenotype: '丸' },
            { genotype: 'aa', phenotype: 'しわ' },
          ],
        ],
      },
    },
    4: {
      level: 4,
      title: '第4章：独立の法則（2遺伝子座）',
      question:
        '形（丸・しわ）と子葉の色（黄・緑）の2つの遺伝子は、一緒に交配したときどのように伝わるだろう？',
      options: [
        '丸と黄、しわと緑は常にセットで結びついて離れない',
        '形と色は互いに影響せず、独立して配偶子に分かれて組み合わさる（9:3:3:1）',
        '新しい中間の色や形しかできなくなる',
      ],
      correctOptionIndex: 1,
      selectedOptionIndex: null,
      isSubmitted: false,
      explanation:
        '2対以上の対立遺伝子が異なる染色体上にある場合、それぞれが互いに影響されずに独立して配偶子に分離・伝達されます（独立の法則）。(丸3:しわ1) × (黄3:緑1) ＝ 丸黄9 : 丸緑3 : しわ黄3 : しわ緑1 という美しい整数比が得られます。',
      punnettSquare: {
        headersCol: ['AB (1/4)', 'Ab (1/4)', 'aB (1/4)', 'ab (1/4)'],
        headersRow: ['AB (1/4)', 'Ab (1/4)', 'aB (1/4)', 'ab (1/4)'],
        grid: [
          [
            { genotype: 'AABB', phenotype: '丸黄' },
            { genotype: 'AABb', phenotype: '丸黄' },
            { genotype: 'AaBB', phenotype: '丸黄' },
            { genotype: 'AaBb', phenotype: '丸黄' },
          ],
          [
            { genotype: 'AABb', phenotype: '丸黄' },
            { genotype: 'AAbb', phenotype: '丸緑' },
            { genotype: 'AaBb', phenotype: '丸黄' },
            { genotype: 'Aabb', phenotype: '丸緑' },
          ],
          [
            { genotype: 'AaBB', phenotype: '丸黄' },
            { genotype: 'AaBb', phenotype: '丸黄' },
            { genotype: 'aaBB', phenotype: 'しわ黄' },
            { genotype: 'aaBb', phenotype: 'しわ黄' },
          ],
          [
            { genotype: 'AaBb', phenotype: '丸黄' },
            { genotype: 'Aabb', phenotype: '丸緑' },
            { genotype: 'aaBb', phenotype: 'しわ黄' },
            { genotype: 'aabb', phenotype: 'しわ緑' },
          ],
        ],
      },
    },
  };
}

export function generateDefaultLv3MysterySeeds(): Lv3MysterySeedStatus[] {
  // 3粒の謎の丸い豆。AAとAaが必ず混ざり、並びは毎回変わる
  const candidates: ShapeGenotype[] = Math.random() < 0.5 ? ['AA', 'Aa', 'Aa'] : ['AA', 'AA', 'Aa'];
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return [
    {
      id: 'lv3_mystery_1',
      name: '謎の丸豆 ①',
      realGenotype: candidates[0],
      userGuess: null,
      confirmed: false,
    },
    {
      id: 'lv3_mystery_2',
      name: '謎の丸豆 ②',
      realGenotype: candidates[1],
      userGuess: null,
      confirmed: false,
    },
    {
      id: 'lv3_mystery_3',
      name: '謎の丸豆 ③',
      realGenotype: candidates[2],
      userGuess: null,
      confirmed: false,
    },
  ];
}

export function getDefaultSeedBagForLevel(
  level: number,
  lv3MysterySeeds?: Lv3MysterySeedStatus[]
) {
  if (level === 1) {
    return [
      {
        id: 'seed_lv1_pure_round',
        sampleSeed: {
          id: 'sample_p_round',
          genotype: { shape: 'AA' as ShapeGenotype },
          phenotype: { shape: 'round' as const },
          generation: 'P' as const,
          parentLabel: '純系 丸(AA)',
        },
        count: 10,
        label: '純系 丸の種子 (AA)',
        isStartingSeed: true,
      },
      {
        id: 'seed_lv1_pure_wrinkled',
        sampleSeed: {
          id: 'sample_p_wrinkled',
          genotype: { shape: 'aa' as ShapeGenotype },
          phenotype: { shape: 'wrinkled' as const },
          generation: 'P' as const,
          parentLabel: '純系 しわ(aa)',
        },
        count: 10,
        label: '純系 しわの種子 (aa)',
        isStartingSeed: true,
      },
    ];
  }

  if (level === 2) {
    return [
      {
        id: 'seed_lv2_f1_round',
        sampleSeed: {
          id: 'sample_f1_round',
          genotype: { shape: 'Aa' as ShapeGenotype },
          phenotype: { shape: 'round' as const },
          generation: 'F1' as const,
          parentLabel: 'F1株の種子 (Aa)',
        },
        count: 12,
        label: '交配済 F1の丸い種子 (Aa)',
        isStartingSeed: true,
      },
    ];
  }

  if (level === 3) {
    const mysteries = lv3MysterySeeds || generateDefaultLv3MysterySeeds();
    const mysteryItems = mysteries.map((m) => ({
      id: `seed_bag_${m.id}`,
      sampleSeed: {
        id: `sample_${m.id}`,
        genotype: { shape: m.realGenotype },
        phenotype: { shape: 'round' as const },
        generation: 'Lv3Mystery' as const,
        parentLabel: m.name,
        mysteryId: m.id,
        identifiedGenotype: m.confirmed ? m.realGenotype : undefined,
      },
      count: 4,
      label: `${m.name}（遺伝子型不明）`,
      isStartingSeed: true,
      hiddenGenotype: !m.confirmed,
    }));

    return [
      ...mysteryItems,
      {
        id: 'seed_lv3_test_wrinkled',
        sampleSeed: {
          id: 'sample_test_wrinkled',
          genotype: { shape: 'aa' as ShapeGenotype },
          phenotype: { shape: 'wrinkled' as const },
          generation: 'P' as const,
          parentLabel: '検定用 しわ(aa)',
        },
        count: 12,
        label: '検定交雑用 しわの種子 (aa)',
        isStartingSeed: true,
      },
    ];
  }

  // Level 4
  return [
    {
      id: 'seed_lv4_pure_round_yellow',
      sampleSeed: {
        id: 'sample_p_ry',
        genotype: { shape: 'AA' as ShapeGenotype, color: 'BB' as const },
        phenotype: { shape: 'round' as const, color: 'yellow' as const },
        generation: 'P' as const,
        parentLabel: '純系 丸・黄 (AABB)',
      },
      count: 8,
      label: '純系 丸・黄 (AABB)',
      isStartingSeed: true,
    },
    {
      id: 'seed_lv4_pure_wrinkled_green',
      sampleSeed: {
        id: 'sample_p_wg',
        genotype: { shape: 'aa' as ShapeGenotype, color: 'bb' as const },
        phenotype: { shape: 'wrinkled' as const, color: 'green' as const },
        generation: 'P' as const,
        parentLabel: '純系 しわ・緑 (aabb)',
      },
      count: 8,
      label: '純系 しわ・緑 (aabb)',
      isStartingSeed: true,
    },
    {
      id: 'seed_lv4_f1_round_yellow',
      sampleSeed: {
        id: 'sample_f1_ry',
        genotype: { shape: 'Aa' as ShapeGenotype, color: 'Bb' as const },
        phenotype: { shape: 'round' as const, color: 'yellow' as const },
        generation: 'F1' as const,
        parentLabel: 'F1 丸・黄 (AaBb)',
      },
      count: 12,
      label: 'F1雑種 丸・黄 (AaBb)',
      isStartingSeed: true,
    },
  ];
}

export function createDefaultState(): GameState {
  const lv3Mysteries = generateDefaultLv3MysterySeeds();
  return {
    currentLevel: 1,
    unlockedLevels: [1],
    plots: Array(12).fill(null),
    seedBag: getDefaultSeedBagForLevel(1),
    currentHarvestPods: [],
    harvestHistoryNote: null,
    levelStats: {
      1: createInitialLevelStats(),
      2: createInitialLevelStats(),
      3: createInitialLevelStats(),
      4: createInitialLevelStats(),
    },
    notebooks: createDefaultNotebooks(),
    lv3MysterySeeds: lv3Mysteries,
    lv3Results: {},
    soundEnabled: true,
    activeTab: 'garden',
  };
}

export function loadGameState(): GameState {
  if (typeof window === 'undefined') return createDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as Partial<GameState>;

    // Ensure backwards compatibility and default values
    const def = createDefaultState();
    return {
      currentLevel: (parsed.currentLevel || 1) as 1 | 2 | 3 | 4,
      unlockedLevels: parsed.unlockedLevels || [1],
      plots: parsed.plots && parsed.plots.length === 12 ? parsed.plots : def.plots,
      seedBag: parsed.seedBag || def.seedBag,
      currentHarvestPods: parsed.currentHarvestPods || [],
      harvestHistoryNote: parsed.harvestHistoryNote || null,
      levelStats: {
        1: parsed.levelStats?.[1] || createInitialLevelStats(),
        2: parsed.levelStats?.[2] || createInitialLevelStats(),
        3: parsed.levelStats?.[3] || createInitialLevelStats(),
        4: parsed.levelStats?.[4] || createInitialLevelStats(),
      },
      // 文面は常に最新を使い、利用者の回答だけを復元する
      notebooks: Object.fromEntries(
        Object.entries(def.notebooks).map(([lv, note]) => {
          const saved = parsed.notebooks?.[Number(lv)];
          return [lv, {
            ...note,
            selectedOptionIndex: saved?.selectedOptionIndex ?? null,
            isSubmitted: saved?.isSubmitted ?? false,
            predictionLocked: saved?.predictionLocked ?? saved?.isSubmitted ?? false,
          }];
        })
      ),
      lv3MysterySeeds: parsed.lv3MysterySeeds || def.lv3MysterySeeds,
      lv3Results: parsed.lv3Results || {},
      soundEnabled: parsed.soundEnabled !== undefined ? parsed.soundEnabled : true,
      activeTab: parsed.activeTab || 'garden',
    };
  } catch (err) {
    console.error('Failed to load saved state, falling back to default:', err);
    return createDefaultState();
  }
}

export function saveGameState(state: GameState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

export function clearGameState(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear state:', err);
  }
}
