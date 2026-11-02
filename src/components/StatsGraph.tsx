/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LevelStats } from '../types';
import { PeaVisual } from './PeaVisual';
import { TrendingUp, BookOpen, Check } from 'lucide-react';

interface StatsGraphProps {
  stats: LevelStats;
  level: number;
}

export const StatsGraph: React.FC<StatsGraphProps> = ({ stats, level }) => {
  const { totalSeeds, round, wrinkled, roundYellow, roundGreen, wrinkledYellow, wrinkledGreen, history } = stats;

  const roundRatio = totalSeeds > 0 ? round / totalSeeds : 0;
  const wrinkledRatio = totalSeeds > 0 ? wrinkled / totalSeeds : 0;

  // SVG グラフ寸法計算
  const svgWidth = 640;
  const svgHeight = 260;
  const padLeft = 55;
  const padRight = 35;
  const padTop = 30;
  const padBottom = 40;

  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const maxCount = Math.max(60, history.length > 0 ? history[history.length - 1].cumulativeCount : 60);

  const getX = (count: number) => {
    return padLeft + (count / maxCount) * plotWidth;
  };

  const getY = (ratio: number) => {
    // 縦軸: 0.0 (底) 〜 1.0 (上)
    return padTop + (1 - Math.max(0, Math.min(1, ratio))) * plotHeight;
  };

  // 折れ線パス
  let pathD = '';
  if (history.length > 0) {
    pathD = history.map((pt, idx) => {
      const x = getX(pt.cumulativeCount);
      const y = getY(pt.roundRatio);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  }

  const theoreticalY = getY(0.75);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 text-[#2C3E2D]">
      {/* 累計統計サマリーカード */}
      <div className="bg-[#FAF7F0] border border-[#DECFA4] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#DECFA4]/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#E4DAC2] text-[#4A5D45]">
                {`Lv${level}`} 累計集計
              </span>
              <span className="text-xs text-stone-600 font-medium">
                これまでに数えたエンドウ豆の総合計
              </span>
            </div>
            <h2
              className="text-xl font-bold text-[#2A4428] mt-1"
              style={{ fontFamily: 'Zen Maru Gothic, sans-serif' }}
            >
              累計実測データ &amp; 分離比
            </h2>
          </div>

          <div className="flex items-center gap-3 bg-white/80 px-4 py-2.5 rounded-xl border border-[#DECFA4]">
            <span className="text-xs text-stone-500 font-bold">数えた総粒数:</span>
            <span className="text-2xl font-bold text-[#2A4428] tabular-nums">{totalSeeds}</span>
            <span className="text-xs text-stone-500">粒</span>
          </div>
        </div>

        {/* 比率表示 */}
        {totalSeeds === 0 ? (
          <div className="p-8 text-center text-sm text-stone-500 bg-white/50 rounded-xl border border-dashed border-stone-300">
            まだ収穫した豆がありません。畑でエンドウを育ててサヤを割り、集計を追加してみましょう。
          </div>
        ) : level !== 4 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#DECFA4] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PeaVisual shape="round" color="green" size={42} />
                <div>
                  <span className="text-xs text-stone-500 font-bold block">丸い豆（顕性）</span>
                  <span className="text-2xl font-bold text-[#2C4528] tabular-nums">{round}</span>
                  <span className="text-xs text-stone-500 ml-1">粒</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-[#3B6628] tabular-nums">
                  {(roundRatio * 100).toFixed(2)}%
                </span>
                <span className="text-xs text-stone-400 block">
                  (比率 ≒ {wrinkled > 0 ? (round / wrinkled).toFixed(2) : '-'} : 1)
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#DECFA4] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PeaVisual shape="wrinkled" color="green" size={42} />
                <div>
                  <span className="text-xs text-stone-500 font-bold block">しわの豆（潜性）</span>
                  <span className="text-2xl font-bold text-[#2C4528] tabular-nums">{wrinkled}</span>
                  <span className="text-xs text-stone-500 ml-1">粒</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-[#7E5E35] tabular-nums">
                  {(wrinkledRatio * 100).toFixed(2)}%
                </span>
                <span className="text-xs text-stone-400 block">
                  (理論期待値: 25.00%)
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Lv4 4表現型集計 */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-xl border border-[#DECFA4] text-center">
              <PeaVisual shape="round" color="yellow" size={34} className="mx-auto mb-1" />
              <span className="text-xs font-bold text-stone-600 block">丸・黄</span>
              <span className="text-xl font-bold text-[#2C4528] tabular-nums">{roundYellow}</span>
              <span className="text-xs text-[#3B6628] font-bold block mt-0.5">
                {((roundYellow / totalSeeds) * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-stone-400 block">期待 9/16 (56.3%)</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-[#DECFA4] text-center">
              <PeaVisual shape="round" color="green" size={34} className="mx-auto mb-1" />
              <span className="text-xs font-bold text-stone-600 block">丸・緑</span>
              <span className="text-xl font-bold text-[#2C4528] tabular-nums">{roundGreen}</span>
              <span className="text-xs text-[#3B6628] font-bold block mt-0.5">
                {((roundGreen / totalSeeds) * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-stone-400 block">期待 3/16 (18.8%)</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-[#DECFA4] text-center">
              <PeaVisual shape="wrinkled" color="yellow" size={34} className="mx-auto mb-1" />
              <span className="text-xs font-bold text-stone-600 block">しわ・黄</span>
              <span className="text-xl font-bold text-[#2C4528] tabular-nums">{wrinkledYellow}</span>
              <span className="text-xs text-[#3B6628] font-bold block mt-0.5">
                {((wrinkledYellow / totalSeeds) * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-stone-400 block">期待 3/16 (18.8%)</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-[#DECFA4] text-center">
              <PeaVisual shape="wrinkled" color="green" size={34} className="mx-auto mb-1" />
              <span className="text-xs font-bold text-stone-600 block">しわ・緑</span>
              <span className="text-xl font-bold text-[#2C4528] tabular-nums">{wrinkledGreen}</span>
              <span className="text-xs text-[#3B6628] font-bold block mt-0.5">
                {((wrinkledGreen / totalSeeds) * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-stone-400 block">期待 1/16 (6.3%)</span>
            </div>
          </div>
        )}
      </div>

      {/* 累計折れ線グラフ（大数の法則の可視化） */}
      <div className="bg-[#FAF7F0] border border-[#DECFA4] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#4A7836]" />
            <h3
              className="text-lg font-bold text-[#2A4428]"
              style={{ fontFamily: 'Zen Maru Gothic, sans-serif' }}
            >
              累計の丸の比率推移（大数の法則）
            </h3>
          </div>
          <span className="text-xs text-stone-500">
            目安線: 0.75（3：1 の理論値）
          </span>
        </div>
        <p className="text-xs text-stone-600 mb-4">
          最初は少ない粒数で比率が大きく上下に揺れ動きますが、株を増やしてたくさんの豆を数えるほど、理論上の比率
          <strong className="text-[#3B6628] font-bold"> 0.75（75%）</strong> に近づいていきます。
        </p>

        {/* 自前SVGグラフ */}
        <div className="bg-white rounded-xl border border-[#DECFA4] p-3 overflow-x-auto">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full min-w-[540px] h-64 select-none">
            {/* 目盛線 (Y軸: 0.0, 0.25, 0.5, 0.75, 1.0) */}
            {[0.0, 0.25, 0.5, 0.75, 1.0].map((val) => {
              const y = getY(val);
              const isTheoretical = val === 0.75;
              return (
                <g key={val}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgWidth - padRight}
                    y2={y}
                    stroke={isTheoretical ? '#D97706' : '#EAE4D3'}
                    strokeWidth={isTheoretical ? 1.5 : 1}
                    strokeDasharray={isTheoretical ? '5 3' : 'none'}
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill={isTheoretical ? '#B45309' : '#888'}
                    fontWeight={isTheoretical ? 'bold' : 'normal'}
                  >
                    {val.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* 理論値 0.75 のラベル */}
            <text
              x={svgWidth - padRight - 5}
              y={theoreticalY - 6}
              textAnchor="end"
              fontSize="11"
              fill="#B45309"
              fontWeight="bold"
            >
              理論値 0.75 (3:1)
            </text>

            {/* X軸目盛 */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const count = Math.round(maxCount * pct);
              const x = getX(count);
              return (
                <g key={pct}>
                  <line x1={x} y1={svgHeight - padBottom} x2={x} y2={svgHeight - padBottom + 5} stroke="#B0A690" />
                  <text
                    x={x}
                    y={svgHeight - padBottom + 18}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#777"
                  >
                    {count}
                  </text>
                </g>
              );
            })}

            {/* 軸タイトル */}
            <text
              x={padLeft + plotWidth / 2}
              y={svgHeight - 6}
              textAnchor="middle"
              fontSize="11"
              fill="#555"
              fontWeight="bold"
            >
              数えた豆の合計数（粒）→
            </text>

            {/* 折れ線 */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="#4A7836"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* データ点 */}
            {history.map((pt, idx) => {
              const x = getX(pt.cumulativeCount);
              const y = getY(pt.roundRatio);
              const isLast = idx === history.length - 1;
              return (
                <g key={idx}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isLast ? 5 : 3.5}
                    fill={isLast ? '#E5B824' : '#4A7836'}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                  {isLast && (
                    <text
                      x={x}
                      y={y - 10}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#2C4528"
                      fontWeight="bold"
                    >
                      {(pt.roundRatio * 100).toFixed(1)}%
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* メンデルの実測値との比較カード */}
      <div className="bg-[#FFFDF7] border-2 border-[#D8C69F] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#8A6335]" />
            <h3
              className="text-base font-bold text-[#422C1A]"
              style={{ fontFamily: 'Zen Maru Gothic, sans-serif' }}
            >
              歴史の証言：メンデル本人の実測値（1865年）
            </h3>
          </div>
          <p className="text-xs text-[#5C4533] leading-relaxed">
            グレゴール・メンデル神父は、修道院の小さな庭で数万株のエンドウを地道に数え上げました。
            単性雑種F2の種子の形（丸としわ）に関するメンデルの実際の結果は以下の通りです：
          </p>
          <div className="bg-[#F4ECE1] p-3 rounded-xl border border-[#DECFA4] text-xs text-[#483321] space-y-1">
            <div className="flex items-center justify-between font-bold">
              <span>丸い種子：5,474 粒</span>
              <span>しわの種子：1,850 粒</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#DECFA4]/60 text-stone-600">
              <span>合計：7,324 粒</span>
              <span className="text-[#3F6B2A] font-bold">
                丸の比率：74.74% ≒ 2.96 ： 1
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#FAF7EE] p-4 rounded-xl border border-[#DECFA4] text-center shrink-0 w-full md:w-56">
          <span className="text-xs text-stone-500 font-bold block mb-1">
            あなたの現在の実測比率
          </span>
          <div className="text-2xl font-bold text-[#2A4428] tabular-nums">
            {wrinkled > 0 ? `${(round / wrinkled).toFixed(2)} : 1` : totalSeeds > 0 ? 'すべて丸' : '未測定'}
          </div>
          <span className="text-[11px] text-[#4A7836] font-semibold mt-1 block">
            {totalSeeds > 0
              ? `（合計 ${totalSeeds} 粒のデータ）`
              : '栽培して記録を伸ばそう！'}
          </span>
        </div>
      </div>
    </div>
  );
};
