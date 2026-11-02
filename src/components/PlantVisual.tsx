/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlantStage } from '../types';

interface PlantVisualProps {
  stage: PlantStage;
  isEmasculated?: boolean;
  pollinated?: boolean;
  className?: string;
}

export const PlantVisual: React.FC<PlantVisualProps> = ({
  stage,
  isEmasculated = false,
  pollinated = false,
  className = '',
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* 1. SEEDED: まきたての土の盛り上がり */}
      {stage === 'SEEDED' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* 土の盛り上がり */}
          <ellipse cx="50" cy="78" rx="35" ry="14" fill="#6B4F35" />
          <ellipse cx="50" cy="74" rx="28" ry="10" fill="#846244" />
          <circle cx="50" cy="68" r="4.5" fill="#4B772D" stroke="#365820" strokeWidth="1" />
          {/* 小さな水引・名札 */}
          <rect x="48" y="52" width="4" height="16" fill="#D8BE9A" rx="1" />
          <path d="M 44 48 L 56 48 L 54 55 L 46 55 Z" fill="#E8D5B7" />
        </svg>
      )}

      {/* 2. SPROUT: 発芽（柔らかな双葉と若芽） */}
      {stage === 'SPROUT' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* 土 */}
          <ellipse cx="50" cy="82" rx="32" ry="10" fill="#75563B" />
          {/* 茎 */}
          <path
            d="M 50 80 Q 49 65 50 56"
            stroke="#5B8E3B"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* 左の双葉 */}
          <path
            d="M 49 58 C 38 52, 34 60, 40 68 C 45 70, 48 64, 49 58 Z"
            fill="#7DBA4E"
            stroke="#4D7F31"
            strokeWidth="1.2"
          />
          {/* 右の双葉 */}
          <path
            d="M 51 58 C 62 50, 66 58, 60 66 C 55 69, 52 64, 51 58 Z"
            fill="#88C956"
            stroke="#4D7F31"
            strokeWidth="1.2"
          />
          {/* 中心から伸びる本葉の芽 */}
          <path
            d="M 50 56 Q 50 48 52 44"
            stroke="#6EA642"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="52" cy="44" r="2.5" fill="#9CD869" />
        </svg>
      )}

      {/* 3. GROWING: ぐんぐん伸びるツルと巻きひげ、支柱 */}
      {stage === 'GROWING' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* 竹の支柱 */}
          <line x1="46" y1="90" x2="52" y2="12" stroke="#B89E72" strokeWidth="3" strokeLinecap="round" />
          <line x1="48" y1="35" x2="51" y2="35" stroke="#8A6E46" strokeWidth="2" />
          <line x1="49" y1="65" x2="52" y2="65" stroke="#8A6E46" strokeWidth="2" />

          {/* つるの巻き付き */}
          <path
            d="M 50 85 Q 44 70 52 55 Q 58 40 48 26 Q 44 18 51 16"
            stroke="#4D7F31"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          {/* 巻きひげ */}
          <path
            d="M 51 16 C 58 12, 64 20, 58 24 C 54 26, 56 30, 62 28"
            stroke="#6DA842"
            strokeWidth="1.5"
            fill="none"
          />

          {/* 複葉 */}
          {/* 下段葉 */}
          <path d="M 46 65 C 32 60, 28 72, 38 78 C 44 80, 48 72, 46 65 Z" fill="#5F9A38" stroke="#3D6A23" strokeWidth="1" />
          <path d="M 54 62 C 68 56, 72 68, 62 74 C 56 76, 52 68, 54 62 Z" fill="#6EA941" stroke="#3D6A23" strokeWidth="1" />
          {/* 中段葉 */}
          <path d="M 47 42 C 34 36, 30 46, 40 52 C 45 54, 48 48, 47 42 Z" fill="#6DA842" stroke="#3D6A23" strokeWidth="1" />
          <path d="M 55 38 C 68 32, 73 42, 64 48 C 58 50, 54 44, 55 38 Z" fill="#7DBE4D" stroke="#3D6A23" strokeWidth="1" />
        </svg>
      )}

      {/* 4. BUD: つぼみ（除雄アクション可能） */}
      {stage === 'BUD' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* 支柱 & つる */}
          <line x1="46" y1="90" x2="52" y2="12" stroke="#B89E72" strokeWidth="3" strokeLinecap="round" />
          <path
            d="M 50 85 Q 44 68 52 50 Q 56 35 48 22"
            stroke="#4D7F31"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          {/* 葉 */}
          <path d="M 45 56 C 30 52, 28 66, 38 72 C 45 74, 48 64, 45 56 Z" fill="#5F9A38" />
          <path d="M 54 48 C 68 44, 72 56, 62 62 C 56 64, 52 56, 54 48 Z" fill="#6EA941" />

          {/* つぼみ 1（主つぼみ） */}
          <g transform="translate(48, 22)">
            {/* つぼみの花柄 */}
            <path d="M 0 0 Q 8 -6 12 -12" stroke="#5F9A38" strokeWidth="2" fill="none" />
            {/* がく片（緑の覆い） */}
            <path d="M 12 -12 C 14 -16, 18 -15, 20 -10 C 16 -8, 13 -9, 12 -12 Z" fill="#4D7F31" />
            {/* 膨らんだつぼみの花弁（淡いクリームホワイト） */}
            <path
              d="M 14 -13 C 18 -22, 28 -20, 28 -14 C 28 -8, 20 -7, 14 -13 Z"
              fill={isEmasculated ? '#F0F9EA' : '#FDFBF4'}
              stroke="#B3C49F"
              strokeWidth="1.2"
            />
            {/* 除雄済みサイン */}
            {isEmasculated ? (
              <circle cx="21" cy="-14" r="3.5" fill="#5B9E3A" stroke="#FFFFFF" strokeWidth="1" />
            ) : (
              /* おしべの気配（除雄前） */
              <circle cx="21" cy="-14" r="2.5" fill="#E5B824" stroke="#D19E15" strokeWidth="0.8" />
            )}
          </g>

          {/* つぼみ 2（副つぼみ） */}
          <g transform="translate(46, 38)">
            <path d="M 0 0 Q -8 -4 -12 -8" stroke="#5F9A38" strokeWidth="1.8" fill="none" />
            <path
              d="M -12 -8 C -15 -14, -22 -13, -21 -8 C -19 -4, -14 -5, -12 -8 Z"
              fill="#FDFBF4"
              stroke="#B3C49F"
              strokeWidth="1"
            />
          </g>
        </svg>
      )}

      {/* 5. FLOWER: 満開のエンドウの花（蝶形花冠） */}
      {stage === 'FLOWER' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* 支柱 & つる */}
          <line x1="46" y1="90" x2="52" y2="10" stroke="#B89E72" strokeWidth="3" strokeLinecap="round" />
          <path
            d="M 50 85 Q 44 65 52 48 Q 58 32 48 18"
            stroke="#4D7F31"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          {/* 葉 */}
          <path d="M 45 56 C 30 52, 28 66, 38 72 C 45 74, 48 64, 45 56 Z" fill="#5F9A38" />
          <path d="M 54 52 C 68 46, 72 58, 62 64 C 56 66, 52 58, 54 52 Z" fill="#6EA941" />

          {/* メインの花（白〜極淡いピンクの上品な蝶形花） */}
          <g transform="translate(56, 26)">
            {/* 花柄 */}
            <path d="M -6 4 Q 0 0 6 -4" stroke="#5F9A38" strokeWidth="2.5" fill="none" />
            {/* がく */}
            <path d="M 6 -4 C 8 -8, 12 -6, 12 -2 C 9 0, 7 -2, 6 -4 Z" fill="#4D7F31" />
            {/* 旗弁（Standard petal: 上部の大きな花弁） */}
            <path
              d="M 10 -4 C 12 -18, 28 -22, 32 -10 C 35 2, 22 6, 14 0 Z"
              fill="#FFFFFF"
              stroke="#CBD8C2"
              strokeWidth="1.2"
            />
            {/* 翼弁（Wings: 側面の左右の花弁） */}
            <path
              d="M 12 -2 C 16 -8, 24 -6, 26 0 C 26 6, 18 7, 13 2 Z"
              fill="#F7FAF4"
              stroke="#BCCEB0"
              strokeWidth="1"
            />
            {/* 竜骨弁（Keel: めしべ・おしべを包む舟形の花弁） */}
            <path
              d="M 13 1 C 18 2, 23 4, 21 8 C 17 9, 14 6, 13 1 Z"
              fill="#EDF4E7"
              stroke="#A8BE99"
              strokeWidth="1"
            />

            {/* 受粉済みマーカー */}
            {pollinated && (
              <g transform="translate(24, -2)">
                <circle cx="0" cy="0" r="3" fill="#E5B824" stroke="#FFFFFF" strokeWidth="1" />
                <path d="M -1 -1 L 0 1 L 2 -1" stroke="#664D00" strokeWidth="0.8" fill="none" />
              </g>
            )}
          </g>

          {/* 2輪目の小さな花 */}
          <g transform="translate(44, 42)">
            <path d="M 0 0 Q -8 -4 -12 -6" stroke="#5F9A38" strokeWidth="2" fill="none" />
            <path
              d="M -12 -6 C -15 -14, -24 -12, -22 -5 C -20 2, -14 1, -12 -6 Z"
              fill="#FFFFFF"
              stroke="#CBD8C2"
              strokeWidth="1"
            />
          </g>
        </svg>
      )}

      {/* 6. PODS: ぷっくり実ったエンドウのサヤ（収穫可能） */}
      {stage === 'PODS' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* 支柱 & つる */}
          <line x1="46" y1="90" x2="52" y2="8" stroke="#B89E72" strokeWidth="3" strokeLinecap="round" />
          <path
            d="M 50 85 Q 44 65 52 45 Q 58 28 48 14"
            stroke="#4D7F31"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          {/* 葉 */}
          <path d="M 45 56 C 30 52, 28 66, 38 72 C 45 74, 48 64, 45 56 Z" fill="#5F9A38" />

          {/* サヤ 1（右側にぶら下がる主サヤ・豆の凸凹あり） */}
          <g transform="translate(54, 28)">
            <path d="M -4 2 Q 4 -2 8 4" stroke="#4D7F31" strokeWidth="2" fill="none" />
            {/* サヤ本体 */}
            <path
              d="M 8 4 
                 C 14 12, 18 24, 16 38 
                 C 14 44, 10 46, 6 42 
                 C 4 30, 2 18, 6 4 Z"
              fill="#6EA941"
              stroke="#436F28"
              strokeWidth="1.5"
            />
            {/* サヤの中の豆のふくらみ */}
            <ellipse cx="11" cy="14" rx="2.5" ry="3.5" fill="#81C450" />
            <ellipse cx="12" cy="24" rx="2.8" ry="4" fill="#81C450" />
            <ellipse cx="11" cy="34" rx="2.4" ry="3.5" fill="#81C450" />
            {/* 先端の尖り */}
            <path d="M 6 42 Q 7 46 5 48" stroke="#436F28" strokeWidth="1.2" fill="none" />
          </g>

          {/* サヤ 2（左側にぶら下がるサヤ） */}
          <g transform="translate(44, 42)">
            <path d="M 2 2 Q -4 -2 -8 4" stroke="#4D7F31" strokeWidth="2" fill="none" />
            <path
              d="M -8 4 
                 C -14 12, -17 22, -15 34 
                 C -13 40, -9 41, -6 38 
                 C -5 28, -3 16, -7 4 Z"
              fill="#629A3A"
              stroke="#3D6624"
              strokeWidth="1.4"
            />
            <ellipse cx="-11" cy="15" rx="2.2" ry="3.2" fill="#75B546" />
            <ellipse cx="-12" cy="25" rx="2.4" ry="3.5" fill="#75B546" />
          </g>
        </svg>
      )}
    </div>
  );
};
