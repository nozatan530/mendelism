// 遺伝モデルの試算。`npm run check` で実行する
import { SeedItem } from '../src/types';
import {
  fertilize, generatePodsForPlant, isTargetSeed, mergeHarvestIntoBag, nextGeneration, setRandomSeed, takeSeedFromBag,
} from '../src/utils/genetics';

setRandomSeed(530);
let failed = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? 'OK ' : 'NG '} ${name} ${detail}`);
  if (!ok) failed++;
};
const seed = (generation: SeedItem['generation'], shape: 'AA' | 'Aa' | 'aa', color?: 'BB' | 'Bb' | 'bb'): SeedItem => ({
  id: 'x', generation, genotype: { shape, color },
  phenotype: { shape: shape === 'aa' ? 'wrinkled' : 'round', color: color ? (color === 'bb' ? 'green' : 'yellow') : undefined },
});

const N = 100000;
let round = 0;
for (let i = 0; i < N; i++) if (fertilize({ shape: 'Aa' }, { shape: 'Aa' }).phenotype.shape === 'round') round++;
check('F2 丸の割合 ≒ 0.75', Math.abs(round / N - 0.75) < 0.01, (round / N).toFixed(4));

const di: Record<string, number> = {};
for (let i = 0; i < N; i++) {
  const p = fertilize({ shape: 'Aa', color: 'Bb' }, { shape: 'Aa', color: 'Bb' }).phenotype;
  di[`${p.shape}_${p.color}`] = (di[`${p.shape}_${p.color}`] || 0) + 1;
}
const near = (k: string, e: number) => Math.abs(di[k] / N - e) < 0.01;
check('9:3:3:1', near('round_yellow', 9 / 16) && near('round_green', 3 / 16) && near('wrinkled_yellow', 3 / 16) && near('wrinkled_green', 1 / 16));

const pAA = seed('P', 'AA'); const paa = seed('P', 'aa');
const f1 = generatePodsForPlant(pAA, true, paa);
const f1Seeds = f1.pods.flatMap((p) => p.seeds);
check('丸×しわのF1はすべて丸', f1Seeds.every((s) => s.phenotype.shape === 'round' && s.generation === 'F1'));
check('F1は集計対象', isTargetSeed(1, f1Seeds[0]));
const forgot = generatePodsForPlant(pAA, false, paa);
check('除雄を忘れると自家受精（花粉は無効）', forgot.actualPollination === 'self' && forgot.pods.flatMap((p) => p.seeds).every((s) => s.genotype.shape === 'AA' && s.generation === 'P'));
check('純系の自家受精は集計対象外', !isTargetSeed(1, forgot.pods[0].seeds[0]));
const none = generatePodsForPlant(pAA, true, null);
check('除雄して未受粉なら実らない', none.pods.length === 0 && none.actualPollination === 'failed');
check('F1の自家受精はF2', nextGeneration(seed('F1', 'Aa'), null) === 'F2');

// 同じサヤに丸としわが混ざるか
let mixed = false;
for (let i = 0; i < 50 && !mixed; i++) {
  mixed = generatePodsForPlant(seed('F1', 'Aa'), false, null).pods.some((p) => {
    const kinds = new Set(p.seeds.map((s) => s.phenotype.shape));
    return kinds.size === 2;
  });
}
check('F1株の同じサヤに丸としわが混ざる', mixed);

// 種袋：F2を収穫してまき直すと、1粒ずつの遺伝子型が保たれる（丸はAA:Aa≒1:2）
const f2: SeedItem[] = [];
for (let i = 0; i < 3000; i++) f2.push(...generatePodsForPlant(seed('F1', 'Aa'), false, null).pods.flatMap((p) => p.seeds));
const sample = f2.slice(0, 6000);
let bag = mergeHarvestIntoBag([], sample);
const roundItem = bag.find((b) => b.sampleSeed.phenotype.shape === 'round')!;
check('種袋は丸としわに分かれる', bag.length === 2);
let aa = 0; let het = 0;
while (true) {
  const taken = takeSeedFromBag(bag, roundItem.id);
  if (!taken) break;
  bag = taken.bag;
  if (taken.seed.genotype.shape === 'AA') aa++; else het++;
}
check('丸いF2のAaは約2/3', Math.abs(het / (aa + het) - 2 / 3) < 0.03, (het / (aa + het)).toFixed(3));

// 検定交雑：母が謎の豆でも、父が謎の豆でも記録される
const m = { ...seed('Lv3Mystery', 'Aa'), mysteryId: 'm1' };
check('謎×しわ', generatePodsForPlant(m, true, paa).pods[0].testedMysteryId === 'm1');
check('しわ×謎', generatePodsForPlant(paa, true, m).pods[0].testedMysteryId === 'm1');
check('謎×丸は検定交雑ではない', generatePodsForPlant(m, true, pAA).pods[0].testedMysteryId === undefined);

process.exit(failed ? 1 : 0);
