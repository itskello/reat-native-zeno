import { LocalizedText as Text } from "@/components/ui/LocalizedText";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { CardIcon } from "@/components/ui/ProfileIcons";
import { formatAmount } from "@/data/currencies";
import type { CurrencyCode } from "@/types/content";
import type { Transaction, TransactionStatus } from "@/types/wallet";
import { colors } from "@/theme/colors";
import { useWalletStore } from "@/store/wallet-store";
import { useLanguageStore } from "@/store/language-store";
import { concealMoney } from "@/lib/money-visibility";
import { memo } from "react";
import { Pressable, View } from "react-native";

type TransactionItemProps = {
  transaction: Transaction;
  currency: CurrencyCode;
  onPress?: () => void;
};

const STATUS_LABEL: Record<TransactionStatus, string> = {
  pending: "On the way...",
  completed: "Completed",
  failed: "Failed",
};

/**
 * A single row in the Wallet Home transactions list. The leading icon and its
 * color come from `data/transaction-types.ts` so the whole app stays visually
 * consistent per transaction type.
 */
export const TransactionItem = memo(function TransactionItem({
  transaction,
  currency,
  onPress,
}: TransactionItemProps) {
  const isBalanceHidden = useWalletStore((state) => state.isBalanceHidden);
  const language = useLanguageStore((state) => state.language);
  const localized = transaction.localized?.[language];
  const isIncoming = transaction.direction === "in";
  const isCard =
    transaction.category === "card" || transaction.typeId === "card_payment";
  const iconBg = isCard
    ? "bg-zeno-sky"
    : isIncoming
      ? "bg-emerald-50"
      : "bg-zeno-blue-light";
  const iconColor = isCard
    ? colors.zenoDark
    : isIncoming
      ? colors.success
      : colors.zenoBlue;
  const sign = isIncoming ? "+" : "-";

  return (
    <Pressable
      className="h-[72px] flex-row items-center rounded-[20px] bg-white px-4 shadow-low"
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      {/* Match the icon and color used in the full transaction history. */}
      <View className={`h-[44px] w-[44px] items-center justify-center rounded-full ${iconBg}`}>
        {isCard ? (
          <CardIcon color={iconColor} size={22} />
        ) : (
          <ArrowIcon
            direction={isIncoming ? "down-left" : "up-right"}
            color={iconColor}
            size={20}
          />
        )}
      </View>

      <View className="ml-3 flex-1">
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          className="font-semibold text-[16px] text-zeno-text-primary"
        >
          {localized?.title ?? transaction.title}
        </Text>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          className="mt-0.5 font-medium text-[14px] text-zeno-text-secondary"
        >
          {localized?.description ?? transaction.description}
        </Text>
      </View>

      <View className="ml-3 items-end">
        <Text
          allowFontScaling={false}
          className="font-semibold text-[16px] text-zeno-text-primary"
        >
          {sign}
          {concealMoney(formatAmount(transaction.amount, currency), isBalanceHidden)}
        </Text>
        <Text
          allowFontScaling={false}
          className="mt-0.5 font-medium text-[12px] text-zeno-text-secondary"
        >
          {STATUS_LABEL[transaction.status]}
        </Text>
      </View>
    </Pressable>
  );
});
