/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PodData, LevelStats, ColorPhenotype, ShapePhenotype } from '../types';
import { PeaVisual } from './PeaVisual';
import { isTargetSeed } from '../utils/genetics';
import { playPodPop, playHarvestFanfare } from '../utils/sound';
import { Sparkles, CheckCircle2, PackagePlus, ArrowRight } from 'lucide-react';

interface HarvestViewProps {
  pods: PodData[];
  harvestNote: string | null;
  level: number;
  soundEnabled: boolean;
  onCrackPod: (podId: string) => void;
  onCrackAll: () => void;
  onStoreSeeds: () => void;
  onGoToGarden: () => void;
  onGoToStats: () => void;
}

export const HarvestView: React.FC<HarvestViewProps> = ({
  pods,
  harvestNote,
  level,
  soundEnabled,
  onCrackPod,
  onCrackAll,
  onStoreSeeds,
  onGoToGarden,
  onGoToStats,
}) => {
  const [isCrackingAll, setIsCrackingAll] = useState(false);

  // 集計
  const totalPods = pods.length;
  const crackedPods = pods.filter((p) => p.isCracked);
  const uncrackedPods = pods.filter((p) => !p.isCracked);
  const allCracked = totalPods > 0 && uncrackedPods.length === 0;

  // 割られた豆の集計
  let crackedRound = 0;
  let crackedWrinkled = 0;
  let crackedYellow = 0;
  let crackedGreen = 0;
  let crackedRY = 0;
  let crackedRG = 0;
  let crackedWY = 0;
  let crackedWG = 0;
  let totalCrackedSeeds = 0;

  crackedPods.forEach((pod) => {
    pod.seeds.forEach((seed) => {
      totalCrackedSeeds++;
      if (seed.phenotype.shape === 'round') crackedRound++;
      else crackedWrinkled++;

      if (seed.phenotype.color === 'yellow') crackedYellow++;
      else if (seed.phenotype.color === 'green') crackedGreen++;

      if (seed.phenotype.shape === 'round' && seed.phenotype.color === 'yellow') crackedRY++;
      if (seed.phenotype.shape === 'round' && seed.phenotype.color === 'green') crackedRG++;
      if (seed.phenotype.shape === 'wrinkled' && seed.phenotype.color === 'yellow') crackedWY++;
      if (seed.phenotype.shape === 'wrinkled' && seed.phenotype.color === 'green') crackedWG++;
    });
  });

  const handleCrackSingle = (podId: string) => {
    playPodPop(soundEnabled);
    onCrackPod(podId);
  };

  const handleCrackAllStaggered = () => {
    if (isCrackingAll || uncrackedPods.length === 0) return;
    setIsCrackingAll(true);

    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= uncrackedPods.length) {
        clearInterval(interval);
        setIsCrackingAll(false);
        playHarvestFanfare(soundEnabled);
        return;
      }
      playPodPop(soundEnabled);
      onCrackPod(uncrackedPods[idx].id);
      idx++;
    }, 120);
  };

  const hasTargetPod = pods.some((p) => p.seeds.some((s) => isTargetSeed(level, s)));

  // 空の状態
  if (pods.length === 0) {
    return (
      <div className="bg-[#FAF7F0] border-2 border-[#D8C69F] rounded-2xl p-8 max-w-3xl mx-auto my-6 text-center shadow-xs">
        <div className="w-16 h-16 mx-auto mb-4 bg-[#EBE4D3] rounded-2xl flex items-center justify-center text-[#556953]">
          <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none">
            <path
              d="M 8 10 C 14 18, 22 28, 20 34 C 18 38, 14 38, 10 34 C 6 24, 4 16, 8 10 Z"
              fill="#8FA87B"
              stroke="#5F784D"
              strokeWidth="2"
            />
          </svg>
        </div>
        <h3
          className="text-lg font-bold text-[#2A4428] mb-2"
          style={{ fontFamily: 'Zen Maru Gothic, sans-serif' }}
        >
          収穫台にはまだサヤがありません
        </h3>
        {harvestNote && (
          <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2.5 max-w-md mx-auto mb-3">
            {harvestNote}
          </p>
        )}
        <p className="text-sm text-stone-600 max-w-md mx-auto mb-6">
          畑の区画に種をまき、「時間を進める」でサヤが実るまで育ててから「収穫する」を押してください。
        </p>
        <button
          onClick={onGoToGarden}
          className="px-6 py-2.5 bg-[#4A7836] hover:bg-[#3B6229] text-white font-bold text-sm rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
        >
          <span>畑へ向かう</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 収穫台ヘッダー */}
      <div className="bg-[#FAF7F0] border border-[#DECFA4] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#E4DAC2] text-[#4A5D45]">
              収穫台
            </span>
            <span className="text-xs text-stone-600 font-medium">
              サヤの数: {totalPods}個（開封済: {crackedPods.length}個）
            </span>
          </div>
          <h2
            className="text-xl font-bold text-[#2A4428] mt-1"
            style={{ fontFamily: 'Zen Maru Gothic, sans-serif' }}
          >
            サヤを割って中の豆を確かめよう
          </h2>
          {harvestNote && (
            <p className="text-xs text-[#526450] mt-1 font-medium bg-[#ECE7D7] px-2.5 py-1 rounded-md inline-block">
              {harvestNote}
            </p>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex items-center gap-2 shrink-0">
          {!allCracked ? (
            <button
              onClick={handleCrackAllStaggered}
              disabled={isCrackingAll}
              className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-98 disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isCrackingAll ? '割っています...' : '全部割る（一括開封）'}</span>
            </button>
          ) : (
            <button
              onClick={onStoreSeeds}
              className="px-5 py-2.5 bg-[#4A7836] hover:bg-[#3B6229] text-white text-sm font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2 active:scale-98"
            >
              <PackagePlus className="w-4 h-4" />
              <span>種袋に保管 &amp; 集計に追加</span>
            </button>
          )}
        </div>
      </div>

      {!hasTargetPod && (
        <div className="p-3.5 bg-[#FFF7E8] rounded-xl border border-[#F2D59B] text-xs text-[#6B5324] leading-relaxed">
          <strong>この収穫は、今のレベルの集計には入りません。</strong>
          サヤの上の記録を見て、どんな受粉で実ったか確かめよう。別の株と交配するには、つぼみのうちに除雄してから、開花したら筆で受粉させます。
        </div>
      )}

      {/* サヤ一覧グリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pods.map((pod, pIdx) => {
          return (
            <div
              key={pod.id}
              onClick={() => !pod.isCracked && handleCrackSingle(pod.id)}
              className={`p-4 rounded-2xl border transition-all select-none ${
                pod.isCracked
                  ? 'bg-white/80 border-[#DECFA4] shadow-xs'
                  : 'bg-[#F2EDDC] border-[#D1BE93] hover:border-[#6C9655] hover:bg-[#EDE6D0] cursor-pointer shadow-xs transform hover:-translate-y-0.5 active:scale-99'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-500">
                  サヤ #{pIdx + 1}
                </span>
                <span className="text-xs font-medium">
                  {pod.isCracked ? (
                    <span className="text-[#3E702D] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {pod.seeds.length}粒 実生
                    </span>
                  ) : (
                    <span className="text-amber-800 font-bold animate-pulse">
                      タップして割る
                    </span>
                  )}
                </span>
              </div>

              <p className={`text-[11px] font-semibold mb-2 ${pod.pollination === 'self' ? 'text-amber-800' : 'text-emerald-800'}`}>
                {pod.pollination === 'self' ? '自家受精' : '人工交配'}：{pod.sourceNote}
              </p>

              {/* サヤのビジュアル演出 */}
              {!pod.isCracked ? (
                /* 割る前：ぷっくりした閉じたサヤ */
                <div className="h-24 flex items-center justify-center bg-[#E5DCBF]/40 rounded-xl relative overflow-hidden group">
                  <svg viewBox="0 0 200 60" className="w-52 h-16">
                    {/* サヤの柄 */}
                    <path d="M 12 30 Q 20 28 28 30" stroke="#4D7F31" strokeWidth="3" fill="none" />
                    {/* サヤ本体 */}
                    <path
                      d="M 28 30 
                         C 50 16, 120 16, 175 28 
                         C 188 31, 188 34, 175 37 
                         C 120 48, 50 48, 28 30 Z"
                      fill="#72A944"
                      stroke="#436F28"
                      strokeWidth="2"
                    />
                    {/* 豆の膨らみ */}
                    <circle cx="55" cy="30" r="7" fill="#88C258" />
                    <circle cx="85" cy="30" r="7" fill="#88C258" />
                    <circle cx="115" cy="30" r="7" fill="#88C258" />
                    <circle cx="145" cy="30" r="7" fill="#88C258" />
                    {/* 合わせ目のスジ */}
                    <path
                      d="M 28 30 L 175 32"
                      stroke="#4A752B"
                      strokeWidth="1.2"
                      strokeDasharray="4 2"
                      fill="none"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/5 transition-colors">
                    <span className="text-xs font-bold text-[#2A4428] bg-white/80 px-2.5 py-1 rounded-full shadow-xs">
                      タップしてパカッと割る
                    </span>
                  </div>
                </div>
              ) : (
                /* 割った後：左右に開いたサヤの中に豆が並ぶ */
                <div className="min-h-24 flex items-center justify-around bg-[#F9F7EE] rounded-xl px-2 py-1 border border-[#E8DEC7] relative">
                  {/* 背景の開いたサヤ殻 */}
                  <svg
                    viewBox="0 0 200 40"
                    className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M 10 10 Q 100 2 190 10 Q 100 24 10 10"
                      fill="#86B85E"
                      stroke="#4D7F31"
                    />
                    <path
                      d="M 10 30 Q 100 38 190 30 Q 100 16 10 30"
                      fill="#86B85E"
                      stroke="#4D7F31"
                    />
                  </svg>

                  {/* 中に並ぶ豆 */}
                  <div className="flex flex-wrap items-center justify-around gap-y-1 w-full relative z-10">
                    {pod.seeds.map((seed, sIdx) => {
                      return (
                        <div key={seed.id || sIdx} className="flex flex-col items-center">
                          <PeaVisual
                            shape={seed.phenotype.shape}
                            color={seed.phenotype.color}
                            size={28}
                          />
                          <span className="text-[10px] text-stone-500 font-bold mt-1">
                            {seed.phenotype.shape === 'round' ? '丸' : 'しわ'}
                            {level === 4 && seed.phenotype.color
                              ? `(${seed.phenotype.color === 'yellow' ? '黄' : '緑'})`
                              : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 割った豆の即時集計サマリー */}
      {totalCrackedSeeds > 0 && (
        <div className="bg-[#FAF7F0] border-2 border-[#D8C69F] rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#DECFA4]">
            <h3
              className="text-base font-bold text-[#2A4428]"
              style={{ fontFamily: 'Zen Maru Gothic, sans-serif' }}
            >
              今回の収穫集計（割った豆の総数：{totalCrackedSeeds}粒）
            </h3>
            <span className="text-xs text-stone-600">
              ※豆の形は、母株ではなく豆の中の胚（子）の遺伝子型で決まります
            </span>
          </div>

          {/* Lv1〜3: 丸としわの集計 */}
          {level !== 4 ? (
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white p-4 rounded-xl border border-[#DECFA4] flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                  <PeaVisual shape="round" color="green" size={38} />
                  <div className="text-left">
                    <span className="text-xs text-stone-500 font-bold block">丸い豆</span>
                    <span className="text-xl font-bold text-[#2C4528] tabular-nums">
                      {crackedRound}
                    </span>
                    <span className="text-xs text-stone-500 ml-1">粒</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-[#3B6628] tabular-nums">
                    {((crackedRound / totalCrackedSeeds) * 100).toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-stone-500 block">割合</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#DECFA4] flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                  <PeaVisual shape="wrinkled" color="green" size={38} />
                  <div className="text-left">
                    <span className="text-xs text-stone-500 font-bold block">しわの豆</span>
                    <span className="text-xl font-bold text-[#2C4528] tabular-nums">
                      {crackedWrinkled}
                    </span>
                    <span className="text-xs text-stone-500 ml-1">粒</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-[#7E5E35] tabular-nums">
                    {((crackedWrinkled / totalCrackedSeeds) * 100).toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-stone-500 block">割合</span>
                </div>
              </div>
            </div>
          ) : (
            /* Lv4: 2遺伝子座 (丸黄, 丸緑, しわ黄, しわ緑) 4つの集計 */
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="bg-white p-3 rounded-xl border border-[#DECFA4]">
                <PeaVisual shape="round" color="yellow" size={32} className="mx-auto mb-1" />
                <span className="text-xs font-bold text-stone-600 block">丸・黄</span>
                <span className="text-lg font-bold text-[#2C4528] tabular-nums">{crackedRY}</span>
                <span className="text-[10px] text-stone-500 block">
                  {((crackedRY / totalCrackedSeeds) * 100).toFixed(1)}% (期待56.3%)
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#DECFA4]">
                <PeaVisual shape="round" color="green" size={32} className="mx-auto mb-1" />
                <span className="text-xs font-bold text-stone-600 block">丸・緑</span>
                <span className="text-lg font-bold text-[#2C4528] tabular-nums">{crackedRG}</span>
                <span className="text-[10px] text-stone-500 block">
                  {((crackedRG / totalCrackedSeeds) * 100).toFixed(1)}% (期待18.8%)
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#DECFA4]">
                <PeaVisual shape="wrinkled" color="yellow" size={32} className="mx-auto mb-1" />
                <span className="text-xs font-bold text-stone-600 block">しわ・黄</span>
                <span className="text-lg font-bold text-[#2C4528] tabular-nums">{crackedWY}</span>
                <span className="text-[10px] text-stone-500 block">
                  {((crackedWY / totalCrackedSeeds) * 100).toFixed(1)}% (期待18.8%)
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#DECFA4]">
                <PeaVisual shape="wrinkled" color="green" size={32} className="mx-auto mb-1" />
                <span className="text-xs font-bold text-stone-600 block">しわ・緑</span>
                <span className="text-lg font-bold text-[#2C4528] tabular-nums">{crackedWG}</span>
                <span className="text-[10px] text-stone-500 block">
                  {((crackedWG / totalCrackedSeeds) * 100).toFixed(1)}% (期待6.3%)
                </span>
              </div>
            </div>
          )}

          {allCracked && (
            <div className="mt-5 pt-4 border-t border-[#DECFA4] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-[#3D6628] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#477C2F]" />
                すべてのサヤを割り終えました！
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={onGoToStats}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  累計グラフを見る
                </button>
                <button
                  onClick={onStoreSeeds}
                  className="px-5 py-2.5 bg-[#4A7836] hover:bg-[#3B6229] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <PackagePlus className="w-4 h-4" />
                  <span>種袋に保存する</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
