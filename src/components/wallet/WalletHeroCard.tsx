import { EyeIcon } from "@/components/ui/EyeIcon";
import { images } from "@/constants/images";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

type WalletHeroCardProps = {
  /** Preformatted balance string, e.g. "5 000 FCFA". */
  balanceLabel: string;
  isBalanceHidden: boolean;
  onToggleVisibility: () => void;
  onAddMoney: () => void;
  onWithdraw: () => void;
  onSend: () => void;
  onGetPaid: () => void;
};

/**
 * The Wallet hero block (Wallet Home color family: ZENO Blue). It is the
 * primary surface in the layered Wallet architecture — balance on top, the
 * four primary actions below. Kept as one component because it is a single,
 * clear concept (the Wallet surface), not equal-weight stacked cards.
 */
export function WalletHeroCard({
  balanceLabel,
  isBalanceHidden,
  onToggleVisibility,
  onAddMoney,
  onWithdraw,
  onSend,
  onGetPaid,
}: WalletHeroCardProps) {
  return (
    <View className="rounded-[32px] bg-zeno-blue px-6 pb-5 pt-5 shadow-hero">
      {/* Label row. */}
      <View className="flex-row items-center">
        <Text allowFontScaling={false} className="font-semibold text-[20px] text-white">
          Wallet
        </Text>
        <Text
          allowFontScaling={false}
          className="ml-3 font-medium text-[14px] text-white/60"
        >
          Available Balance
        </Text>
      </View>

      {/* Balance row. */}
      <View className="mt-4 flex-row items-center">
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          className="flex-1 font-bold text-[36px] leading-[44px] text-white"
        >
          {isBalanceHidden ? "••••••" : balanceLabel}
        </Text>
        <Pressable
          className="ml-3 h-[44px] w-[44px] items-center justify-center rounded-full bg-white/15"
          onPress={onToggleVisibility}
          hitSlop={8}
          accessibilityLabel={
            isBalanceHidden ? "Show balance" : "Hide balance"
          }
        >
          <EyeIcon size={22} color="#FFFFFF" crossed={isBalanceHidden} />
        </Pressable>
      </View>

      {/* Primary actions. */}
      <View className="mt-6 flex-row items-center">
        <Pressable
          className="h-[56px] w-[56px] items-center justify-center rounded-full bg-white"
          onPress={onAddMoney}
          accessibilityLabel="Add money"
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
        >
          <Image
            source={images.addMoney}
            style={{ width: 24, height: 24 }}
            contentFit="contain"
          />
        </Pressable>

        <Pressable
          className="ml-2 h-[56px] flex-1 flex-row items-center justify-center rounded-full bg-white/15"
          onPress={onWithdraw}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <Image
            source={images.withdraw}
            style={{ width: 22, height: 22 }}
            contentFit="contain"
            tintColor="#FFFFFF"
          />
          <Text
            allowFontScaling={false}
            className="ml-2 font-semibold text-[16px] text-white"
          >
            Cash Out
          </Text>
        </Pressable>

        <Pressable
          className="ml-2 h-[56px] flex-1 flex-row items-center justify-center rounded-full bg-white/15"
          onPress={onSend}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <Image
            source={images.sendMoney}
            style={{ width: 22, height: 22 }}
            contentFit="contain"
            tintColor="#FFFFFF"
          />
          <Text
            allowFontScaling={false}
            className="ml-2 font-semibold text-[16px] text-white"
          >
            Send
          </Text>
        </Pressable>
      </View>

      {/* Get Paid — lime pill, right aligned. */}
      <View className="mt-2.5 flex-row justify-end">
        <Pressable
          className="h-[56px] flex-row items-center justify-center rounded-full bg-zeno-green px-6"
          onPress={onGetPaid}
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
        >
          <Image
            source={images.linkIcon}
            style={{ width: 24, height: 24 }}
            contentFit="contain"
          />
          <Text
            allowFontScaling={false}
            className="ml-3 font-semibold text-[16px] text-zeno-dark"
          >
            Get Paid By Link Or User
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
