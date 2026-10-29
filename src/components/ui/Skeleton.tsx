import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Single skeleton bone — a grey shimmer block.
 * Uses a looping fade animation to simulate loading.
 */
export function Skeleton({
  width,
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.bone,
        {
          width: width ?? "100%",
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * A row of skeleton bones separated by a small gap.
 */
export function SkeletonRow({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.row, style]}>{children}</View>;
}

/**
 * Wallet Home skeleton — matches the layout of WalletHomeSurface.
 * Shows: greeting row, hero card, 3 transaction items.
 */
export function WalletHomeSkeleton() {
  return (
    <View style={styles.homePad}>
      {/* Greeting row */}
      <SkeletonRow style={styles.mb20}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <View style={[styles.col, { marginLeft: 12, flex: 1 }]}>
          <Skeleton width="45%" height={12} borderRadius={6} />
          <Skeleton width="60%" height={16} borderRadius={6} style={{ marginTop: 6 }} />
        </View>
        <Skeleton width={44} height={44} borderRadius={22} />
      </SkeletonRow>

      {/* Hero card */}
      <Skeleton height={200} borderRadius={28} style={styles.mb20} />

      {/* Action buttons row */}
      <SkeletonRow style={{ ...styles.mb24, justifyContent: "space-between" }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.actionSkel}>
            <Skeleton width={52} height={52} borderRadius={16} />
            <Skeleton width={48} height={10} borderRadius={5} style={{ marginTop: 6 }} />
          </View>
        ))}
      </SkeletonRow>

      {/* Section header */}
      <SkeletonRow style={{ ...styles.mb16, justifyContent: "space-between" }}>
        <Skeleton width={130} height={16} borderRadius={6} />
        <Skeleton width={52} height={12} borderRadius={6} />
      </SkeletonRow>

      {/* Transaction items */}
      {[0, 1, 2, 3].map((i) => (
        <SkeletonRow key={i} style={styles.txRow}>
          <Skeleton width={44} height={44} borderRadius={14} />
          <View style={[styles.col, { marginLeft: 12, flex: 1 }]}>
            <Skeleton width="55%" height={14} borderRadius={6} />
            <Skeleton width="38%" height={11} borderRadius={5} style={{ marginTop: 6 }} />
          </View>
          <Skeleton width={64} height={14} borderRadius={6} />
        </SkeletonRow>
      ))}
    </View>
  );
}

/**
 * Transactions list skeleton — full list rows.
 */
export function TransactionsSkeleton() {
  return (
    <View style={styles.homePad}>
      {/* Header */}
      <Skeleton width="50%" height={28} borderRadius={10} style={styles.mb24} />

      {/* Filter row */}
      <SkeletonRow style={styles.mb20}>
        {[80, 90, 70, 80].map((w, i) => (
          <Skeleton key={i} width={w} height={34} borderRadius={17} style={{ marginRight: 8 }} />
        ))}
      </SkeletonRow>

      {/* Date label */}
      <Skeleton width={100} height={12} borderRadius={6} style={styles.mb12} />

      {/* Transaction rows */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <SkeletonRow key={i} style={styles.txRow}>
          <Skeleton width={44} height={44} borderRadius={14} />
          <View style={[styles.col, { marginLeft: 12, flex: 1 }]}>
            <Skeleton width="55%" height={14} borderRadius={6} />
            <Skeleton width="38%" height={11} borderRadius={5} style={{ marginTop: 6 }} />
          </View>
          <Skeleton width={64} height={14} borderRadius={6} />
        </SkeletonRow>
      ))}
    </View>
  );
}

/**
 * Settings page skeleton — back button, title, rows with icons + chevrons/switches.
 */
export function SettingsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <View style={styles.homePad}>
      {/* Back button */}
      <Skeleton width={46} height={46} borderRadius={14} style={styles.mb20} />

      {/* Title */}
      <Skeleton width="45%" height={26} borderRadius={10} style={styles.mb24} />

      {/* Section label */}
      <Skeleton width="30%" height={12} borderRadius={6} style={styles.mb12} />

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} style={styles.txRow}>
          <Skeleton width={40} height={40} borderRadius={12} />
          <View style={[styles.col, { marginLeft: 12, flex: 1 }]}>
            <Skeleton width="55%" height={14} borderRadius={6} />
            <Skeleton width="38%" height={10} borderRadius={5} style={{ marginTop: 5 }} />
          </View>
          <Skeleton width={32} height={20} borderRadius={10} />
        </SkeletonRow>
      ))}

      {/* Second section label */}
      <Skeleton width="30%" height={12} borderRadius={6} style={{ ...styles.mb12, marginTop: 20 }} />

      {Array.from({ length: Math.max(2, rows - 4) }).map((_, i) => (
        <SkeletonRow key={i} style={styles.txRow}>
          <Skeleton width={40} height={40} borderRadius={12} />
          <View style={[styles.col, { marginLeft: 12, flex: 1 }]}>
            <Skeleton width="50%" height={14} borderRadius={6} />
          </View>
          <Skeleton width={20} height={20} borderRadius={6} />
        </SkeletonRow>
      ))}
    </View>
  );
}


export function ProfileSkeleton() {
  return (
    <View style={styles.homePad}>
      {/* Back button */}
      <Skeleton width={46} height={46} borderRadius={14} style={styles.mb20} />

      {/* Title */}
      <Skeleton width="35%" height={28} borderRadius={10} style={styles.mb24} />

      {/* Avatar + name card */}
      <Skeleton height={90} borderRadius={20} style={styles.mb16} />

      {/* KYC banner */}
      <Skeleton height={64} borderRadius={20} style={styles.mb24} />

      {/* Section label */}
      <Skeleton width="30%" height={14} borderRadius={6} style={styles.mb12} />

      {/* Settings rows */}
      {[0, 1, 2, 3, 4].map((i) => (
        <SkeletonRow key={i} style={styles.txRow}>
          <Skeleton width={40} height={40} borderRadius={12} />
          <View style={[styles.col, { marginLeft: 12, flex: 1 }]}>
            <Skeleton width="55%" height={14} borderRadius={6} />
          </View>
          <Skeleton width={20} height={20} borderRadius={6} />
        </SkeletonRow>
      ))}

      {/* Second section */}
      <Skeleton width="30%" height={14} borderRadius={6} style={{ ...styles.mb12, marginTop: 20 }} />
      {[0, 1, 2].map((i) => (
        <SkeletonRow key={i} style={styles.txRow}>
          <Skeleton width={40} height={40} borderRadius={12} />
          <View style={[styles.col, { marginLeft: 12, flex: 1 }]}>
            <Skeleton width="50%" height={14} borderRadius={6} />
          </View>
          <Skeleton width={20} height={20} borderRadius={6} />
        </SkeletonRow>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bone: {
    backgroundColor: "#E5E7EB",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  col: {
    flexDirection: "column",
  },
  homePad: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  mb12: { marginBottom: 12 },
  mb16: { marginBottom: 16 },
  mb20: { marginBottom: 20 },
  mb24: { marginBottom: 24 },
  txRow: {
    marginBottom: 14,
    alignItems: "center",
  },
  actionSkel: {
    alignItems: "center",
  },
});
