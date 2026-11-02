/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, RotateCcw, Sprout, Sparkles } from 'lucide-react';
import { GameState } from '../types';

interface HeaderProps {
  state: GameState;
  onTabChange: (tab: GameState['activeTab']) => void;
  onLevelChange: (level: 1 | 2 | 3 | 4) => void;
  onToggleSound: () => void;
  onResetGame: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  onTabChange,
  onLevelChange,
  onToggleSound,
  onResetGame,
}) => {
  const levelNames: { [k: number]: string } = {
    1: 'Lv1 優性',
    2: 'Lv2 分離の法則',
    3: 'Lv3 検定交雑',
    4: 'Lv4 独立の法則',
  };

  const navItems: { id: GameState['activeTab']; label: string; badge?: number }[] = [
    { id: 'garden', label: '畑 (栽培)' },
    {
      id: 'harvest',
      label: '収穫台',
      badge: state.currentHarvestPods.length > 0 ? state.currentHarvestPods.length : undefined,
    },
    { id: 'stats', label: '統計グラフ' },
    {
      id: 'notebook',
      label: '謎解きノート',
      badge: state.notebooks[state.currentLevel]?.isSubmitted ? undefined : 1,
    },
    { id: 'seedbag', label: '種袋' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#F4EFE6]/95 backdrop-blur border-b border-[#DECFA4]/60 px-4 lg:px-8 py-3 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center justify-between md:justify-start gap-3 shrink-0">
          <div className="flex items-center gap-2 select-none">
            <span className="w-9 h-9 rounded-xl bg-[#4A7836] text-white flex items-center justify-center shadow-xs">
              <Sprout className="w-5 h-5 text-[#E6F3CE]" />
            </span>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#2D452B] whitespace-nowrap" style={{ fontFamily: 'Zen Maru Gothic, sans-serif' }}>
                メンデルの畑
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-[#6F7F6B] font-medium tracking-wide">
                エンドウ遺伝シミュレーター
              </span>
            </div>
          </div>

          {/* Mobile Sound & Reset Shortcut */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={onToggleSound}
              className="p-2 rounded-lg text-[#556953] hover:bg-[#EAE2D2] transition-colors"
              title={state.soundEnabled ? '音声をミュート' : '音声を再生'}
              aria-label="音声切替"
            >
              {state.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
            </button>
            <button
              onClick={onResetGame}
              className="p-2 rounded-lg text-[#556953] hover:bg-[#EAE2D2] transition-colors"
              title="最初からやり直す"
              aria-label="データ初期化"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Tabs) */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {navItems.map((item) => {
            const isActive = state.activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap shrink-0 relative flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#3F682F] text-white shadow-xs'
                    : 'text-[#485945] hover:text-[#213020] hover:bg-[#EAE2D2]/70'
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-[#F2DE82] text-[#3D3A1F]' : 'bg-[#E29D32] text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Level Selector & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Level Dropdown/Pills */}
          <div className="flex items-center bg-[#E8DFC9] p-1 rounded-xl">
            {([1, 2, 3, 4] as const).map((lv) => {
              const isCurrent = state.currentLevel === lv;
              const isUnlocked = state.unlockedLevels.includes(lv);
              const isCompleted = state.notebooks[lv]?.isSubmitted;

              return (
                <button
                  key={lv}
                  onClick={() => isUnlocked && onLevelChange(lv)}
                  disabled={!isUnlocked}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 whitespace-nowrap shrink-0 ${
                    isCurrent
                      ? 'bg-white text-[#2D452B] shadow-xs'
                      : isUnlocked
                      ? 'text-[#566A53] hover:text-[#213020]'
                      : 'text-stone-400 cursor-not-allowed opacity-60'
                  }`}
                  title={`${levelNames[lv]}${!isUnlocked ? ' (前レベル達成で開放)' : ''}`}
                >
                  <span>{`Lv${lv}`}</span>
                  {isCompleted && <Sparkles className="w-3 h-3 text-[#B8860B]" />}
                </button>
              );
            })}
          </div>

          {/* Desktop Sound & Reset */}
          <div className="hidden md:flex items-center gap-1 border-l border-[#DECFA4]/80 pl-2">
            <button
              onClick={onToggleSound}
              className="p-2 rounded-lg text-[#556953] hover:bg-[#EAE2D2] transition-colors"
              title={state.soundEnabled ? '音声をミュート' : '音声を再生'}
              aria-label="音声切替"
            >
              {state.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
            </button>
            <button
              onClick={onResetGame}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#7D5A3C] hover:bg-[#EAE2D2] transition-colors flex items-center gap-1"
              title="学習の進み具合をリセットして最初から始める"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>リセット</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
