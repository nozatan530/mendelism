/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowRight, BookOpen, Check, ChevronDown, ChevronUp, Footprints } from 'lucide-react';
import { GameState } from '../types';
import { Guide } from '../utils/guide';

interface StepGuideProps {
  guide: Guide;
  activeTab: GameState['activeTab'];
  notice: string | null;
  onGoToTab: (tab: GameState['activeTab']) => void;
}

const TAB_LABELS: { [tab in GameState['activeTab']]: string } = {
  garden: '畑',
  harvest: '収穫台',
  stats: '統計グラフ',
  notebook: '謎解きノート',
  seedbag: '種袋',
};

const TERMS: [string, string][] = [
  ['純系', '何代育てても同じ形の豆しかできない系統。'],
  ['自家受精', '1つの花の中で、自分の花粉が自分のめしべにつくこと。エンドウは何もしなければこうなる。'],
  ['除雄（じょゆう）', 'つぼみのうちにおしべを取り除くこと。自家受精を防ぐ。'],
  ['人工交配', '除雄した花に、別の株の花粉を筆でつけること。'],
  ['F1・F2', '純系どうしをかけ合わせた子が F1。F1 を自家受精させた子が F2。'],
  ['AA・Aa・aa', '遺伝子の組み合わせ（遺伝子型）を表す記号。親から1つずつ受けつぐ。'],
];

// 初めての人向けの「次にやること」。どのタブにいても同じ案内を出す
export const StepGuide: React.FC<StepGuideProps> = ({ guide, activeTab, notice, onGoToTab }) => {
  const [showTerms, setShowTerms] = useState(false);
  const finished = guide.current >= guide.steps.length;

  return (
    <div className="bg-[#FAF7F0] border-2 border-[#C9B77E] rounded-2xl p-4 mb-6 space-y-3 text-[#2C3E2D]">
      <ol className="flex flex-wrap gap-1.5" aria-label="このレベルの手順">
        {guide.steps.map((label, i) => {
          const isDone = i < guide.current;
          const isNow = i === guide.current;
          return (
            <li
              key={label}
              aria-current={isNow ? 'step' : undefined}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold border ${
                isNow
                  ? 'bg-[#4A7836] text-white border-[#4A7836]'
                  : isDone
                  ? 'bg-[#E5F5DC] text-[#2F611E] border-[#B3DE9C]'
                  : 'bg-white text-stone-400 border-stone-200'
              }`}
            >
              {isDone ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
              <span>{label}</span>
            </li>
          );
        })}
      </ol>

      {notice && (
        <p className="p-2.5 bg-[#FFF7E8] rounded-xl border border-[#F2D59B] text-xs text-[#6B5324] leading-relaxed">
          {notice}
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-[220px]">
          <p className="text-[11px] font-bold text-[#8C6314] flex items-center gap-1.5 mb-1">
            <Footprints className="w-3.5 h-3.5" />
            {finished ? 'クリア' : '次にやること'}
          </p>
          <p className="text-sm font-bold leading-relaxed" style={{ fontFamily: 'Zen Maru Gothic, sans-serif' }}>
            {guide.text}
          </p>
          {guide.why && <p className="text-xs text-[#586C54] mt-1 leading-relaxed">なぜ？ {guide.why}</p>}
        </div>
        {guide.tab !== activeTab && (
          <button
            onClick={() => onGoToTab(guide.tab)}
            className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>{TAB_LABELS[guide.tab]}へ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div>
        <button
          onClick={() => setShowTerms(!showTerms)}
          aria-expanded={showTerms}
          className="text-[11px] font-bold text-[#4E624A] flex items-center gap-1 cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>ことばの説明</span>
          {showTerms ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {showTerms && (
          <dl className="mt-2 grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            {TERMS.map(([term, desc]) => (
              <div key={term}>
                <dt className="font-bold text-[#2A4428]">{term}</dt>
                <dd className="text-[#586C54] leading-relaxed">{desc}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
};
