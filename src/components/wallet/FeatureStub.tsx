import { LocalizedText as Text } from "@/components/ui/LocalizedText";
import { images } from "@/constants/images";
import { useWalletIslandTitle, useWalletNav } from "@/store/wallet-nav";
import { Image } from "expo-image";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Skeleton, SkeletonRow } from "@/components/ui/Skeleton";

type FeatureStubProps = {
  subtitle?: string;
  /** Clears the Dynamic Island so the stub content starts below the capsule. */
  contentTopGap: number;
};

/**
 * Placeholder content for a Wallet room that isn't built yet.
 *
 * Shows the feature title from the Dynamic Island + a skeleton layout
 * hinting at what the feature will look like when implemented.
 * The room's transition, swipe-to-close gesture and Dynamic Island title all
 * come from the navigator, so this only renders the body.
 */
export function FeatureStub({ subtitle, contentTopGap }: FeatureStubProps) {
  const insets = useSafeAreaInsets();
  const title = useWalletIslandTitle();
  const goHome = useWalletNav((s) => s.goHome);

  return (
    <View
      className="flex-1 px-5"
      style={{ paddingTop: contentTopGap, paddingBottom: insets.bottom + 16 }}
    >
      {/* Back button */}
      <View className="h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white shadow-low">
        <Image
          source={images.back}
          style={{ width: 50, height: 50 }}
          contentFit="contain"
          onTouchEnd={goHome}
        />
      </View>

      {/* Title */}
      <Text
        allowFontScaling={false}
        className="mt-6 font-bold text-[28px] text-zeno-text-primary"
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          allowFontScaling={false}
          className="mt-1 text-[14px] text-zeno-text-secondary"
        >
          {subtitle}
        </Text>
      )}

      {/* Skeleton layout — preview of what this feature will show */}
      <FeatureSkeleton title={title} />
    </View>
  );
}

/** Per-feature skeleton layouts that match the planned feature UI. */
function FeatureSkeleton({ title }: { title: string }) {
  if (title === "SEND MONEY") return <SendSkeleton />;
  if (title === "GET PAID") return <GetPaidSkeleton />;
  if (title === "ADD MONEY") return <AddMoneySkeleton />;
  if (title === "WITHDRAW") return <WithdrawSkeleton />;
  if (title === "TRANSACTIONS") return <TransactionListSkeleton />;
  return <GenericSkeleton />;
}

// ─── Send Money skeleton ────────────────────────────────────────────────────

function SendSkeleton() {
  return (
    <View className="mt-8 gap-y-5">
      {/* Search recipient */}
      <Skeleton height={52} borderRadius={16} />

      {/* Recent contacts */}
      <Text allowFontScaling={false} className="font-semibold text-[15px] text-zeno-text-secondary mt-2">
        Recent
      </Text>
      <SkeletonRow style={{ gap: 14 }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ alignItems: "center" }}>
            <Skeleton width={52} height={52} borderRadius={26} />
            <Skeleton width={44} height={10} borderRadius={5} style={{ marginTop: 6 }} />
          </View>
        ))}
      </SkeletonRow>

      {/* Separator */}
      <Skeleton height={1} borderRadius={1} style={{ marginVertical: 4 }} />

      {/* Recipient rows */}
      {[0, 1, 2, 3].map((i) => (
        <SkeletonRow key={i} style={{ marginBottom: 4 }}>
          <Skeleton width={44} height={44} borderRadius={22} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Skeleton width="55%" height={14} borderRadius={6} />
            <Skeleton width="38%" height={11} borderRadius={5} style={{ marginTop: 6 }} />
          </View>
        </SkeletonRow>
      ))}
    </View>
  );
}

// ─── Get Paid skeleton ──────────────────────────────────────────────────────

function GetPaidSkeleton() {
  return (
    <View className="mt-8 gap-y-4">
      {/* QR area */}
      <Skeleton height={200} borderRadius={24} />
      {/* 3 option cards */}
      {[0, 1, 2].map((i) => (
        <SkeletonRow key={i} style={{ marginBottom: 2 }}>
          <Skeleton width={44} height={44} borderRadius={14} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Skeleton width="50%" height={14} borderRadius={6} />
            <Skeleton width="70%" height={11} borderRadius={5} style={{ marginTop: 6 }} />
          </View>
          <Skeleton width={20} height={20} borderRadius={6} />
        </SkeletonRow>
      ))}
    </View>
  );
}

// ─── Add Money skeleton ─────────────────────────────────────────────────────

function AddMoneySkeleton() {
  return (
    <View className="mt-8 gap-y-4">
      {/* Amount input */}
      <Skeleton height={80} borderRadius={20} />
      {/* Operator pills */}
      <SkeletonRow style={{ gap: 10, flexWrap: "wrap" }}>
        {[120, 100, 110].map((w, i) => (
          <Skeleton key={i} width={w} height={40} borderRadius={20} />
        ))}
      </SkeletonRow>
      {/* Phone field */}
      <Skeleton height={52} borderRadius={16} />
      {/* Confirm button */}
      <Skeleton height={56} borderRadius={28} />
    </View>
  );
}

// ─── Withdraw skeleton ──────────────────────────────────────────────────────

function WithdrawSkeleton() {
  return (
    <View className="mt-8 gap-y-4">
      <Skeleton height={80} borderRadius={20} />
      <Skeleton height={52} borderRadius={16} />
      <Skeleton height={52} borderRadius={16} />
      {/* Fee summary */}
      <View style={{ gap: 8, marginTop: 8 }}>
        {[0, 1, 2].map((i) => (
          <SkeletonRow key={i} style={{ justifyContent: "space-between" }}>
            <Skeleton width="40%" height={12} borderRadius={6} />
            <Skeleton width="28%" height={12} borderRadius={6} />
          </SkeletonRow>
        ))}
      </View>
      <Skeleton height={56} borderRadius={28} style={{ marginTop: 8 }} />
    </View>
  );
}

// ─── Transactions list skeleton ─────────────────────────────────────────────

function TransactionListSkeleton() {
  return (
    <View className="mt-6">
      {/* Filter pills */}
      <SkeletonRow style={{ gap: 8, marginBottom: 20 }}>
        {[80, 90, 70].map((w, i) => (
          <Skeleton key={i} width={w} height={34} borderRadius={17} />
        ))}
      </SkeletonRow>

      {/* Date group label */}
      <Skeleton width={100} height={12} borderRadius={6} style={{ marginBottom: 12 }} />

      {/* Transaction rows */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <SkeletonRow key={i} style={{ marginBottom: 14 }}>
          <Skeleton width={44} height={44} borderRadius={14} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Skeleton width="55%" height={14} borderRadius={6} />
            <Skeleton width="38%" height={11} borderRadius={5} style={{ marginTop: 6 }} />
          </View>
          <Skeleton width={64} height={14} borderRadius={6} />
        </SkeletonRow>
      ))}
    </View>
  );
}

// ─── Generic fallback ───────────────────────────────────────────────────────

function GenericSkeleton() {
  return (
    <View className="mt-8 gap-y-4">
      <Skeleton height={56} borderRadius={18} />
      <Skeleton height={56} borderRadius={18} />
      <Skeleton height={56} borderRadius={18} />
      <Skeleton height={56} borderRadius={28} style={{ marginTop: 8 }} />
    </View>
  );
}
