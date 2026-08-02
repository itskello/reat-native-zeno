import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { formatAmount } from "@/data/currencies";
import { getTransactionType } from "@/data/transaction-types";
import type { CurrencyCode } from "@/types/content";
import type { Transaction, TransactionStatus } from "@/types/wallet";
import { Pressable, Text, View } from "react-native";

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
export function TransactionItem({
  transaction,
  currency,
  onPress,
}: TransactionItemProps) {
  const type = getTransactionType(transaction.typeId);
  const isIncoming = transaction.direction === "in";
  const sign = isIncoming ? "+" : "-";

  return (
    <Pressable
      className="h-[72px] flex-row items-center rounded-[20px] bg-white px-4 shadow-low"
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      {/* Type icon in a tinted circle. */}
      <View className="h-[44px] w-[44px] items-center justify-center rounded-full bg-zeno-blue-light">
        <ArrowIcon
          direction={isIncoming ? "down-left" : "up-right"}
          color={type.color}
          size={20}
        />
      </View>

      <View className="ml-3 flex-1">
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          className="font-semibold text-[16px] text-zeno-text-primary"
        >
          {transaction.title}
        </Text>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          className="mt-0.5 font-medium text-[14px] text-zeno-text-secondary"
        >
          {transaction.description}
        </Text>
      </View>

      <View className="ml-3 items-end">
        <Text
          allowFontScaling={false}
          className="font-semibold text-[16px] text-zeno-text-primary"
        >
          {sign}
          {formatAmount(transaction.amount, currency)}
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
}
