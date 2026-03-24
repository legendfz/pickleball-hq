import React from 'react';
import Svg, { Circle, Line, Path, Rect, G } from 'react-native-svg';

interface TabIconProps {
  color: string;
  size?: number;
}

// Play — Pickleball paddle + ball
export function PlayIcon({ color, size = 24 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Paddle */}
      <G transform="rotate(-30, 12, 12)">
        <Rect x="4" y="2" width="10" height="16" rx="5" stroke={color} strokeWidth="1.8" fill="none" />
        {/* Paddle holes */}
        <Circle cx="9" cy="7" r="1" fill={color} opacity="0.4" />
        <Circle cx="9" cy="11" r="1" fill={color} opacity="0.4" />
        <Circle cx="6" cy="9" r="0.8" fill={color} opacity="0.3" />
        <Circle cx="12" cy="9" r="0.8" fill={color} opacity="0.3" />
        {/* Handle */}
        <Line x1="9" y1="18" x2="9" y2="23" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      </G>
      {/* Ball */}
      <Circle cx="19" cy="6" r="2.5" stroke={color} strokeWidth="1.5" fill="none" />
      <Path d="M18 4 Q19 6 18 8" stroke={color} strokeWidth="0.8" fill="none" />
    </Svg>
  );
}

// Courts — Map pin with court grid
export function CourtsIcon({ color, size = 24 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Pin body */}
      <Path
        d="M12 2 C8 2, 4 6, 4 10 C4 15, 12 22, 12 22 C12 22, 20 15, 20 10 C20 6, 16 2, 12 2 Z"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
        strokeLinejoin="round"
      />
      {/* Court inside pin */}
      <Rect x="9" y="8" width="6" height="7" rx="0.5" stroke={color} strokeWidth="1" fill="none" />
      <Line x1="12" y1="8" x2="12" y2="15" stroke={color} strokeWidth="0.8" />
      <Line x1="9" y1="11.5" x2="15" y2="11.5" stroke={color} strokeWidth="0.8" strokeDasharray="1.5 1.5" />
    </Svg>
  );
}

// Players — person silhouette
export function PlayersIcon({ color, size = 24 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Head */}
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8" fill="none" />
      {/* Body */}
      <Path
        d="M5 21 C5 17, 8 14, 12 14 C16 14, 19 17, 19 21"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Events — trophy
export function EventsIcon({ color, size = 24 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Cup */}
      <Path
        d="M7 4 L8 14 Q12 17 16 14 L17 4 Z"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
        strokeLinejoin="round"
      />
      {/* Left handle */}
      <Path d="M7 6 C4 6, 3 10, 6 12" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Right handle */}
      <Path d="M17 6 C20 6, 21 10, 18 12" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Base */}
      <Line x1="10" y1="17" x2="14" y2="17" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="9" y1="20" x2="15" y2="20" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="12" y1="17" x2="12" y2="20" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

// Profile — gear (settings)
export function ProfileIcon({ color, size = 24 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Outer gear teeth */}
      <Path
        d="M12 3 L13.5 3 L14 5.5 C14.8 5.7, 15.5 6, 16.2 6.4 L18.3 5.3 L19.5 6.5 L18.4 8.6 C18.8 9.2, 19 10, 19.3 10.7 L22 11.2 L22 12.8 L19.3 13.3 C19 14, 18.8 14.8, 18.4 15.4 L19.5 17.5 L18.3 18.7 L16.2 17.6 C15.5 18, 14.8 18.3,14 18.5 L13.5 21 L12 21 L11.5 18.5 C10.7 18.3, 10 18, 9.3 17.6 L7.2 18.7 L6 17.5 L7.1 15.4 C6.7 14.8, 6.4 14, 6.2 13.3 L3.5 12.8 L3.5 11.2 L6.2 10.7 C6.4 10, 6.7 9.2, 7.1 8.6 L6 6.5 L7.2 5.3 L9.3 6.4 C10 6, 10.7 5.7, 11.5 5.5 L12 3 Z"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
      />
      {/* Center circle */}
      <Circle cx="12.5" cy="12" r="3.5" stroke={color} strokeWidth="1.5" fill="none" />
    </Svg>
  );
}

// Backwards compatibility — keep TournamentsIcon as alias for EventsIcon
export const TournamentsIcon = EventsIcon;

// MatchesIcon kept for other screens
export function MatchesIcon({ color, size = 24 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="7" cy="12" r="5" stroke={color} strokeWidth="1.8" fill="none" />
      <Circle cx="17" cy="12" r="5" stroke={color} strokeWidth="1.8" fill="none" />
      <Line x1="12" y1="8" x2="12" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

// H2H — kept for other screens
export function H2HIcon({ color, size = 24 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="7" cy="7" r="3" stroke={color} strokeWidth="1.5" fill="none" />
      <Path d="M2 18 C2 15, 4 13, 7 13 C9 13, 10.5 14, 11 15" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <Circle cx="17" cy="7" r="3" stroke={color} strokeWidth="1.5" fill="none" />
      <Path d="M22 18 C22 15, 20 13, 17 13 C15 13, 13.5 14, 13 15" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <Line x1="10" y1="10" x2="14" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M13 8 L15 10 L13 12" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Fantasy — kept for other screens
export function FantasyIcon({ color, size = 24 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2 L14.5 9 L22 9.5 L16 14.5 L18 22 L12 17.5 L6 22 L8 14.5 L2 9.5 L9.5 9 Z"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
        strokeLinejoin="round"
      />
      <Path d="M19 2 L19.5 4 L21 4.5 L19.5 5 L19 7 L18.5 5 L17 4.5 L18.5 4 Z" stroke={color} strokeWidth="1" fill={color} />
    </Svg>
  );
}

// Following — kept for other screens
export function FollowingIcon({ color, size = 24 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20 C6 15, 2 11, 5 7 C6.5 5, 9 4.5, 12 7.5 C15 4.5, 17.5 5, 19 7 C22 11, 18 15, 12 20 Z"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Matchmaking — kept for other screens
export function MatchmakingIcon({ color, size = 24 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="7" cy="7" r="3" stroke={color} strokeWidth="1.5" fill="none" />
      <Path d="M2 20 C2 17, 4 14, 7 14 C9 14, 10 15, 11 16" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <Circle cx="17" cy="7" r="3" stroke={color} strokeWidth="1.5" fill="none" />
      <Path d="M22 20 C22 17, 20 14, 17 14 C15 14, 14 15, 13 16" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <Path d="M10 10 L14 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M11 12 L13 12" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </Svg>
  );
}
