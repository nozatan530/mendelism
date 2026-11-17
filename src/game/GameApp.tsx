/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Lightbulb, PackageCheck, Play, RotateCcw, Sprout, Star, FastForward } from 'lucide-react';
import { PlantData, PlantStage, SeedItem } from '../types';
import { generatePodsForPlant, phenotypeLabel } from '../utils/genetics';
import { playHarvestFanfare, playPodPop, playSuccessChime } from '../utils/sound';
import { FlowerModal } from '../components/FlowerModal';
import { PeaVisual } from '../components/PeaVisual';
import { PlantVisual } from '../components/PlantVisual';
import { StepGuide } from '../components/StepGuide';
import { GameSelection, getGameGuide, hasBothStarters } from './guide';
import {
  applyDeadline,
  applyDelivery,
  createGame,
  GameData,
  HarvestPlant,
  judgeDelivery,
  Lot,
  lotGroups,
  ORDERS,
  phenoKey,
  samePheno,
  STARTERS,
  START_CREDIT,
  takeFromLot,
} from './logic';

const SAVE_KEY = 'mendel_breeder_v1';
const FONT = { fontFamily: 'Zen Maru Gothic, sans-serif' };
const STAGE_ORDER: PlantStage[] = ['SEEDED', 'SPROUT', 'GROWING', 'BUD', 'FLOWER', 'PODS'];
const STAGE_GUIDE: { [s in PlantStage]: string } = {
  SEEDED: '種をまいたら、育て始めよう。',
  SPROUT: '芽が出ました。',
  GROWING: '葉が茂ってきました。もうすぐつぼみです。',
  BUD: 'つぼみの時期です。交配するなら、今のうちに株をタップしておしべを取り除こう。',
  FLOWER: '花が咲きました。除雄した株をタップして、筆で花粉をつけよう。',
  PODS: 'サヤが実りました。収穫しよう。',
};

type Selection = GameSelection;
const HINT = 'ring-4 ring-amber-400 ring-offset-2';

function loadGame(): GameData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as GameData) : createGame();
  } catch {
    return createGame();
  }
}

const beforeBud = (stage?: PlantStage) => !!stage && STAGE_ORDER.indexOf(stage) < STAGE_ORDER.indexOf('BUD');

function growPlant(plant: PlantData): PlantData {
  const next = STAGE_ORDER[STAGE_ORDER.indexOf(plant.stage) + 1];
  if (!next) return plant;
  if (next !== 'PODS') return { ...plant, stage: next };
  const { pods, actualPollination } = generatePodsForPlant(
    plant.seed,
    plant.isEmasculated,
    plant.pollinatorSeed || null
  );
  return { ...plant, stage: 'PODS', pods, pollinationResult: actualPollination };
}

