// 依頼の期限と畑の広さを決めるための試算。`npx tsx scripts/balance-game.ts`
import { SeedItem } from '../src/types';
import { generatePodsForPlant, setRandomSeed } from '../src/utils/genetics';
import { customerFindsMixed, samePheno, STARTERS } from '../src/game/logic';

setRandomSeed(530);
const RY = { shape: 'round', color: 'yellow' } as const;
const WG = { shape: 'wrinkled', color: 'green' } as const;
const TRIALS = 2000;
const selfed = (s: SeedItem) => generatePodsForPlant(s, false, null).pods.flatMap((p) => p.seeds);
const pct = (n: number) => `${(100 * n / TRIALS).toFixed(1)}%`.padStart(7);
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

const f1 = generatePodsForPlant(STARTERS[0], true, STARTERS[1]).pods.flatMap((p) => p.seeds);
const makeF2 = (plots: number) => Array.from({ length: plots }, () => selfed(pick(f1)));

console.log('依頼1：1回の交配でのF1の粒数の最小 =', Math.min(...Array.from({ length: TRIALS }, () => generatePodsForPlant(STARTERS[0], true, STARTERS[1]).pods.flatMap((p) => p.seeds).length)));

console.log('\n依頼2：1回の栽培で しわ・緑が5粒以上そろう確率');
for (const plots of [2, 3, 4, 6]) {
  let ok = 0;
  for (let t = 0; t < TRIALS; t++) {
    if (makeF2(plots).flat().filter((s) => samePheno(s.phenotype, WG)).length >= 5) ok++;
  }
  console.log(` ${plots}株`, pct(ok));
}

console.log('\n依頼3：作戦ごとの合格率（F2は6株分ある状態から）');
console.log(' 畑  栽培回数  考えた人  1回選抜で納品  選抜なしで納品');
for (const plots of [6, 8, 12]) {
  for (const grows of [1, 2, 3, 4]) {
    let smart = 0; let oneShot = 0; let naive = 0;
    for (let t = 0; t < TRIALS; t++) {
      const pool = makeF2(6).flat().filter((s) => samePheno(s.phenotype, RY));

      // 選抜なし：F2の丸・黄をそのまま10粒
      const noTest = Array.from({ length: 10 }, () => pick(pool));
      if (!noTest.some(customerFindsMixed)) naive++;

      // 1回だけ自家受精し、子がそろうか見ずに丸・黄を納品
      const families = Array.from({ length: plots }, () => selfed(pick(pool)));
      const ry = families.flat().filter((s) => samePheno(s.phenotype, RY));
      const box = Array.from({ length: 10 }, () => pick(ry));
      if (!box.some(customerFindsMixed)) oneShot++;

      // 考えた人：子がすべて丸・黄の株を探し、見つかるまで候補を変える
      let candidates = pool;
      let found: SeedItem[] | null = null;
      for (let g = 0; g < grows && !found; g++) {
        const fams = Array.from({ length: plots }, () => selfed(pick(candidates)));
        const uniform = fams.filter((f) => f.every((s) => samePheno(s.phenotype, RY)));
        if (uniform.length > 0) {
          found = uniform.flat();
        } else {
          // そろわなくても、丸・黄の子は次の候補として純度が上がっている
          candidates = fams.flat().filter((s) => samePheno(s.phenotype, RY));
        }
      }
      if (found && found.length >= 10) {
        const delivered = Array.from({ length: 10 }, () => pick(found!));
        if (!delivered.some(customerFindsMixed)) smart++;
      }
    }
    console.log(` ${String(plots).padStart(2)}    ${grows}回    ${pct(smart)}     ${pct(oneShot)}       ${pct(naive)}`);
  }
}
