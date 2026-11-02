/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameState } from '../types';
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

interface MendelGuideProps {
  state: GameState;
}

export const MendelGuide: React.FC<MendelGuideProps> = ({ state }) => {
  const [isOpen, setIsOpen] = useState(true);

  // ガイド文言の動的生成
  const getGuideMessage = () => {
    const plants = state.plots.filter((p) => p !== null);
    const hasBuds = plants.some((p) => p?.stage === 'BUD');
    const hasFlowers = plants.some((p) => p?.stage === 'FLOWER');
    const hasPods = plants.some((p) => p?.stage === 'PODS');
    const hasHarvest = state.currentHarvestPods.length > 0;

    if (hasHarvest) {
      return '収穫台にサヤが届いておるぞ！ サヤをタップしてパカッと割り、中の豆の形を数えてみるのじゃ。';
    }

    if (hasPods) {
      return '見事なサヤが実ったな！「すべて収穫する」ボタンを押して、収穫台へ運ぼう。';
    }

    if (hasFlowers) {
      return '花が開花したぞ！ 除雄済みの花があれば、筆ツールで別の株から花粉をもらって受粉させよう。何もしなければ自家受精するぞ。';
    }

    if (hasBuds) {
      return 'つぼみができたな！ 自家受精を防いで別の株と交配したい場合は、開花前の今のうちに「除雄（おしべ摘み取り）」をするのじゃ。';
    }

    if (plants.length > 0) {
      return '芽が出て順調に育っておる。「時間を進める」ボタンを押して、つぼみや花が咲くまで見守るのじゃ。';
    }

    // まだ種がまかれていない場合
    if (state.currentLevel === 1) {
      return 'まずは種袋から「純系 丸（AA）」と「純系 しわ（aa）」を区画にまいてみよう。人工交配でできるF1の豆はどんな形になるかな？';
    }
    if (state.currentLevel === 2) {
      return '第2章へようこそ！ F1の丸い豆（Aa）をまいてみよう。エンドウは除雄しなければ自然に自家受精するぞ。F2の比率に注目じゃ！';
    }
    if (state.currentLevel === 3) {
      return '第3章の検定交雑じゃ！ 3粒の謎の丸豆（AAまたはAa）をしわ（aa）と交配させて、子にしわが出るかどうかで見分けるのじゃ。';
    }
    if (state.currentLevel === 4) {
      return '第4章は2つの遺伝子（形と色）じゃ！ F1のAaBbを自家受精させて育て、9：3：3：1の比率を確かめよう！';
    }

    return '種袋から豆を選んで、空いている区画をタップして種をまいてみよう！';
  };

  return (
    <div className="bg-[#FAF7F0] border border-[#DECFA4] rounded-2xl p-4 shadow-xs relative select-none">
      <div className="flex items-start gap-3">
        {/* メンデル先生アバター（愛嬌のある修道士イラスト） */}
        <div className="w-12 h-12 rounded-2xl bg-[#EBE4D3] border border-[#DECFA4] flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
          <svg viewBox="0 0 48 48" className="w-10 h-10">
            {/* 修道士フード */}
            <path
              d="M 12 40 C 10 24, 16 10, 24 10 C 32 10, 38 24, 36 40 Z"
              fill="#523F2F"
            />
            {/* 顔 */}
            <ellipse cx="24" cy="24" rx="10" ry="11" fill="#FCEBD6" />
            {/* 丸メガネ */}
            <circle cx="20" cy="23" r="3.5" stroke="#443224" strokeWidth="1.2" fill="none" />
            <circle cx="28" cy="23" r="3.5" stroke="#443224" strokeWidth="1.2" fill="none" />
            <line x1="23.5" y1="23" x2="24.5" y2="23" stroke="#443224" strokeWidth="1.2" />
            {/* 目 */}
            <circle cx="20" cy="23" r="1.2" fill="#443224" />
            <circle cx="28" cy="23" r="1.2" fill="#443224" />
            {/* 穏やかな口元 */}
            <path
              d="M 22 28 Q 24 30 26 28"
              stroke="#B3684B"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
            />
            {/* 僧服の首元 */}
            <path d="M 18 36 L 24 44 L 30 36 Z" fill="#E8DEC7" />
          </svg>
        </div>

        {/* 吹き出し */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-xs font-bold text-[#2C4528] flex items-center gap-1.5"
              style={{ fontFamily: 'Zen Maru Gothic, sans-serif' }}
            >
              <Lightbulb className="w-3.5 h-3.5 text-[#E5B824]" />
              <span>メンデル先生のアドバイス</span>
            </span>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-stone-400 hover:text-stone-700 p-0.5 rounded transition-colors"
              aria-label="開閉"
            >
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {isOpen && (
            <p className="text-xs text-[#485C44] leading-relaxed transition-all animate-in fade-in">
              {getGuideMessage()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
