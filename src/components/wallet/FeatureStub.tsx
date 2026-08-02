import { images } from "@/constants/images";
import { useWalletIslandTitle, useWalletNav } from "@/store/wallet-nav";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FeatureStubProps = {
  subtitle?: string;
  /** Clears the Dynamic Island so the stub content starts below the capsule. */
  contentTopGap: number;
};

/**
 * Placeholder content for a Wallet room that isn't built yet.
 *
 * The room's transition, swipe-to-close gesture and Dynamic Island title all
 * come from the navigator, so this only renders the body. The title is read
 * from the navigation store to stay in sync with the capsule above it.
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
      <Pressable
        className="h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white shadow-low"
        onPress={goHome}
        hitSlop={12}
        accessibilityLabel="Back to wallet"
      >
        <Image
          source={images.back}
          style={{ width: 50, height: 50 }}
          contentFit="contain"
        />
      </Pressable>

      <View className="flex-1 items-center justify-center">
        <Text
          allowFontScaling={false}
          className="font-bold text-[28px] text-zeno-text-primary"
        >
          {title}
        </Text>
        <Text
          allowFontScaling={false}
          className="mt-3 text-center text-[16px] text-zeno-text-secondary"
        >
          {subtitle ?? "Coming soon."}
        </Text>
        <Text
          allowFontScaling={false}
          className="mt-8 text-[14px] text-zeno-text-secondary"
        >
          Swipe up to go back
        </Text>
      </View>
    </View>
  );
}
