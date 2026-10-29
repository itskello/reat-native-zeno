import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

type IconProps = {
  size?: number;
  color?: string;
};

/** Verified blue checkmark badge for KYC / Identity card */
export function VerifiedBadgeIcon({ size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 141 141" fill="none">
      <Path
        d="M137.871 61.6193L128.283 50.483C126.45 48.3685 124.969 44.4215 124.969 41.6022V29.6202C124.969 22.1491 118.835 16.0171 111.362 16.0171H99.376C96.6263 16.0171 92.6076 14.537 90.4925 12.7044L79.3528 3.11884C74.488 -1.03961 66.521 -1.03961 61.5857 3.11884L50.5163 12.7749C48.4012 14.537 44.3824 16.0171 41.6328 16.0171H29.4355C21.9621 16.0171 15.8282 22.1491 15.8282 29.6202V41.6727C15.8282 44.4215 14.3476 48.3685 12.585 50.483L3.06693 61.6897C-1.02231 66.553 -1.02231 74.4471 3.06693 79.3103L12.585 90.517C14.3476 92.6315 15.8282 96.5785 15.8282 99.3273V111.38C15.8282 118.851 21.9621 124.983 29.4355 124.983H41.6328C44.3824 124.983 48.4012 126.463 50.5163 128.296L61.6562 137.881C66.521 142.04 74.488 142.04 79.4233 137.881L90.563 128.296C92.6781 126.463 96.6263 124.983 99.4465 124.983H111.432C118.906 124.983 125.04 118.851 125.04 111.38V99.3978C125.04 96.649 126.52 92.6315 128.353 90.517L137.942 79.3808C142.031 74.5175 142.031 66.4825 137.871 61.6193ZM99.799 57.1789L65.7455 91.2218C64.7584 92.2086 63.4188 92.7725 62.0088 92.7725C60.5987 92.7725 59.2591 92.2086 58.272 91.2218L41.2097 74.1651C39.1651 72.1211 39.1651 68.738 41.2097 66.694C43.2544 64.65 46.6386 64.65 48.6832 66.694L62.0088 80.0152L92.3256 49.7077C94.3702 47.6637 97.7544 47.6637 99.799 49.7077C101.844 51.7517 101.844 55.1348 99.799 57.1789Z"
        fill="#1190FF"
      />
    </Svg>
  );
}
/** Chain link icon for Update Password / Delete Account */
export function SecurityLinkIcon({ size = 22, color = "#FFFFFF" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Wallet icon for Login Settings / Logout */
export function SecurityWalletIcon({ size = 22, color = "#FFFFFF" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="6"
        width="18"
        height="13"
        rx="3"
        stroke={color}
        strokeWidth="2"
      />
      <Path
        d="M16 12.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
        fill={color}
      />
      <Path
        d="M3 10h18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Keyboard / PIN card icon with upward arrow */
export function SecurityPinIcon({ size = 22, color = "#071706" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="4"
        y="5"
        width="16"
        height="14"
        rx="3.5"
        stroke={color}
        strokeWidth="2"
      />
      <Path
        d="M12 15V9M12 9L9 12M12 9L15 12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Right chevron arrow > */
export function ChevronRightIcon({ size = 20, color = "#6B7280" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18L15 12L9 6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Globe icon for Language */
export function GlobeIcon({ size = 22, color = "#071706" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path
        d="M3.6 12h16.8M12 3a14.5 14.5 0 014 9 14.5 14.5 0 01-4 9 14.5 14.5 0 01-4-9 14.5 14.5 0 014-9z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Currency exchange icon */
export function CurrencyIcon({ size = 22, color = "#071706" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path
        d="M12 7v10M9.5 9.5h5a2 2 0 010 4h-5a2 2 0 000 4h5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Moon icon for Dark Mode */
export function MoonIcon({ size = 22, color = "#071706" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Bell Outline icon for Notifications */
export function BellOutlineIcon({ size = 22, color = "#071706" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Shield outline icon for Security / Privacy */
export function ShieldOutlineIcon({ size = 22, color = "#071706" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Support question mark circle icon */
export function SupportIcon({ size = 22, color = "#071706" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path
        d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Info icon for About ZENO */
export function InfoIcon({ size = 22, color = "#071706" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path
        d="M12 8h.01M12 12v4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Credit card icon for transaction rows */
export function CardIcon({ size = 22, color = "#0F7153" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
        stroke={color}
        strokeWidth="2"
      />
      <Path d="M3 10h18" stroke={color} strokeWidth="2" />
      <Path
        d="M7 15h3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Copy icon for transaction ID */
export function CopyIcon({ size = 18, color = "#071706" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="9"
        y="9"
        width="11"
        height="11"
        rx="2"
        stroke={color}
        strokeWidth="2"
      />
      <Path
        d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Download statement icon */
export function DownloadIcon({ size = 20, color = "#071706" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Warning triangle icon for report problem */
export function WarningTriangleIcon({ size = 20, color = "#EF4444" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Help / FAQ question-mark circle */
export function HelpCircleIcon({ size = 22, color = "#0F7153" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path
        d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="17" r="0.5" fill={color} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

/** Chat / message bubble icon */
export function MessageChatIcon({ size = 22, color = "#0F7153" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Magnifying glass search icon */
export function SearchIcon({ size = 22, color = "#0F7153" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path
        d="M16.5 16.5L21 21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Arrow right â†’ for "Contacter l'assistance" */
export function ArrowRightIcon({ size = 20, color = "#0F7153" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M12 5l7 7-7 7"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Send arrow up icon for chat input */
export function SendUpIcon({ size = 18, color = "#FFFFFF" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20V4M5 11l7-7 7 7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Book / article collections icon */
export function BookOpenIcon({ size = 22, color = "#0F7153" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2V3zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7V3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Close / X icon */
export function CloseIcon({ size = 18, color = "#6B7280" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Microphone icon for voice input */
export function MicrophoneIcon({ size = 20, color = "#6B7280" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="2" width="6" height="11" rx="3" stroke={color} strokeWidth="2" />
      <Path
        d="M19 10v1a7 7 0 01-14 0v-1M12 19v3M8 22h8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Paperclip / attachment icon */
export function PaperclipIcon({ size = 20, color = "#6B7280" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Sparkle / AI agent icon */
export function SparkleIcon({ size = 20, color = "#C7FF4A" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/** Online presence dot (used in chat header) */
export function OnlineDotIcon({ size = 10, color = "#22C55E" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10" fill="none">
      <Circle cx="5" cy="5" r="4" fill={color} />
    </Svg>
  );
}

/** Conversations empty state illustration */
export function NoConversationsIcon({ size = 64, color = "#9CA3AF" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Rect x="6" y="10" width="52" height="36" rx="8" stroke={color} strokeWidth="2.5" />
      <Path
        d="M20 46l-8 8v-8"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 26h24M20 32h16"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}


/** Small checkmark — completed transaction status badge */
export function CheckmarkIcon({ size = 12, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Path d="M2 6l3 3 5-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Small X mark — failed transaction status badge / modal close */
export function XMarkIcon({ size = 12, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Path d="M2 2l8 8M10 2L2 10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

/** Filled dot — pending/processing status badge */
export function PendingDotIcon({ size = 8, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 8 8" fill="none">
      <Circle cx="4" cy="4" r="3" fill={color} />
    </Svg>
  );
}

/** Plus — FAQ accordion open toggle */
export function PlusIcon({ size = 16, color = "#6B7280" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M8 2v12M2 8h12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/** Minus — FAQ accordion close toggle */
export function MinusIcon({ size = 16, color = "#6B7280" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M2 8h12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/** Green check badge — KYC benefits list items */
export function CheckBadgeIcon({ size = 20, color = "#22C55E" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={color} opacity={0.15} />
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
      <Path d="M7.5 12l3 3 5.5-5.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Star / celebration — KYC success screen */
export function StarCelebrationIcon({ size = 56, color = "#C7FF4A" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <Circle cx="28" cy="28" r="26" fill="#0A1712" />
      <Path
        d="M28 10l4.5 13.5H56l-11.5 8.5 4.5 13.5L28 37.5 17 45.5l4.5-13.5L10 23.5h23.5L28 10z"
        fill={color}
        stroke={color}
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Globe / website icon — About screen social links */
export function GlobeWebIcon({ size = 22, color = "#071706" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M3.6 12h16.8M12 3a14.5 14.5 0 014 9 14.5 14.5 0 01-4 9 14.5 14.5 0 01-4-9 14.5 14.5 0 014-9z" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/** X (Twitter) social icon — About screen */
export function XSocialIcon({ size = 18, color = "#071706" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4l16 16M20 4L4 20" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

/** Camera / Instagram icon — About screen */
export function CameraIcon({ size = 20, color = "#071706" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="15" rx="4" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="13.5" r="3.5" stroke={color} strokeWidth="2" />
      <Path d="M8 6l1.5-3h5L16 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Camera lens overlay — Edit profile photo button */
export function CameraLensIcon({ size = 14, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Rect x="1" y="3" width="12" height="9" rx="2.5" stroke={color} strokeWidth="1.5" />
      <Circle cx="7" cy="7.5" r="2" stroke={color} strokeWidth="1.5" />
      <Path d="M4.5 3l1-2h3l1 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
