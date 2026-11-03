/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameState, PlantData, PlantStage, SeedItem } from '../types';
import { PlantVisual } from './PlantVisual';
import { PeaVisual } from './PeaVisual';
import {
  FastForward,
  Play,
  Scissors,
  Brush,
  PackagePlus,
  Trash2,
  Plus,
  Sparkles,
  Check,
} from 'lucide-react';

interface GardenFieldProps {
  state: GameState;
  seedBag: GameState['seedBag'];
  selectedSeedId: string | null;
  onSelectSeed: (id: string) => void;
  onPlantSeed: (slotIndex: number, seedBagItemId: string) => void;
  onPlantAllAvailable: (seedBagItemId: string) => void;
  onAdvanceTime: () => void;
  onFastForwardToPods: () => void;
  onHarvestAll: () => void;
  onClearPlots: () => void;
  onOpenFlowerModal: (plant: PlantData) => void;
  onGoToHarvest: () => void;
}

export const GardenField: React.FC<GardenFieldProps> = ({
  state,
  seedBag,
  selectedSeedId,
  onSelectSeed,
  onPlantSeed,
  onPlantAllAvailable,
  onAdvanceTime,
  onFastForwardToPods,
  onHarvestAll,
  onClearPlots,
  onOpenFlowerModal,
  onGoToHarvest,
}) => {
  // 選択中の種が無くなった・別レベルのものなら、選べる先頭の種にする
  const selectedSeedBagItemId =
    seedBag.find((i) => i.id === selectedSeedId && i.count > 0)?.id ||
    seedBag.find((i) => i.count > 0)?.id ||
    '';

  const activePlants = state.plots.filter((p): p is PlantData => p !== null);
  const emptyPlotsCount = state.plots.filter((p) => p === null).length;
  const hasHarvestablePods = activePlants.some((p) => p.stage === 'PODS');
  const allInPods = activePlants.length > 0 && activePlants.every((p) => p.stage === 'PODS');
  // 除雄したまま受粉を待っている花（早送りはここで止まる）
  const waitingPollen = activePlants.some(
    (p) => p.stage === 'FLOWER' && p.isEmasculated && !p.pollinatedByPlantId
  );

  const selectedBagItem = seedBag.find((i) => i.id === selectedSeedBagItemId);

  const stageLabels: { [s in PlantStage]: string } = {
    SEEDED: 'まきたて',
    SPROUT: '発芽',
    GROWING: '成長中',
    BUD: 'つぼみ',
    FLOWER: '開花',
    PODS: 'サヤ実り',
  };

  const handlePlotClick = (slotIndex: number) => {
    const existing = state.plots[slotIndex];
    if (existing) {
      // つぼみや花、または株情報を開く
      onOpenFlowerModal(existing);
    } else {
      // 空の区画に選択中の種をまく
      if (selectedSeedBagItemId && selectedBagItem && selectedBagItem.count > 0) {
        onPlantSeed(slotIndex, selectedSeedBagItemId);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 select-none text-[#2C3E2D]">
      {/* 1. 操作ツールバー */}
      <div className="bg-[#FAF7F0] border border-[#DECFA4] rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* 種まきセレクター */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-[#4B6145] shrink-0">
            まく種を選択：
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {seedBag.map((item) => {
              const isSelected = selectedSeedBagItemId === item.id;
              const hasCount = item.count > 0;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectSeed(item.id)}
                  disabled={!hasCount}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#4A7836] text-white border-[#4A7836] shadow-xs ring-2 ring-[#4A7836]/20'
                      : hasCount
                      ? 'bg-white border-[#E0D5BE] hover:border-[#8DA67E] text-stone-700'
                      : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                  }`}
                >
                  <PeaVisual
                    shape={item.sampleSeed.phenotype.shape}
                    color={item.sampleSeed.phenotype.color}
                    size={18}
                    showShadow={false}
                  />
                  <span>{item.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-white/30 text-white' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {item.isStartingSeed ? '∞' : item.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 一括種まきボタン */}
          {selectedBagItem && selectedBagItem.count > 0 && emptyPlotsCount > 0 && (
            <button
              onClick={() => onPlantAllAvailable(selectedSeedBagItemId)}
              className="px-3 py-1.5 bg-[#E8F0E2] hover:bg-[#D5E5CB] text-[#345924] border border-[#A7CE93] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>空き区画すべてにまく</span>
            </button>
          )}
        </div>

        {/* 時間進行・収穫アクション */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* 時間を進める */}
          <button
            onClick={onAdvanceTime}
            disabled={activePlants.length === 0 || allInPods}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
              activePlants.length > 0 && !allInPods
                ? 'bg-[#4A7836] hover:bg-[#3B6229] text-white cursor-pointer active:scale-98'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
            title="1段階時間を進めてエンドウを成長させます"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>時間を進める</span>
          </button>

          {/* サヤ実りまで早送り */}
          <button
            onClick={onFastForwardToPods}
            disabled={activePlants.length === 0 || allInPods}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1 ${
              activePlants.length > 0 && !allInPods
                ? 'bg-white hover:bg-stone-50 border-[#DECFA4] text-[#4A7836] cursor-pointer'
                : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
            }`}
            title="収穫できるサヤ実り段階まで一気に進めます"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>収穫まで早送り</span>
          </button>

          {/* 収穫する */}
          {hasHarvestablePods && (
            <button
              onClick={onHarvestAll}
              className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 animate-bounce active:scale-98"
            >
              <PackagePlus className="w-4 h-4" />
              <span>すべて収穫する</span>
            </button>
          )}

          {/* 畑を片付ける */}
          {activePlants.length > 0 && (
            <button
              onClick={onClearPlots}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-[#EAE2D2] rounded-xl transition-colors"
              title="区画の株を片付ける"
              aria-label="区画片付け"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {waitingPollen && (
        <p className="p-3 bg-[#FFF7E8] rounded-xl border border-[#F2D59B] text-xs text-[#6B5324]">
          除雄した花が受粉を待っています。花をタップして、筆で花粉をつけよう（早送りはここで止まります）。
        </p>
      )}

      {/* 2. 12区画の畑グリッド */}
      <div className="bg-[#5C4028] p-4 sm:p-6 rounded-3xl border-4 border-[#3D2918] shadow-inner relative overflow-hidden">
        {/* 土のテクスチャ背景 */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(#875F3B 15%, transparent 16%), radial-gradient(#2E1F13 15%, transparent 16%)',
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0, 8px 8px',
          }}
        />

        {/* 畑ヘッダーラベル */}
        <div className="relative z-10 flex items-center justify-between text-[#E8D7C0] text-xs font-medium mb-4 px-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm" style={{ fontFamily: 'Zen Maru Gothic, sans-serif' }}>
              実験区画（最大12株）
            </span>
            <span className="text-stone-300">
              栽培中: {activePlants.length} / 12 株
            </span>
          </div>
          <span className="text-[11px] text-[#D4C3A3]">
            ※株をタップすると「除雄」「筆受粉」のアップが開きます
          </span>
        </div>

        {/* 12区画グリッド */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {state.plots.map((plant, index) => {
            const hasPlant = plant !== null;

            return (
              <div
                key={index}
                onClick={() => handlePlotClick(index)}
                className={`relative rounded-2xl transition-all duration-200 select-none flex flex-col justify-between overflow-hidden cursor-pointer h-44 sm:h-48 p-2.5 ${
                  hasPlant
                    ? 'bg-[#F9F7EE] border-2 border-[#D8C69F] hover:border-[#6C9655] shadow-md transform hover:-translate-y-1'
                    : 'bg-[#6E4F32]/80 border-2 border-dashed border-[#8A633F] hover:bg-[#7D5B3A] hover:border-[#A67A4F]'
                }`}
              >
                {/* 区画番号バッジ */}
                <div className="flex items-center justify-between w-full z-10">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      hasPlant
                        ? 'bg-[#E5DAC2] text-[#43593E]'
                        : 'bg-[#503721] text-[#C9B399]'
                    }`}
                  >
                    #{index + 1}
                  </span>

                  {/* ステータスラベル */}
                  {hasPlant && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        plant.stage === 'BUD'
                          ? 'bg-[#FDF0CE] text-[#8C6314] ring-1 ring-[#D9A32B] animate-pulse'
                          : plant.stage === 'FLOWER'
                          ? 'bg-[#F3E8FF] text-[#6B21A8] ring-1 ring-[#A855F7]'
                          : plant.stage === 'PODS'
                          ? 'bg-[#E5F5DC] text-[#2F611E] ring-1 ring-[#5E9B48]'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {stageLabels[plant.stage]}
                    </span>
                  )}
                </div>

                {/* 中央：植物のイラスト or 空き土 */}
                <div className="flex-1 flex items-center justify-center my-1 relative">
                  {hasPlant ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <PlantVisual
                        stage={plant.stage}
                        isEmasculated={plant.isEmasculated}
                        pollinated={!!plant.pollinatedByPlantId}
                        className="w-24 h-24 sm:w-28 sm:h-28"
                      />

                      {/* つぼみ時：除雄可能アフォーダンスアイコン */}
                      {plant.stage === 'BUD' && (
                        <div className="absolute top-1 right-1 bg-amber-500 text-white p-1 rounded-full shadow-md animate-bounce">
                          <Scissors className="w-3 h-3" />
                        </div>
                      )}

                      {/* 開花時：筆受粉アフォーダンスアイコン */}
                      {plant.stage === 'FLOWER' && plant.isEmasculated && !plant.pollinatedByPlantId && (
                        <div className="absolute top-1 right-1 bg-purple-600 text-white p-1 rounded-full shadow-md animate-bounce">
                          <Brush className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  ) : (
                    /* 空き区画 */
                    <div className="flex flex-col items-center justify-center text-[#B09272] group">
                      <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#8A633F] flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <Plus className="w-5 h-5 text-[#C7A887]" />
                      </div>
                      <span className="text-[11px] font-bold text-[#D4B695]">
                        種をまく
                      </span>
                    </div>
                  )}
                </div>

                {/* 下部：株の情報（親・受粉状況） */}
                {hasPlant && (
                  <div className="bg-white/80 rounded-lg p-1.5 text-[10px] text-stone-600 z-10 border border-[#E8DEC7]">
                    <div className="truncate font-semibold text-[#2D452B]">
                      {plant.seed.parentLabel || plant.seed.generation}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-stone-500 truncate">
                        {plant.isEmasculated ? '✓除雄済' : '自然(自家受精)'}
                      </span>
                      {plant.pollinatedByPlantId && (
                        <span className="text-[#3B6B2A] font-bold truncate">
                          交配受粉済
                        </span>
                      )}
                      {plant.stage === 'PODS' && (
                        <span className="text-[#356323] font-bold">
                          サヤ {plant.pods.length}個
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
