/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Check, Scissors, Brush, AlertCircle, Info } from 'lucide-react';
import { PlantData } from '../types';
import { playEmasculateSnip, playPollinateDust } from '../utils/sound';

interface FlowerModalProps {
  plant: PlantData;
  allPlants: (PlantData | null)[];
  soundEnabled: boolean;
  onClose: () => void;
  onEmasculate: (plantId: string) => void;
  onPollinate: (targetPlantId: string, donorPlantId: string) => void;
}

export const FlowerModal: React.FC<FlowerModalProps> = ({
  plant,
  allPlants,
  soundEnabled,
  onClose,
  onEmasculate,
  onPollinate,
}) => {
  const [selectedDonorId, setSelectedDonorId] = useState<string | null>(null);

  // 他の開花中（FLOWER または BUD または PODS）の株を花粉提供親候補として抽出
  const otherPlants = allPlants.filter(
    (p): p is PlantData => p !== null && p.id !== plant.id
  );
  const donorCandidates = otherPlants.filter(
    (p) => p.stage === 'FLOWER' || p.stage === 'BUD' || p.stage === 'PODS'
  );

  const handleDoEmasculate = () => {
    playEmasculateSnip(soundEnabled);
    onEmasculate(plant.id);
  };

  const handleDoPollinate = () => {
    if (!selectedDonorId) return;
    playPollinateDust(soundEnabled);
    onPollinate(plant.id, selectedDonorId);
  };

  const donorPlant = allPlants.find((p) => p?.id === plant.pollinatedByPlantId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF7F0] border-2 border-[#D8C69F] rounded-2xl max-w-lg w-full p-6 shadow-xl relative overflow-hidden text-[#2C3E2D]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-500 hover:text-stone-800 hover:bg-[#EAE2D2] transition-colors"
          aria-label="閉じる"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#E4DAC2] text-[#4A5D45]">
              {plant.slotIndex + 1}番区画の株
            </span>
            <span className="text-xs text-stone-600 font-medium">
              世代: {plant.seed.generation} | {plant.seed.parentLabel || '初期種子'}
            </span>
          </div>
          <h2
            className="text-xl font-bold text-[#2A4428] mt-1"
            style={{ fontFamily: 'Zen Maru Gothic, sans-serif' }}
          >
            {plant.stage === 'BUD'
              ? 'つぼみのアップ（除雄のチャンス）'
              : plant.stage === 'FLOWER'
              ? '開花した花のアップ（受粉作業）'
              : 'エンドウの株情報'}
          </h2>
        </div>

        {/* 1. BUD つぼみの段階 */}
        {plant.stage === 'BUD' && (
          <div className="space-y-4">
            {/* 用語解説カード */}
            <div className="p-3.5 bg-[#F0EDE1] rounded-xl border border-[#DECFA4] text-xs text-[#485B43] flex gap-2.5 items-start">
              <Info className="w-4 h-4 text-[#758E6F] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#2C4428] block mb-0.5">
                  除雄（じょゆう）とは？
                </strong>
                エンドウは花が開く前に自分のおしべとめしべで受粉（自家受精）してしまいます。別の株と交配したいときは、
                <span className="underline decoration-[#7A9C68] font-bold">
                  つぼみのうちにおしべを取り除いて自家受精を防ぐ
                </span>
                必要があります。
              </div>
            </div>

            {/* つぼみ拡大イラスト */}
            <div className="bg-[#FFFFFF]/70 rounded-xl p-4 border border-[#E2D8C0] flex flex-col items-center justify-center">
              <svg viewBox="0 0 240 140" className="w-60 h-36">
                {/* がく片（開いた状態） */}
                <path
                  d="M 60 70 Q 90 90 120 70 Q 150 90 180 70 Q 120 120 60 70 Z"
                  fill="#5A8C3B"
                  stroke="#385F21"
                  strokeWidth="2"
                />
                {/* 竜骨弁の断面（めしべとおしべが内包されている） */}
                <path
                  d="M 80 65 C 80 30, 160 30, 160 65 C 150 90, 90 90, 80 65 Z"
                  fill="#FAF7EE"
                  stroke="#CAD8BE"
                  strokeWidth="2"
                />
                {/* めしべ（中央の緑色の雌ずい） */}
                <path
                  d="M 120 75 Q 120 50 118 36"
                  stroke="#4E8431"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <circle cx="118" cy="34" r="4" fill="#75B54E" stroke="#3D6824" strokeWidth="1" />

                {/* おしべ（除雄前なら10本の黄色い葯が見える） */}
                {!plant.isEmasculated ? (
                  <g>
                    {[
                      { x: 104, y: 44 },
                      { x: 108, y: 40 },
                      { x: 112, y: 38 },
                      { x: 124, y: 38 },
                      { x: 128, y: 40 },
                      { x: 132, y: 44 },
                      { x: 106, y: 52 },
                      { x: 130, y: 52 },
                    ].map((pos, idx) => (
                      <g key={idx}>
                        <line
                          x1={pos.x}
                          y1={pos.y}
                          x2="120"
                          y2="72"
                          stroke="#E0CD94"
                          strokeWidth="1.5"
                        />
                        <ellipse
                          cx={pos.x}
                          cy={pos.y}
                          rx="3"
                          ry="2"
                          fill="#E8BA23"
                          stroke="#C49B14"
                          strokeWidth="0.8"
                        />
                      </g>
                    ))}
                  </g>
                ) : (
                  /* 除雄後: おしべが切除された状態 */
                  <text
                    x="120"
                    y="55"
                    textAnchor="middle"
                    fill="#4E8431"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    ✓ おしべ切除済
                  </text>
                )}
              </svg>

              <div className="mt-2 text-center">
                {plant.isEmasculated ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#356B25] bg-[#E5F5DC] px-3 py-1 rounded-full border border-[#B3DE9C]">
                    <Check className="w-3.5 h-3.5" />
                    除雄完了（自家受精を防ぎました）
                  </span>
                ) : (
                  <span className="text-xs text-stone-600 font-medium">
                    黄色いおしべが花の中に残っています
                  </span>
                )}
              </div>
            </div>

            {/* 除雄操作ボタン */}
            {!plant.isEmasculated ? (
              <button
                onClick={handleDoEmasculate}
                className="w-full py-3 px-4 bg-[#4A7836] hover:bg-[#3B6229] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Scissors className="w-4 h-4" />
                ピンセットでおしべを取り除く（除雄する）
              </button>
            ) : (
              <p className="text-xs text-center text-[#586C54]">
                次の段階（開花）に進むと、筆を使って別の株の花粉を受粉させることができます。
              </p>
            )}
          </div>
        )}

        {/* 2. FLOWER 開花段階 */}
        {plant.stage === 'FLOWER' && (
          <div className="space-y-4">
            {/* 除雄していない場合：自家受精の警告と説明 */}
            {!plant.isEmasculated ? (
              <div className="p-3.5 bg-[#FFF7E8] rounded-xl border border-[#F2D59B] text-xs text-[#6B5324] space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#8C5D08]">
                  <AlertCircle className="w-4 h-4" />
                  <span>この花は「自家受精」になります</span>
                </div>
                <p>
                  つぼみの時に除雄しなかったため、花が開く前に自身のおしべの花粉で受粉が完了しています。
                  <strong>他の株の花粉をつけても無効となり、自家受精のまま豆が実ります。</strong>
                </p>
              </div>
            ) : (
              /* 除雄済みの場合：人工受粉の案内 */
              <div className="p-3.5 bg-[#EDF7E7] rounded-xl border border-[#C5E5B6] text-xs text-[#355B27] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#2A4D1E]">
                  <Check className="w-4 h-4 text-[#44822D]" />
                  <span>除雄済みのめしべです（受粉待ち）</span>
                </div>
                <p>
                  別の株から花粉を筆で採取し、この花のめしべにつけて人工交配しましょう。
                  （受粉させないまま時間を進めると、実が実りません）
                </p>
              </div>
            )}

            {/* 受粉相手の選択（除雄済みの場合のみ操作可能） */}
            {plant.isEmasculated && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#2A4428] block">
                  花粉親（お父さん株）を畑から選ぶ：
                </label>

                {donorCandidates.length === 0 ? (
                  <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    畑に花粉をとれる他の株がありません。別の区画に種をまいて育ててください。
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 border border-[#DECFA4] rounded-xl bg-white/60">
                    {donorCandidates.map((donor) => {
                      const isSelected = selectedDonorId === donor.id;
                      return (
                        <button
                          key={donor.id}
                          onClick={() => setSelectedDonorId(donor.id)}
                          className={`p-2 rounded-lg text-left text-xs transition-all border flex flex-col gap-0.5 ${
                            isSelected
                              ? 'bg-[#E3F2DA] border-[#4A7836] text-[#224016] ring-2 ring-[#4A7836]/30 font-bold'
                              : 'bg-white border-stone-200 hover:border-[#8DA67E] text-stone-700'
                          }`}
                        >
                          <span className="font-semibold">{donor.slotIndex + 1}番区画</span>
                          <span className="text-[11px] text-stone-500">
                            {donor.seed.parentLabel || donor.seed.generation}
                          </span>
                          <span className="text-[10px] text-[#4A7836]">
                            表現型: {donor.seed.phenotype.shape === 'round' ? '丸' : 'しわ'}
                            {donor.seed.phenotype.color ? `・${donor.seed.phenotype.color === 'yellow' ? '黄' : '緑'}` : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* すでに受粉済みの情報 */}
                {plant.pollinatedByPlantId && donorPlant && (
                  <div className="text-xs text-[#2A4D1E] bg-[#E9F5E4] p-2.5 rounded-lg border border-[#B3DC9F] flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#44822D] shrink-0" />
                    <span>
                      現在：<strong>{donorPlant.slotIndex + 1}番区画（{donorPlant.seed.parentLabel || '花粉親'}）</strong>の花粉を受粉中
                    </span>
                  </div>
                )}

                {/* 筆で受粉するボタン */}
                <button
                  onClick={handleDoPollinate}
                  disabled={!selectedDonorId}
                  className={`w-full py-2.5 px-4 font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 ${
                    selectedDonorId
                      ? 'bg-[#D97706] hover:bg-[#B45309] text-white cursor-pointer active:scale-98'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  <Brush className="w-4 h-4" />
                  筆で花粉をつける（人工受粉）
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. PODS またはその他段階 */}
        {plant.stage === 'PODS' && (
          <div className="space-y-3">
            <div className="p-4 bg-white/70 rounded-xl border border-[#DECFA4] text-xs space-y-2">
              <div className="font-bold text-sm text-[#2D452B]">結実の記録</div>
              <div>
                <strong>受粉方式：</strong>{' '}
                {plant.pollinationResult === 'self' ? (
                  <span className="text-amber-800 font-bold">自家受精（自株の花粉）</span>
                ) : plant.pollinationResult === 'cross' ? (
                  <span className="text-emerald-800 font-bold">
                    人工交配（相手：{donorPlant ? `${donorPlant.slotIndex + 1}番区画` : '交配相手'}）
                  </span>
                ) : (
                  <span className="text-red-700 font-bold">実らず（除雄後に未受粉）</span>
                )}
              </div>
              <div>
                <strong>サヤの数：</strong> {plant.pods.length}個
              </div>
              <p className="text-stone-600">
                「収穫する」ボタンを押すと、収穫台でサヤを割って中の豆を確認・集計できます。
              </p>
            </div>
          </div>
        )}

        {/* 閉じるボタン */}
        <div className="mt-5 pt-3 border-t border-[#DECFA4]/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#E2D8C0] hover:bg-[#D5C9AE] text-[#334731] font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            畑に戻る
          </button>
        </div>
      </div>
    </div>
  );
};
