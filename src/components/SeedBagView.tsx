/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameState } from '../types';
import { PeaVisual } from './PeaVisual';
import { Package, Sprout } from 'lucide-react';

interface SeedBagViewProps {
  seedBag: GameState['seedBag'];
  level: number;
  onSelectSeedToPlant?: (seedId: string) => void;
  onGoToGarden: () => void;
}

export const SeedBagView: React.FC<SeedBagViewProps> = ({
  seedBag,
  level,
  onSelectSeedToPlant,
  onGoToGarden,
}) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 text-[#2C3E2D]">
      <div className="bg-[#FAF7F0] border border-[#DECFA4] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#E4DAC2] text-[#4A5D45]">
              保管庫
            </span>
            <span className="text-xs text-stone-600 font-medium">
              収穫した種子・実験用種子のストック
            </span>
          </div>
          <h2
            className="text-xl font-bold text-[#2A4428] mt-1"
            style={{ fontFamily: 'Zen Maru Gothic, sans-serif' }}
          >
            種袋（ストック一覧）
          </h2>
          <p className="text-xs text-stone-600 mt-1">
            ※メンデルの実験同様、外見からは遺伝子型は見えません（見た目の形・色のみ判別可能）。Lv3で検定交雑に成功した豆には確定ラベルが付きます。
          </p>
        </div>

        <button
          onClick={onGoToGarden}
          className="px-5 py-2.5 bg-[#4A7836] hover:bg-[#3B6229] text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <Sprout className="w-4 h-4" />
          <span>畑で種をまく</span>
        </button>
      </div>

      {seedBag.length === 0 ? (
        <div className="p-8 text-center text-sm text-stone-500 bg-white/60 rounded-2xl border border-dashed border-stone-300">
          種袋は空です。畑で栽培して収穫してください。
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {seedBag.map((item) => {
            const hasStock = item.count > 0;
            const seed = item.sampleSeed;
            const isIdentified = !!seed.identifiedGenotype;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-4 shadow-xs transition-all flex flex-col justify-between ${
                  hasStock
                    ? 'border-[#DECFA4] hover:border-[#739E5F]'
                    : 'border-stone-200 opacity-60'
                }`}
              >
                <div>
                  {/* ヘッダー情報 */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#F0EDE1] text-[#4E624A]">
                      世代: {seed.generation}
                    </span>
                    <span className="text-xs font-bold text-[#2A4428] tabular-nums">
                      残り {item.count} 粒
                    </span>
                  </div>

                  {/* 豆のビジュアルと名称 */}
                  <div className="flex items-center gap-3 my-3">
                    <PeaVisual
                      shape={seed.phenotype.shape}
                      color={seed.phenotype.color}
                      size={44}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-[#2A4428] leading-tight">
                        {item.label}
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        親：{seed.parentLabel || '世代初期'}
                      </p>
                      {/* 見た目の表現型 */}
                      <p className="text-[11px] text-[#4A7836] font-semibold mt-0.5">
                        外見：{seed.phenotype.shape === 'round' ? '丸' : 'しわ'}
                        {seed.phenotype.color ? `・${seed.phenotype.color === 'yellow' ? '黄' : '緑'}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Lv3 検定交雑確定バッジ */}
                  {isIdentified && (
                    <div className="mb-3 p-1.5 bg-[#E6F5DC] rounded-lg border border-[#B3DE9C] text-[11px] font-bold text-[#27541B] flex items-center justify-center gap-1">
                      <span>✓ 遺伝子型確定:</span>
                      <span className="font-mono text-xs">{seed.identifiedGenotype}</span>
                    </div>
                  )}
                </div>

                {/* まくボタン */}
                {onSelectSeedToPlant && (
                  <button
                    onClick={() => hasStock && onSelectSeedToPlant(item.id)}
                    disabled={!hasStock}
                    className={`w-full py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 mt-2 ${
                      hasStock
                        ? 'bg-[#EBF3E6] hover:bg-[#4A7836] text-[#335624] hover:text-white border border-[#B9DC9F] cursor-pointer'
                        : 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                    }`}
                  >
                    <Sprout className="w-3.5 h-3.5" />
                    <span>この種を畑にまく</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
