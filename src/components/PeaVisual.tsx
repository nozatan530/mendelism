/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ColorPhenotype, ShapePhenotype } from '../types';

interface PeaVisualProps {
  shape: ShapePhenotype;
  color?: ColorPhenotype;
  size?: number; // default 32
  className?: string;
  showShadow?: boolean;
}

export const PeaVisual: React.FC<PeaVisualProps> = ({
  shape,
  color = 'green',
  size = 32,
  className = '',
  showShadow = true,
}) => {
  // 色のパレット定義
  const isYellow = color === 'yellow';

  // 黄色: 新鮮なゴールドイエロー（優性）
  const baseFill = isYellow ? '#E5B824' : '#629E37';
  const lightFill = isYellow ? '#FBEA72' : '#88C951';
  const darkStroke = isYellow ? '#B58B12' : '#457224';
  const shadowFill = isYellow ? '#C99D16' : '#4F822B';

  const gradId = `pea-grad-${shape}-${color}-${Math.random().toString(36).substring(2, 7)}`;

  return (
    <div
      className={`inline-flex items-center justify-center relative select-none ${className}`}
      style={{ width: size, height: size }}
      title={`${shape === 'round' ? '丸' : 'しわ'}${color ? `・${color === 'yellow' ? '黄' : '緑'}` : ''}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          {/* 丸い豆用の球体グラデーション */}
          <radialGradient id={gradId} cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor={lightFill} />
            <stop offset="60%" stopColor={baseFill} />
            <stop offset="100%" stopColor={shadowFill} />
          </radialGradient>
        </defs>

        {/* 影 */}
        {showShadow && (
          <ellipse
            cx="20"
            cy="36"
            rx="14"
            ry="3.5"
            fill="#2C3E2D"
            fillOpacity="0.18"
          />
        )}

        {shape === 'round' ? (
          /* 丸い豆: つるっとした美しい球体 */
          <g>
            <circle
              cx="20"
              cy="19"
              r="15"
              fill={`url(#${gradId})`}
              stroke={darkStroke}
              strokeWidth="1.5"
            />
            {/* つややかな光沢ハイライト */}
            <ellipse
              cx="15"
              cy="13"
              rx="4"
              ry="2.5"
              transform="rotate(-25 15 13)"
              fill="#FFFFFF"
              fillOpacity="0.65"
            />
            <circle cx="21" cy="11" r="1.2" fill="#FFFFFF" fillOpacity="0.45" />
            {/* 胚芽・へその微細なくぼみ */}
            <path
              d="M 28 20 C 27.5 18, 27.5 22, 28 20"
              stroke={darkStroke}
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeOpacity="0.4"
            />
          </g>
        ) : (
          /* しわの豆: くぼみと深いシワのある有機的変形形状 */
          <g>
            {/* 不規則な外形パス */}
            <path
              d="M 12 10 
                 C 16 6, 25 7, 29 11 
                 C 34 15, 36 24, 31 29 
                 C 26 34, 15 35, 10 30 
                 C 5 25, 7 15, 12 10 Z"
              fill={`url(#${gradId})`}
              stroke={darkStroke}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* 表面の深いしわライン */}
            <path
              d="M 13 15 Q 18 19 23 17 Q 27 15 28 20"
              stroke={darkStroke}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeOpacity="0.65"
            />
            <path
              d="M 16 25 Q 21 23 26 26"
              stroke={darkStroke}
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              strokeOpacity="0.55"
            />
            <path
              d="M 21 12 Q 20 18 17 22"
              stroke={darkStroke}
              strokeWidth="1.4"
              strokeLinecap="round"
              fill="none"
              strokeOpacity="0.45"
            />
            {/* 凹凸による陰影 */}
            <path
              d="M 12 18 C 14 16, 17 21, 19 20"
              stroke={lightFill}
              strokeWidth="1"
              strokeLinecap="round"
              fill="none"
              strokeOpacity="0.8"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
