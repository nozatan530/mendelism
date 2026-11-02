/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle, Sprout } from 'lucide-react';
import { MysteryNoteItem } from '../types';

interface PredictionCardProps {
  note: MysteryNoteItem;
  onSelectOption: (optionIndex: number) => void;
  onLock: () => void;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({ note, onSelectOption, onLock }) => {
  const hasSelection = note.selectedOptionIndex !== null;

  return (
    <div className="bg-[#FAF7F0] border-2 border-[#D8C69F] rounded-2xl p-6 shadow-sm max-w-3xl mx-auto text-[#2C3E2D]">
      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#E4DAC2] text-[#4A5D45]">
        実験の前に予想しよう
      </span>
      <h2
        className="text-xl font-bold text-[#2A4428] mt-3"
        style={{ fontFamily: 'Zen Maru Gothic, sans-serif' }}
      >
        {note.title}
      </h2>
      <p className="text-sm font-bold text-[#2A4428] leading-relaxed mt-3">{note.question}</p>

      <div className="mt-4 space-y-2.5">
        {note.options.map((opt, idx) => {
          const isSelected = note.selectedOptionIndex === idx;
          return (
            <button
              key={idx}
              onClick={() => onSelectOption(idx)}
              className={`w-full p-3.5 rounded-xl text-left text-xs sm:text-sm font-medium transition-all border flex items-center justify-between gap-3 cursor-pointer ${
                isSelected
                  ? 'bg-[#EBF5E5] border-[#4A7836] text-[#224016] ring-2 ring-[#4A7836]/20 font-bold'
                  : 'bg-white border-[#E0D5BE] hover:border-[#8DA67E] text-stone-700'
              }`}
            >
              <span>{opt}</span>
              {isSelected && <CheckCircle className="w-4 h-4 text-[#4A7836] shrink-0" />}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-stone-600 mt-4">
        決めた予想は実験のあとで変えられません。外れても大丈夫。結果と比べるところに発見があります。
      </p>
      <button
        onClick={onLock}
        disabled={!hasSelection}
        className={`w-full mt-3 py-3 px-4 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 ${
          hasSelection
            ? 'bg-[#4A7836] hover:bg-[#3B6229] text-white cursor-pointer active:scale-98'
            : 'bg-stone-200 text-stone-400 cursor-not-allowed'
        }`}
      >
        <Sprout className="w-4 h-4" />
        <span>この予想で畑に出る</span>
      </button>
    </div>
  );
};
