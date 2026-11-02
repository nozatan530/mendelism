/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameState, LevelStats, MysteryNoteItem, Lv3MysterySeedStatus, ShapeGenotype } from '../types';
import { REQUIRED_SEEDS } from '../utils/genetics';
import { playSuccessChime } from '../utils/sound';
import { BookOpen, CheckCircle, HelpCircle, Sparkles, Award } from 'lucide-react';

interface MysteryNoteProps {
  note: MysteryNoteItem;
  level: number;
  stats: LevelStats;
  canVerify: boolean;
  lv3Results: GameState['lv3Results'];
  lv3MysterySeeds: Lv3MysterySeedStatus[];
  soundEnabled: boolean;
  onSelectOption: (optionIndex: number) => void;
  onGoToGarden: () => void;
  onSubmitHypothesis: () => void;
  onConfirmLv3Deduction: (answers: { [seedId: string]: ShapeGenotype }) => boolean;
}

export const MysteryNote: React.FC<MysteryNoteProps> = ({
  note,
  level,
  stats,
  canVerify,
  lv3Results,
  lv3MysterySeeds,
  soundEnabled,
  onSelectOption,
  onGoToGarden,
  onSubmitHypothesis,
  onConfirmLv3Deduction,
}) => {
  const [lv3Guesses, setLv3Guesses] = useState<{ [seedId: string]: ShapeGenotype }>({});
  const [lv3ErrorMsg, setLv3ErrorMsg] = useState<string | null>(null);
  const [lv3SuccessMsg, setLv3SuccessMsg] = useState<string | null>(null);

  const isCorrect = note.selectedOptionIndex === note.correctOptionIndex;
  const allGuessed = lv3MysterySeeds.every((m) => lv3Guesses[m.id]);
  const experimentResult =
    level === 4
      ? `丸・黄 ${stats.roundYellow}：丸・緑 ${stats.roundGreen}：しわ・黄 ${stats.wrinkledYellow}：しわ・緑 ${stats.wrinkledGreen}`
      : `丸 ${stats.round}：しわ ${stats.wrinkled}`;
  const missionText: { [lv: number]: string } = {
    1: `純系の丸としわを交配し、F1の豆を${REQUIRED_SEEDS[1]}粒以上数えると検証できます。`,
    2: `F1を自家受精させ、F2の豆を${REQUIRED_SEEDS[2]}粒以上数えると検証できます。`,
    3: '謎の丸豆3種をすべて、しわ（aa）と交配して収穫すると検証できます。',
    4: `F1（AaBb）を自家受精させ、F2の豆を${REQUIRED_SEEDS[4]}粒以上数えると検証できます。`,
  };

  const isLv3AllConfirmed = lv3MysterySeeds.every((m) => m.confirmed);

  const handleSubmitDeduction = () => {
    setLv3ErrorMsg(null);
    setLv3SuccessMsg(null);
    const success = onConfirmLv3Deduction(lv3Guesses);
    if (success) {
      playSuccessChime(soundEnabled);
      setLv3SuccessMsg('見事正解です！検定交雑の原理によって、3粒すべての遺伝子型を見抜きました！');
    } else {
      setLv3ErrorMsg('不正解が含まれています。しわ（aa）と交配したとき、子にしわ豆が出た株は「Aa」、すべて丸になった株は「AA」です。もう一度結果を確認して見直してみましょう。');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 text-[#2C3E2D]">
      {/* ノート表紙調カード */}
      <div className="bg-[#FAF7F0] border-2 border-[#D8C69F] rounded-2xl p-6 shadow-sm relative overflow-hidden">
        {/* 背景の薄い方眼紙パターン */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(#4A7836 1px, transparent 1px), linear-gradient(90deg, #4A7836 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between pb-3 border-b border-[#DECFA4]">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#4A7836]" />
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#E4DAC2] text-[#4A5D45]">
                謎解きノート
              </span>
              <span className="text-xs text-stone-500 font-semibold">
                Level {level} の探究
              </span>
            </div>

            {note.isSubmitted && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#356B25] bg-[#E5F5DC] px-3 py-1 rounded-full border border-[#B3DE9C]">
                <CheckCircle className="w-3.5 h-3.5" />
                検証完了
              </span>
            )}
          </div>

          <h2
            className="text-xl font-bold text-[#2A4428] mt-3"
            style={{ fontFamily: 'Zen Maru Gothic, sans-serif' }}
          >
            {note.title}
          </h2>

          {/* 問いかけ */}
          <div className="mt-4 p-4 bg-white/80 rounded-xl border border-[#DECFA4]">
            <span className="text-xs font-bold text-[#758E6F] block mb-1">
              【メンデルからの問い】
            </span>
            <p className="text-sm font-bold text-[#2A4428] leading-relaxed">
              {note.question}
            </p>
          </div>

          {/* 仮説選択肢 */}
          <div className="mt-5 space-y-2.5">
            <span className="text-xs font-bold text-stone-600 block">
              {note.predictionLocked ? '実験の前に立てた予想：' : '畑に出る前に、予想を決めよう。'}
            </span>
            {note.options.map((opt, idx) => {
              const isSelected = note.selectedOptionIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => !note.predictionLocked && onSelectOption(idx)}
                  disabled={note.predictionLocked}
                  className={`w-full p-3.5 rounded-xl text-left text-xs sm:text-sm font-medium transition-all border flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#EBF5E5] border-[#4A7836] text-[#224016] ring-2 ring-[#4A7836]/20 font-bold'
                      : 'bg-white border-[#E0D5BE] hover:border-[#8DA67E] text-stone-700'
                  } ${note.predictionLocked ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <span>{opt}</span>
                  {isSelected && <CheckCircle className="w-4 h-4 text-[#4A7836] shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* 提出・検証ボタン */}
          {!note.predictionLocked && (
            <button
              onClick={onGoToGarden}
              className="mt-6 w-full py-2.5 px-4 bg-[#4A7836] hover:bg-[#3B6229] text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              畑で予想を決める
            </button>
          )}

          {note.predictionLocked && !note.isSubmitted && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#DECFA4]">
              <span className="text-xs text-stone-600">
                {canVerify
                  ? '実験データがそろいました。仮説と照合しましょう。'
                  : `${missionText[level]}${level !== 3 ? `（今 ${stats.totalSeeds} 粒）` : ''}`}
              </span>
              <button
                onClick={onSubmitHypothesis}
                disabled={note.selectedOptionIndex === null || !canVerify}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs flex items-center gap-2 ${
                  note.selectedOptionIndex !== null && canVerify
                    ? 'bg-[#4A7836] hover:bg-[#3B6229] text-white cursor-pointer active:scale-98'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>実験結果と照合して検証する</span>
              </button>
            </div>
          )}

          {/* 検証結果 & パネット方形の解説 */}
          {note.isSubmitted && (
            <div className="mt-6 pt-5 border-t border-[#DECFA4] space-y-4 animate-in fade-in">
              <div className={`p-4 rounded-xl border text-xs sm:text-sm ${isCorrect ? 'bg-[#EDF7E7] border-[#C5E5B6] text-[#27481B]' : 'bg-[#FFF7E8] border-[#F2D59B] text-[#6B5324]'}`}>
                <strong>{isCorrect ? 'あなたの仮説は実験で確かめられました！' : '仮説とは違う結果でした。予想が外れたところに発見があります。'}</strong>
                {level !== 3 && <p className="mt-1">あなたの実験：{experimentResult}</p>}
                <p className="mt-1">正しい答え：{note.options[note.correctOptionIndex]}</p>
              </div>
              <div className="p-4 bg-[#EDF7E7] rounded-xl border border-[#C5E5B6] text-xs sm:text-sm text-[#27481B]">
                <div className="flex items-center gap-1.5 font-bold mb-1 text-[#3B6628]">
                  <Sparkles className="w-4 h-4 text-[#E5B824]" />
                  <span>解説と遺伝の仕組み</span>
                </div>
                <p className="leading-relaxed">{note.explanation}</p>
              </div>

              {/* パネット方形（Punnett Square）の視覚的描画 */}
              <div className="bg-white p-5 rounded-xl border border-[#DECFA4]">
                <span className="text-xs font-bold text-stone-600 block mb-3">
                  【パネット方形（配偶子と受精卵の組み合わせ図）】
                </span>

                <div className="overflow-x-auto">
                  <table className="border-collapse mx-auto text-xs sm:text-sm select-none">
                    <thead>
                      <tr>
                        <th className="p-2 border border-stone-300 bg-[#EFE9D7] text-stone-600 font-bold">
                          母＼父
                        </th>
                        {note.punnettSquare.headersCol.map((hc, cIdx) => (
                          <th
                            key={cIdx}
                            className="p-2 border border-stone-300 bg-[#F5F0E1] text-[#3B542F] font-bold text-center"
                          >
                            {hc}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {note.punnettSquare.grid.map((row, rIdx) => (
                        <tr key={rIdx}>
                          <th className="p-2 border border-stone-300 bg-[#F5F0E1] text-[#3B542F] font-bold text-center">
                            {note.punnettSquare.headersRow[rIdx]}
                          </th>
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className="p-3 border border-stone-300 text-center bg-[#FAF9F5] hover:bg-[#F0EFE6] transition-colors"
                            >
                              <div className="font-mono font-bold text-[#2A4428]">
                                {cell.genotype}
                              </div>
                              <div className="text-[11px] text-stone-500 font-medium mt-0.5">
                                {cell.phenotype}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {level === 4 && note.isSubmitted && (
        <div className="p-4 bg-[#EDF7E7] rounded-2xl border border-[#C5E5B6] text-sm font-bold text-[#27481B] text-center">
          全レベル達成！ メンデルと同じ道のりで、遺伝の法則を自分の手で確かめました。
        </div>
      )}

      {/* Lv3 専用：検定交雑の謎解き判定セクション */}
      {level === 3 && (
        <div className="bg-[#FAF7F0] border-2 border-[#D8C69F] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-[#B8860B]" />
            <h3
              className="text-lg font-bold text-[#2A4428]"
              style={{ fontFamily: 'Zen Maru Gothic, sans-serif' }}
            >
              検定交雑の推理：3粒の遺伝子型を判定せよ
            </h3>
          </div>
          <p className="text-xs text-stone-600 mb-4 leading-relaxed">
            しわ（aa）との交配で得た子の数を見て、3粒それぞれの遺伝子型を推理しよう。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {lv3MysterySeeds.map((seed) => {
              const currentGuess = lv3Guesses[seed.id];
              const result = lv3Results[seed.id];
              return (
                <div
                  key={seed.id}
                  className="bg-white p-4 rounded-xl border border-[#DECFA4] text-center"
                >
                  <span className="text-sm font-bold text-[#2C4528] block mb-2">
                    {seed.name}
                  </span>
                  <p className="text-xs text-stone-600 mb-2">
                    {result ? `子：丸 ${result.round} ／ しわ ${result.wrinkled}` : 'まだ検定交雑していません'}
                  </p>
                  {seed.confirmed ? (
                    <div className="p-2 bg-[#E5F5DC] rounded-lg border border-[#B3DE9C] text-xs font-bold text-[#2E5E1F]">
                      正解確定: <span className="font-mono text-base">{seed.realGenotype}</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-stone-500 font-medium block">
                        推理する遺伝子型：
                      </label>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            setLv3Guesses((prev) => ({ ...prev, [seed.id]: 'AA' }))
                          }
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                            currentGuess === 'AA'
                              ? 'bg-[#4A7836] text-white border-[#4A7836]'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          AA (純系)
                        </button>
                        <button
                          onClick={() =>
                            setLv3Guesses((prev) => ({ ...prev, [seed.id]: 'Aa' }))
                          }
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                            currentGuess === 'Aa'
                              ? 'bg-[#4A7836] text-white border-[#4A7836]'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          Aa (ヘテロ)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {lv3ErrorMsg && (
            <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs mb-3">
              {lv3ErrorMsg}
            </div>
          )}

          {lv3SuccessMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs mb-3 font-bold">
              {lv3SuccessMsg}
            </div>
          )}

          {!isLv3AllConfirmed && (
            <button
              onClick={handleSubmitDeduction}
              disabled={!allGuessed || !canVerify}
              className="w-full py-2.5 px-4 bg-[#D97706] hover:bg-[#B45309] disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all shadow-xs cursor-pointer active:scale-98"
            >
              遺伝子型の推理を判定する
            </button>
          )}
        </div>
      )}
    </div>
  );
};