export default function GameApp() {
  const [game, setGame] = useState<GameData>(loadGame);
  const [selection, setSelection] = useState<Selection>({ kind: 'starter', id: STARTERS[0].id });
  const [box, setBox] = useState<{ [pick: string]: number }>({});
  const [focusId, setFocusId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    } catch {
      // 保存できなくても遊べる
    }
  }, [game]);

  const order = ORDERS[game.orderIndex];
  const guide = getGameGuide(game, box);
  const hint = (button: typeof guide.button) => (guide.button === button ? HINT : '');
  // 案内が勧める豆が変わったら、選び直しておく（前に選んだ豆をまちがえてまかないように）
  const guideSelKey = guide.sel ? JSON.stringify(guide.sel) : '';
  useEffect(() => {
    if (guideSelKey) setSelection(JSON.parse(guideSelKey) as Selection);
  }, [guideSelKey]);
  const plants = game.plants.filter((p): p is PlantData => p !== null);
  const stage = plants[0]?.stage ?? 'SEEDED';
  const focused = plants.find((p) => p.id === focusId) ?? null;
  const emptyPlots = game.plants.filter((p) => p === null).length;

  const available = (sel: Selection): boolean => {
    if (sel.kind === 'starter') return true;
    const lot = game.lots.find((l) => l.id === sel.lotId);
    return !!lot && lot.seeds.some((s) => phenoKey(s.phenotype) === sel.key);
  };
  const isSelected = (sel: Selection) => JSON.stringify(sel) === JSON.stringify(selection);

  const sow = (g: GameData, slot: number): GameData => {
    let lots = g.lots;
    let seed: SeedItem | undefined;
    if (selection.kind === 'starter') {
      seed = STARTERS.find((s) => s.id === selection.id);
    } else {
      const taken = takeFromLot(lots, selection.lotId, selection.key);
      if (taken) {
        lots = taken.lots;
        seed = taken.seed;
      }
    }
    if (!seed) return g;
    const plant: PlantData = {
      id: `plant_${Date.now()}_${slot}`,
      slotIndex: slot,
      seed: { ...seed },
      stage: 'SEEDED',
      isEmasculated: false,
      pollinatedByPlantId: null,
      pollinationResult: 'self',
      pods: [],
    };
    const nextPlants = [...g.plants];
    nextPlants[slot] = plant;
    return { ...g, lots, plants: nextPlants };
  };

  const sowAll = () => {
    setGame((g) => {
      let next = g;
      g.plants.forEach((p, i) => {
        if (!p) next = sow(next, i);
      });
      return next;
    });
  };

  const advance = (toPods: boolean) => {
    setGame((g) => {
      const started = g.growing ? g : { ...applyDeadline(g), growing: true };
      const grow = (list: (PlantData | null)[]) => list.map((p) => (p ? growPlant(p) : null));
      // 除雄したまま受粉していない花があれば、早送りは開花で止める（そのまま進むと実らない）
      const waiting = (list: (PlantData | null)[]) =>
        list.some((p) => p && p.stage === 'FLOWER' && p.isEmasculated && !p.pollinatedByPlantId);
      if (toPods && waiting(started.plants)) {
        return { ...started, notice: '除雄して、まだ受粉していない花があります。花をタップして受粉させてから進めよう。' };
      }
      // 2種類の純系を植えたときは、つぼみで一度止める（通り過ぎると交配できない）
      const stageOf = (list: (PlantData | null)[]) => list.find((p) => p)?.stage;
      const stopAtBud = toPods && hasBothStarters(started.plants) && beforeBud(stageOf(started.plants));
      const reachedBud = (list: (PlantData | null)[]) => stopAtBud && stageOf(list) === 'BUD';
      // 前の段階の案内（つぼみ・開花）は、先へ進めたら消す
      const stale = g.growing ? null : started.notice;
      let list = started.plants;
      do {
        list = grow(list);
      } while (toPods && list.some((p) => p && p.stage !== 'PODS') && !waiting(list) && !reachedBud(list));
      return {
        ...started,
        plants: list,
        notice: !toPods
          ? stale
          : waiting(list)
          ? '開花しました。除雄した花に、筆で花粉をつけよう。'
          : reachedBud(list)
          ? 'つぼみになりました。かけ合わせるなら、今のうちにおしべを取ろう。このまま進めると自家受精になります。'
          : stale,
      };
    });
  };

  const harvestAll = () => {
    playHarvestFanfare(true);
    setFocusId(null);
    setGame((g) => {
      const harvest: HarvestPlant[] = g.plants
        .filter((p): p is PlantData => p !== null)
        .map((p) => ({
          plotNo: p.slotIndex + 1,
          label: p.pods[0]?.sourceNote ?? `${p.seed.parentLabel || '株'}（受粉せず）`,
          pollination: p.pollinationResult,
          pods: p.pods,
        }));
      return {
        ...g,
        harvest,
        growing: false,
        plants: Array(g.plotCount).fill(null),
      };
    });
  };

  const crack = (plotNo: number, podId?: string) => {
    playPodPop(true);
    setGame((g) => ({
      ...g,
      harvest: (g.harvest || []).map((h) =>
        h.plotNo !== plotNo && podId !== undefined
          ? h
          : {
              ...h,
              pods: h.pods.map((p) => (podId === undefined || p.id === podId ? { ...p, isCracked: true } : p)),
            }
      ),
    }));
  };

  const storeHarvest = () => {
    setGame((g) => {
      const newLots: Lot[] = (g.harvest || [])
        .filter((h) => h.pods.length > 0)
        .map((h) => ({
          id: `lot_${g.season}_${h.plotNo}`,
          season: g.season,
          plotNo: h.plotNo,
          label: h.label,
          pollination: h.pollination === 'cross' ? 'cross' : 'self',
          seeds: h.pods.flatMap((p) => p.seeds),
        }));
      return {
        ...g,
        harvest: null,
        lots: [...newLots, ...g.lots],
        season: g.season + 1,
        growsLeft: Math.max(0, g.growsLeft - 1),
      };
    });
  };

  const boxTotal = Object.values(box).reduce((a, b) => a + b, 0);
  const addToBox = (lot: Lot, key: string, stock: number) => {
    if (!order || boxTotal >= order.qty) return;
    const pick = `${lot.id}|${key}`;
    const current = box[pick] || 0;
    const add = Math.min(stock - current, order.qty - boxTotal);
    if (add > 0) setBox({ ...box, [pick]: current + add });
  };

  const deliver = () => {
    setGame((g) => {
      let lots = g.lots;
      const seeds: SeedItem[] = [];
      Object.entries(box).forEach(([pick, count]) => {
        const [lotId, key] = pick.split('|');
        for (let i = 0; i < Number(count); i++) {
          const taken = takeFromLot(lots, lotId, key);
          if (taken) {
            lots = taken.lots;
            seeds.push(taken.seed);
          }
        }
      });
      const result = judgeDelivery(ORDERS[g.orderIndex], seeds);
      if (result.passed) playSuccessChime(true);
      return applyDelivery({ ...g, lots }, result);
    });
    setBox({});
    setShowHint(false);
  };

  const restart = () => {
    setGame(createGame());
    setBox({});
    setSelection({ kind: 'starter', id: STARTERS[0].id });
    setShowHint(false);
  };

  const delivery = game.lastDelivery;
  const deliveredOrder = delivery ? ORDERS.find((o) => o.id === delivery.orderId) : null;
  const gameOver = game.credit <= 0;
  const cleared = !order;

  return (
    <div className="min-h-screen bg-[#F8F5EE] text-[#2C3E2D]">
      {/* 状態バー */}
      <header className="sticky top-0 z-30 bg-[#F4EFE6]/95 backdrop-blur border-b border-[#DECFA4]/60 px-4 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <span className="text-lg font-bold text-[#2D452B] whitespace-nowrap" style={FONT}>
            メンデルの畑
          </span>
          <div className="flex items-center gap-3 text-xs font-bold text-[#485945]">
            <span className="whitespace-nowrap">シーズン {game.season}</span>
            <span className="flex items-center gap-0.5" aria-label={`信用 ${game.credit}`}>
              {Array.from({ length: START_CREDIT }, (_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < game.credit ? 'fill-[#E5B824] text-[#C49B14]' : 'text-stone-300'}`}
                />
              ))}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-4 pb-12">
        {/* 依頼 */}
        {order && (
          <section className="bg-[#FAF7F0] border-2 border-[#D8C69F] rounded-2xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#E4DAC2] text-[#4A5D45]">
                依頼 {game.orderIndex + 1} / {ORDERS.length}：{order.client}
              </span>
              <span className={`text-xs font-bold ${game.growsLeft <= 1 ? 'text-red-700' : 'text-[#485945]'}`}>
                {game.growsLeft > 0 ? `期限まで あと ${game.growsLeft} 回栽培できる` : '期限です。今のうちに納品しよう'}
              </span>
            </div>
            <h1 className="text-lg font-bold text-[#2A4428] mt-2" style={FONT}>
              {order.title}
            </h1>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">{order.story}</p>
            <button
              onClick={() => setShowHint(!showHint)}
              className="mt-2 text-xs font-bold text-[#4A7836] flex items-center gap-1 cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              {showHint ? 'ヒントを閉じる' : 'メンデル先生のヒント'}
            </button>
            {showHint && <p className="mt-1 text-xs text-[#485C44] leading-relaxed">{order.hint}</p>}
          </section>
        )}

        {order && !gameOver && <StepGuide guide={guide} notice={null} />}

        {game.notice && (
          <div className="p-3 bg-[#FFF7E8] rounded-xl border border-[#F2D59B] text-xs text-[#6B5324] flex items-center justify-between gap-3">
            <span>{game.notice}</span>
            <button onClick={() => setGame({ ...game, notice: null })} className="font-bold cursor-pointer shrink-0">
              閉じる
            </button>
          </div>
        )}

        {/* 収穫 */}
        {game.harvest ? (
          <HarvestSection harvest={game.harvest} onCrack={crack} onStore={storeHarvest} hint={hint} />
        ) : (
          <>
            {/* 畑 */}
            <section className="bg-[#5C4028] p-3 sm:p-4 rounded-3xl border-4 border-[#3D2918]">
              <p className="text-xs text-[#E8D7C0] font-medium mb-3 px-1">
                {game.growing ? STAGE_GUIDE[stage] : '畑（下の種を選んで、区画をタップ）'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {game.plants.map((plant, i) => (
                  <button
                    key={i}
                    aria-label={`${i + 1}番の区画`}
                    onClick={() => {
                      if (plant) {
                        if (['BUD', 'FLOWER', 'PODS'].includes(plant.stage)) setFocusId(plant.id);
                      } else if (!game.growing) {
                        setGame((g) => sow(g, i));
                      }
                    }}
                    className={`h-36 rounded-2xl p-2 flex flex-col justify-between text-left ${
                      guide.plot === i ? 'ring-4 ring-amber-400 ' : ''
                    }${
                      plant
                        ? 'bg-[#F9F7EE] border-2 border-[#D8C69F]'
                        : 'bg-[#6E4F32]/80 border-2 border-dashed border-[#8A633F] cursor-pointer'
                    }`}
                  >
                    <span className={`text-[10px] font-bold ${plant ? 'text-[#43593E]' : 'text-[#C9B399]'}`}>#{i + 1}</span>
                    {plant ? (
                      <>
                        <div className="flex-1 flex items-center justify-center min-h-0">
                          <PlantVisual
                            stage={plant.stage}
                            isEmasculated={plant.isEmasculated}
                            pollinated={!!plant.pollinatedByPlantId}
                            className="w-20 h-20"
                          />
                        </div>
                        <span className="text-[10px] text-stone-600 truncate w-full">
                          {phenotypeLabel(plant.seed.phenotype)}の豆から
                          {plant.isEmasculated ? '・除雄済' : ''}
                          {plant.pollinatedByPlantId ? '・受粉済' : ''}
                        </span>
                      </>
                    ) : (
                      <span className="flex-1 flex items-center justify-center text-[11px] font-bold text-[#D4B695]">
                        {game.growing ? '' : '種をまく'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {!game.growing && emptyPlots > 0 && (
                  <button
                    onClick={sowAll}
                    disabled={!available(selection)}
                    className={`px-3 py-2 bg-[#E8F0E2] text-[#345924] rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 ring-offset-[#5C4028] ${hint('sowAll')}`}
                  >
                    空き区画すべてにまく
                  </button>
                )}
                {stage !== 'PODS' && plants.length > 0 && (
                  <>
                    <button
                      onClick={() => advance(false)}
                      className={`px-4 py-2 bg-[#4A7836] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ring-offset-[#5C4028] ${hint('advance')}`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      {game.growing ? '時間を進める' : '育て始める'}
                    </button>
                    <button
                      onClick={() => advance(true)}
                      className={`px-3 py-2 bg-white text-[#4A7836] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ring-offset-[#5C4028] ${hint('fastForward')}`}
                    >
                      <FastForward className="w-3.5 h-3.5" />
                      収穫まで早送り
                    </button>
                  </>
                )}
                {stage === 'PODS' && plants.length > 0 && (
                  <button
                    onClick={harvestAll}
                    className={`px-4 py-2 bg-[#D97706] text-white rounded-xl text-xs font-bold cursor-pointer ring-offset-[#5C4028] ${hint('harvest')}`}
                  >
                    すべて収穫する
                  </button>
                )}
              </div>
            </section>

            {/* 倉庫 */}
            <section className="bg-[#FAF7F0] border border-[#DECFA4] rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-bold text-[#2A4428]" style={FONT}>
                倉庫（まく豆を選ぶ・納品箱に入れる）
              </h2>
              <div className="flex flex-wrap gap-2">
                {STARTERS.map((s) => {
                  const sel: Selection = { kind: 'starter', id: s.id };
                  return (
                    <SeedChip
                      key={s.id}
                      seed={s}
                      text={`${s.parentLabel}（何度でも）`}
                      selected={isSelected(sel)}
                      hinted={guideSelKey === JSON.stringify(sel)}
                      onSelect={() => setSelection(sel)}
                    />
                  );
                })}
              </div>
              {game.lots.length === 0 && (
                <p className="text-xs text-stone-500">収穫した豆は、株ごとにここへ入ります。</p>
              )}
              {game.lots.map((lot) => (
                <div key={lot.id} className="bg-white rounded-xl border border-[#E8DEC7] p-2.5">
                  <p className="text-[11px] font-semibold text-[#4E624A] mb-1.5">
                    シーズン{lot.season}・{lot.plotNo}番の株（{lot.pollination === 'self' ? '自家受精' : '人工交配'}）：{lot.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {lotGroups(lot).map((g) => {
                      const sel: Selection = { kind: 'lot', lotId: lot.id, key: g.key };
                      const pick = `${lot.id}|${g.key}`;
                      return (
                        <div key={g.key} className="flex items-center gap-1">
                          <SeedChip
                            seed={lot.seeds.find((s) => samePheno(s.phenotype, g.phenotype))!}
                            text={`${g.label} ${g.count}粒`}
                            selected={isSelected(sel)}
                            hinted={guideSelKey === JSON.stringify(sel)}
                            onSelect={() => setSelection(sel)}
                          />
                          {order && (
                            <button
                              onClick={() => addToBox(lot, g.key, g.count)}
                              aria-label={`${g.label}を納品箱に入れる`}
                              className={`px-2 py-1.5 text-[11px] font-bold rounded-lg bg-[#FDF0CE] text-[#8C6314] cursor-pointer ${
                                guide.picks?.includes(pick) ? HINT : ''
                              }`}
                            >
                              箱へ{box[pick] ? `(${box[pick]})` : ''}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {order && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#DECFA4]">
                  <span className="text-xs font-bold text-[#485945]">
                    納品箱 {boxTotal} / {order.qty} 粒
                  </span>
                  <div className="flex items-center gap-2">
                    {boxTotal > 0 && (
                      <button onClick={() => setBox({})} className={`text-xs text-stone-500 cursor-pointer rounded ${hint('emptyBox')}`}>
                        箱を空にする
                      </button>
                    )}
                    <button
                      onClick={deliver}
                      disabled={boxTotal !== order.qty}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-[#D97706] text-white cursor-pointer disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed ${hint('deliver')}`}
                    >
                      <PackageCheck className="w-4 h-4" />
                      納品する
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {focused && (
        <FlowerModal
          plant={focused}
          allPlants={game.plants}
          soundEnabled={true}
          onClose={() => setFocusId(null)}
          keepRemovedStamens
          onEmasculate={(id) =>
            setGame((g) => ({
              ...g,
              plants: g.plants.map((p) => (p?.id === id ? { ...p, isEmasculated: true } : p)),
            }))
          }
          onPollinate={(target, donorId) =>
            setGame((g) => {
              const donor = g.plants.find((p) => p?.id === donorId);
              return {
                ...g,
                plants: g.plants.map((p) =>
                  p?.id === target ? { ...p, pollinatedByPlantId: donorId, pollinatorSeed: donor?.seed } : p
                ),
              };
            })
          }
        />
      )}

      {/* 納品の結果・終了 */}
      {(delivery || gameOver || cleared) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-[#FAF7F0] border-2 border-[#D8C69F] rounded-2xl max-w-md w-full p-6 max-h-full overflow-y-auto">
            {delivery && deliveredOrder && (
              <>
                <h2 className="text-lg font-bold text-[#2A4428]" style={FONT}>
                  {delivery.passed ? `${deliveredOrder.client}、大喜び！` : `${deliveredOrder.client}から苦情が届きました`}
                </h2>
                {delivery.passed ? (
                  <p className="text-sm mt-2 leading-relaxed">{deliveredOrder.lesson}</p>
                ) : (
                  <div className="text-sm mt-2 leading-relaxed space-y-1">
                    {delivery.wrongLook > 0 && <p>見た目が注文と違う豆が {delivery.wrongLook} 粒ありました。</p>}
                    {delivery.impure > 0 && (
                      <p>
                        {delivery.total} 粒を1粒ずつまいたところ、{delivery.impure} 株から注文と違う豆が実りました。
                      </p>
                    )}
                    <p className="text-[#6B5324] font-bold">信用が1つ下がりました。どうすれば確かめられるだろう？</p>
                  </div>
                )}
                {delivery.passed && !cleared && (
                  <p className="text-xs font-bold text-[#3B6628] mt-3">報酬：畑が {game.plotCount} 区画になりました。</p>
                )}
              </>
            )}
            {cleared && !gameOver && (
              <p className="text-sm font-bold text-[#27481B] mt-3">
                すべての依頼を達成！ シーズン{game.season}、信用 {game.credit} で一人前の育種家です。
              </p>
            )}
            {gameOver && (
              <p className="text-sm font-bold text-red-800 mt-3">信用がなくなり、畑を手放すことになりました。もう一度挑戦しよう。</p>
            )}
            {gameOver || cleared ? (
              <button
                onClick={restart}
                className="w-full mt-4 py-2.5 bg-[#4A7836] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                最初から遊ぶ
              </button>
            ) : (
              <button
                onClick={() => setGame({ ...game, lastDelivery: null })}
                className="w-full mt-4 py-2.5 bg-[#4A7836] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sprout className="w-4 h-4" />
                畑に戻る
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SeedChip({
  seed,
  text,
  selected,
  hinted,
  onSelect,
}: {
  seed: SeedItem;
  text: string;
  selected: boolean;
  hinted?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer ${
        hinted ? HINT : ''
      } ${
        selected
          ? 'bg-[#4A7836] text-white border-[#4A7836]'
          : 'bg-white border-[#E0D5BE] text-stone-700'
      }`}
    >
      <PeaVisual shape={seed.phenotype.shape} color={seed.phenotype.color} size={18} showShadow={false} />
      <span>{text}</span>
    </button>
  );
}

function HarvestSection({
  harvest,
  onCrack,
  onStore,
  hint,
}: {
  harvest: HarvestPlant[];
  onCrack: (plotNo: number, podId?: string) => void;
  onStore: () => void;
  hint: (button: 'store' | 'crackAll') => string;
}) {
  const allCracked = harvest.every((h) => h.pods.every((p) => p.isCracked));

  return (
    <section className="space-y-3">
      <div className="bg-[#FAF7F0] border border-[#DECFA4] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-[#2A4428]" style={FONT}>
          サヤを割って、株ごとの豆を見よう
        </h2>
        {allCracked ? (
          <button onClick={onStore} className={`px-4 py-2 bg-[#4A7836] text-white text-xs font-bold rounded-xl cursor-pointer ${hint('store')}`}>
            倉庫にしまう
          </button>
        ) : (
          <button
            onClick={() => harvest.forEach((h) => onCrack(h.plotNo))}
            className={`px-4 py-2 bg-[#D97706] text-white text-xs font-bold rounded-xl cursor-pointer ${hint('crackAll')}`}
          >
            全部割る
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {harvest.map((h) => {
          const seeds = h.pods.filter((p) => p.isCracked).flatMap((p) => p.seeds);
          const tally = new Map<string, number>();
          seeds.forEach((s) => {
            const label = phenotypeLabel(s.phenotype);
            tally.set(label, (tally.get(label) || 0) + 1);
          });
          return (
            <div key={h.plotNo} className="bg-white rounded-2xl border border-[#DECFA4] p-3">
              <p className={`text-[11px] font-semibold ${h.pollination === 'self' ? 'text-amber-800' : h.pollination === 'cross' ? 'text-emerald-800' : 'text-red-700'}`}>
                {h.plotNo}番の株（{h.pollination === 'self' ? '自家受精' : h.pollination === 'cross' ? '人工交配' : '実らず'}）：{h.label}
              </p>
              {h.pollination === 'failed' && (
                <p className="text-xs text-stone-600 mt-1">除雄したあと受粉しなかったので、実りませんでした。</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {h.pods.map((pod) =>
                  pod.isCracked ? (
                    <div key={pod.id} className="flex items-center gap-0.5 bg-[#E8F0E2] rounded-full px-1.5 py-1">
                      {pod.seeds.map((s) => (
                        <span key={s.id}>
                          <PeaVisual shape={s.phenotype.shape} color={s.phenotype.color} size={16} showShadow={false} />
                        </span>
                      ))}
                    </div>
                  ) : (
                    <button
                      key={pod.id}
                      onClick={() => onCrack(h.plotNo, pod.id)}
                      aria-label="サヤを割る"
                      className="w-16 h-7 rounded-full bg-[#72A944] border-2 border-[#436F28] cursor-pointer hover:bg-[#88C258]"
                    />
                  )
                )}
              </div>
              {seeds.length > 0 && (
                <p className="text-xs font-bold text-[#2C4528] mt-2">
                  {[...tally.entries()].map(([label, n]) => `${label} ${n}粒`).join('　')}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
