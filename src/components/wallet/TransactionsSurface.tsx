import { ArrowIcon } from "@/components/ui/ArrowIcon";
import {
  CardIcon,
  CheckmarkIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  PendingDotIcon,
  WarningTriangleIcon,
  XMarkIcon,
} from "@/components/ui/ProfileIcons";
import { images } from "@/constants/images";
import { formatAmount } from "@/data/currencies";
import { useTransactionStore } from "@/store/transaction-store";
import { useWalletNav } from "@/store/wallet-nav";
import { colors } from "@/theme/colors";
import { router } from "expo-router";
import type { Transaction } from "@/types/wallet";
import { Image } from "expo-image";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  InteractionManager,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FilterTab = "all" | "received" | "sent" | "card";

/** Static separator — must NOT be an inline function or it remounts on every render. */
const RowSeparator = () => <View style={{ height: 1, backgroundColor: "#F3F4F6", marginHorizontal: 4 }} />;

type TransactionsSurfaceProps = {
  contentTopGap: number;
};

/**
 * Pixel-perfect Transactions Surface with full Transaction Details matching
 * exact design screenshots.
 */
export function TransactionsSurface({ contentTopGap }: TransactionsSurfaceProps) {
  const insets = useSafeAreaInsets();
  const goHome = useWalletNav((s) => s.goHome);
  const transactions = useTransactionStore((s) => s.transactions);

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  // Defer rendering the list until after the slide-in animation completes.
  // This prevents the JS thread from animating + rendering simultaneously.
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
    return () => task.cancel();
  }, []);

  const handleSetTab = useCallback((tab: FilterTab) => setActiveTab(tab), []);
  const handleSelectTx = useCallback((tx: Transaction) => setSelectedTx(tx), []);
  const handleCloseTx = useCallback(() => setSelectedTx(null), []);

  // Filter transactions based on selected pill
  const filteredTransactions = useMemo(() => {
    if (activeTab === "all") return transactions;
    if (activeTab === "received") {
      return transactions.filter(
        (t) => t.direction === "in" || t.category === "received"
      );
    }
    if (activeTab === "sent") {
      return transactions.filter(
        (t) =>
          (t.direction === "out" && t.category !== "card") ||
          t.category === "sent"
      );
    }
    if (activeTab === "card") {
      return transactions.filter(
        (t) => t.category === "card" || t.typeId === "card_payment"
      );
    }
    return transactions;
  }, [transactions, activeTab]);

  // Group filtered transactions by dateLabel — matching the reference image design
  const groupedByDate = useMemo(() => {
    const groups: { date: string; items: Transaction[] }[] = [];
    filteredTransactions.forEach((tx) => {
      const date = tx.dateLabel || "Date inconnue";
      const existing = groups.find((g) => g.date === date);
      if (existing) {
        existing.items.push(tx);
      } else {
        groups.push({ date, items: [tx] });
      }
    });
    return groups;
  }, [filteredTransactions]);

  return (
    <View
      className="flex-1 px-5"
      style={{
        paddingTop: contentTopGap,
        paddingBottom: insets.bottom + 80,
        backgroundColor: colors.zenoBackground,
      }}
    >
      {/* ── Header: Back button row (matches profile.tsx layout) ── */}
      <View className="flex-row items-center pt-2">
        <Pressable
          onPress={goHome}
          className="h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white shadow-low"
          hitSlop={12}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Image
            source={images.back}
            style={{ width: 50, height: 50 }}
            contentFit="contain"
          />
        </Pressable>
      </View>

      {/* ── Screen Title (matches profile.tsx: mt-6, 32px Bold) ── */}
      <Text
        allowFontScaling={false}
        className="mt-6 font-bold text-[32px] leading-[38px] text-zeno-text-primary"
      >
        Transactions
      </Text>

      {/* ── Filter Pills ── */}
      <View className="mt-4 mb-3 flex-row items-center gap-x-2.5">
        <FilterPill label="Tout" isActive={activeTab === "all"} onPress={handleSetTab} tabValue="all" />
        <FilterPill label="Reçu" isActive={activeTab === "received"} onPress={handleSetTab} tabValue="received" />
        <FilterPill label="Envoyé" isActive={activeTab === "sent"} onPress={handleSetTab} tabValue="sent" />
        <FilterPill label="Carte" isActive={activeTab === "card"} onPress={handleSetTab} tabValue="card" />
      </View>

      {/* ── Transaction List — grouped by date ── */}
      {!isReady ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#0057FF" />
        </View>
      ) : groupedByDate.length === 0 ? (
        <View className="mt-12 items-center justify-center py-10">
          <Text
            allowFontScaling={false}
            className="text-[16px] font-semibold text-zeno-text-secondary"
          >
            Aucune transaction dans cette catégorie
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {groupedByDate.map((group) => (
            <DateGroup
              key={group.date}
              date={group.date}
              items={group.items}
              onSelectTx={handleSelectTx}
            />
          ))}
        </ScrollView>
      )}

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <TransactionDetailModal
          transaction={selectedTx}
          onClose={handleCloseTx}
        />
      )}
    </View>
  );
}

// ─── Date Group Component ─────────────────────────────────────────────────────

/** Renders a date label + a white card containing all transactions for that date. */
const DateGroup = memo(function DateGroup({
  date,
  items,
  onSelectTx,
}: {
  date: string;
  items: Transaction[];
  onSelectTx: (tx: Transaction) => void;
}) {
  return (
    <View className="mb-5">
      {/* Date label (e.g. "Oct 28, 2026") */}
      <Text
        allowFontScaling={false}
        className="mb-2 text-[14px] font-medium text-zeno-text-secondary"
      >
        {date}
      </Text>

      {/* White card grouping all rows for this date */}
      <View className="rounded-[20px] bg-white overflow-hidden shadow-low border border-gray-100/60">
        {items.map((tx, index) => (
          <View key={tx.id}>
            <TransactionRowItem transaction={tx} onPress={onSelectTx} />
            {index < items.length - 1 && <RowSeparator />}
          </View>
        ))}
      </View>
    </View>
  );
});

// ─── Filter Pill Component ──────────────────────────────────────────────────

const FilterPill = memo(function FilterPill({
  label,
  isActive,
  onPress,
  tabValue,
}: {
  label: string;
  isActive: boolean;
  onPress: (tab: FilterTab) => void;
  tabValue: FilterTab;
}) {
  const handlePress = useCallback(() => onPress(tabValue), [onPress, tabValue]);
  return (
    <Pressable
      onPress={handlePress}
      className={`rounded-full px-5 py-2.5 items-center justify-center ${
        isActive
          ? "bg-zeno-green border border-zeno-text-primary"
          : "bg-white border border-gray-150"
      }`}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <Text
        allowFontScaling={false}
        className={`text-[15px] ${
          isActive
            ? "font-bold text-zeno-text-primary"
            : "font-semibold text-zeno-text-primary"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
});

// ─── Transaction Row Item Component ──────────────────────────────────────────

const TransactionRowItem = memo(function TransactionRowItem({
  transaction,
  onPress,
}: {
  transaction: Transaction;
  onPress: (tx: Transaction) => void;
}) {
  const handlePress = useCallback(() => onPress(transaction), [onPress, transaction]);
  const isIncoming = transaction.direction === "in";
  const isCard =
    transaction.category === "card" || transaction.typeId === "card_payment";
  const currency = transaction.currency || "USD";

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

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center h-[72px] px-1"
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
    >
      {/* Tinted Circle Icon */}
      <View
        className={`h-[44px] w-[44px] items-center justify-center rounded-full ${iconBg}`}
      >
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

      {/* Title & Description */}
      <View className="ml-3 flex-1 pr-2">
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          className="text-[15px] font-bold text-zeno-text-primary"
        >
          {transaction.title}
        </Text>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          className="mt-0.5 text-[13px] font-medium text-zeno-text-secondary"
        >
          {transaction.description}
        </Text>
      </View>

      {/* Amount & Status */}
      <View className="items-end">
        <Text
          allowFontScaling={false}
          className={`text-[15px] font-bold ${
            isIncoming ? "text-[#22C55E]" : "text-zeno-text-primary"
          }`}
        >
          {formatAmount(transaction.amount, currency)}
        </Text>
        {transaction.status === "failed" && (
          <Text
            allowFontScaling={false}
            className="mt-0.5 text-[12px] font-medium text-zeno-error"
          >
            Echec
          </Text>
        )}
        {transaction.status === "pending" && (
          <Text
            allowFontScaling={false}
            className="mt-0.5 text-[12px] font-medium text-zeno-text-secondary"
          >
            En route...
          </Text>
        )}
      </View>
    </Pressable>
  );
});

// ─── Transaction Detail Screen / Modal (Matching exact screenshots) ─────────

function TransactionDetailModal({
  transaction,
  onClose,
}: {
  transaction: Transaction;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const isIncoming = transaction.direction === "in";
  const currency = transaction.currency || "USD";

  const shortId = transaction.shortId || `${transaction.id.slice(0, 4)}...${transaction.id.slice(-4)}`;
  const timeLabel = transaction.timeLabel || `${transaction.dateLabel || "Aujourd'hui"}`;
  const partyName = transaction.recipientOrSender || transaction.title;
  const feeAmount = transaction.fee ?? 0;
  const totalAmount = transaction.totalAmount ?? (transaction.amount + feeAmount);

  const [showStatementToast, setShowStatementToast] = useState(false);
  const [isLoadingStatement, setIsLoadingStatement] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    setCopied(true);
    Alert.alert("Copié !", `ID de transaction copié: ${transaction.reference || transaction.id}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatement = () => {
    if (isLoadingStatement) return;
    setIsLoadingStatement(true);
    setTimeout(() => {
      setIsLoadingStatement(false);
      setShowStatementToast(true);
      setTimeout(() => {
        setShowStatementToast(false);
      }, 3800);
    }, 2500);
  };

  const handleReportProblem = () => {
    // Build a pre-filled message with all the transaction context
    const txId = transaction.reference || transaction.id;
    const txDate = transaction.timeLabel || transaction.dateLabel || "N/A";
    const txAmount = `${transaction.amount} ${transaction.currency || "USD"}`;
    const txBeneficiary = transaction.recipientOrSender || transaction.title;

    const prefilledMessage =
      `J'ai un problème avec une transaction :\n` +
      `ID: ${txId}\n` +
      `Date : ${txDate}\n` +
      `Montant : ${txAmount}\n` +
      `Bénéficiaire : ${txBeneficiary}`;

    // Close the transaction detail screen first, then navigate
    onClose();
    router.push({
      pathname: "/settings/support-chat",
      params: { prefillMessage: prefilledMessage },
    });
  };

  return (
    <Modal
      visible
      transparent={false}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 px-5"
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 20,
          backgroundColor: colors.zenoBackground,
        }}
      >
        {/* Floating Notification Toast Popup */}
        {showStatementToast && (
          <View
            className="absolute left-5 right-5 z-50 rounded-[22px] bg-[#071706] p-4 shadow-strong flex-row items-center"
            style={{ top: insets.top + 10 }}
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-zeno-green/20 mr-3">
              <DownloadIcon size={20} color="#C7FF4A" />
            </View>
            <View className="flex-1 pr-2">
              <Text
                allowFontScaling={false}
                className="text-[15px] font-bold text-white"
              >
                Demande en cours de traitement
              </Text>
              <Text
                allowFontScaling={false}
                className="mt-0.5 text-[13px] font-medium text-gray-300 leading-4"
              >
                Vous recevrez un e-mail avec votre relevé d'ici 2 à 5 minutes.
              </Text>
            </View>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Header Back Button */}
          <Pressable
            onPress={onClose}
            className="h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white shadow-low"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <Image
              source={images.back}
              style={{ width: 50, height: 50 }}
              contentFit="contain"
            />
          </Pressable>

          {/* Centered Large Direction Badge with Status Overlay */}
          <View className="items-center mt-6">
            <View className="relative h-[84px] w-[84px] items-center justify-center rounded-full bg-white shadow-low border border-gray-100/50">
              <ArrowIcon
                direction={isIncoming ? "down-left" : "up-right"}
                color="#0F7153"
                size={34}
              />
              {/* Overlapped Status Badge at bottom right */}
              <View className="absolute bottom-0 right-0 h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-sm"
                style={{
                  backgroundColor:
                    transaction.status === "completed"
                      ? "#071706"
                      : transaction.status === "failed"
                      ? "#EF4444"
                      : "#F59E0B",
                }}
              >
                {transaction.status === "completed" ? (
                  <CheckmarkIcon size={13} color="#FFFFFF" />
                ) : transaction.status === "failed" ? (
                  <XMarkIcon size={13} color="#FFFFFF" />
                ) : (
                  <PendingDotIcon size={8} color="#FFFFFF" />
                )}
              </View>
            </View>

            {/* Large Amount Display (e.g. 0.03 $, 18.58 $, 33.5 $) */}
            <Text
              allowFontScaling={false}
              className="mt-4 text-[38px] font-bold text-zeno-text-primary tracking-tight"
            >
              {transaction.amount} $
            </Text>
          </View>

          {/* Card 1: Main Transaction Details Container */}
          <View className="mt-6 rounded-[24px] bg-white p-5 shadow-low border border-gray-100/60">
            {/* Status Row */}
            <View className="flex-row items-center justify-between mb-4">
              <Text
                allowFontScaling={false}
                className="text-[15px] font-medium text-zeno-text-secondary"
              >
                Status
              </Text>
              <View
                className={`rounded-full px-3.5 py-1 ${
                  transaction.status === "completed"
                    ? "bg-[#E6F8F0]"
                    : transaction.status === "failed"
                    ? "bg-red-50"
                    : "bg-amber-50"
                }`}
              >
                <Text
                  allowFontScaling={false}
                  className={`text-[13px] font-bold ${
                    transaction.status === "completed"
                      ? "text-[#0F7153]"
                      : transaction.status === "failed"
                      ? "text-red-600"
                      : "text-amber-700"
                  }`}
                >
                  {transaction.status === "completed"
                    ? "Succès"
                    : transaction.status === "failed"
                    ? "Echec"
                    : "En traitement..."}
                </Text>
              </View>
            </View>

            {/* ID Row with Copy Icon */}
            <View className="flex-row items-center justify-between mb-4">
              <Text
                allowFontScaling={false}
                className="text-[15px] font-medium text-zeno-text-secondary"
              >
                ID
              </Text>
              <Pressable
                onPress={handleCopyId}
                className="flex-row items-center gap-x-2"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text
                  allowFontScaling={false}
                  className="text-[15px] font-bold text-zeno-text-primary"
                >
                  {shortId}
                </Text>
                <View className="h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                  <CopyIcon size={16} color="#071706" />
                </View>
              </Pressable>
            </View>

            {/* Date Row */}
            <View className="flex-row items-center justify-between mb-4">
              <Text
                allowFontScaling={false}
                className="text-[15px] font-medium text-zeno-text-secondary"
              >
                Date
              </Text>
              <Text
                allowFontScaling={false}
                className="text-[15px] font-bold text-zeno-text-primary"
              >
                {timeLabel}
              </Text>
            </View>

            {/* Sent to / Reçu de Row */}
            <View className="flex-row items-start justify-between mb-3">
              <Text
                allowFontScaling={false}
                className="text-[15px] font-medium text-zeno-text-secondary"
              >
                {isIncoming ? "Reçu de" : "Sent to"}
              </Text>
              <Text
                allowFontScaling={false}
                className="text-[15px] font-bold text-zeno-text-primary text-right flex-1 ml-4"
                numberOfLines={2}
              >
                {partyName}
              </Text>
            </View>

            {/* Optional FX Currency Rows (e.g. Image 5: Montant envoyé en XOF, Taux de change) */}
            {transaction.sentAmountXof !== undefined && (
              <>
                <View className="flex-row items-center justify-between mb-3">
                  <Text
                    allowFontScaling={false}
                    className="text-[15px] font-medium text-zeno-text-secondary"
                  >
                    Montant envoyé en XOF
                  </Text>
                  <Text
                    allowFontScaling={false}
                    className="text-[15px] font-bold text-zeno-text-primary"
                  >
                    {transaction.sentAmountXof} XOF
                  </Text>
                </View>

                {transaction.exchangeRate && (
                  <View className="flex-row items-center justify-between mb-3">
                    <Text
                      allowFontScaling={false}
                      className="text-[15px] font-medium text-zeno-text-secondary"
                    >
                      Taux de change
                    </Text>
                    <Text
                      allowFontScaling={false}
                      className="text-[15px] font-bold text-zeno-text-primary"
                    >
                      {transaction.exchangeRate}
                    </Text>
                  </View>
                )}

                <View className="flex-row items-center justify-between mb-3">
                  <Text
                    allowFontScaling={false}
                    className="text-[15px] font-medium text-zeno-text-secondary"
                  >
                    Montant reçu en USD
                  </Text>
                  <Text
                    allowFontScaling={false}
                    className="text-[15px] font-bold text-zeno-text-primary"
                  >
                    {transaction.amount} USD
                  </Text>
                </View>
              </>
            )}

            {/* Dotted Separator Line */}
            <View className="my-2.5 border-b border-dashed border-gray-200" />

            {/* Frais de transaction Row */}
            <View className="flex-row items-center justify-between mb-3 mt-1">
              <Text
                allowFontScaling={false}
                className="text-[15px] font-medium text-zeno-text-secondary"
              >
                Frais de transaction
              </Text>
              <Text
                allowFontScaling={false}
                className="text-[15px] font-bold text-zeno-text-primary"
              >
                {formatAmount(feeAmount, currency)}
              </Text>
            </View>

            {/* Montant débité / Montant crédité Row */}
            <View className="flex-row items-center justify-between">
              <Text
                allowFontScaling={false}
                className="text-[15px] font-medium text-zeno-text-secondary"
              >
                {isIncoming ? "Montant crédité" : "Montant débité"}
              </Text>
              <Text
                allowFontScaling={false}
                className="text-[15px] font-bold text-zeno-text-primary"
              >
                {formatAmount(totalAmount, currency)}
              </Text>
            </View>
          </View>

          {/* Card 2: Note Container (If note or reference details present) */}
          {transaction.note && (
            <View className="rounded-[24px] bg-white p-5 shadow-low border border-gray-100/60 mb-4">
              <Text
                allowFontScaling={false}
                className="text-[14px] font-semibold text-zeno-text-secondary mb-2"
              >
                Note
              </Text>
              <Text
                allowFontScaling={false}
                className="text-[15px] font-bold text-zeno-text-primary leading-6"
              >
                {transaction.note}
              </Text>
            </View>
          )}

          {/* Action Button 1: Demander un relevé */}
          <Pressable
            onPress={handleStatement}
            disabled={isLoadingStatement}
            className="mb-3 flex-row items-center justify-between rounded-[24px] bg-white px-5 py-4 shadow-low border border-gray-100/60"
            style={({ pressed }) => ({ opacity: pressed || isLoadingStatement ? 0.75 : 1 })}
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              {isLoadingStatement ? (
                <ActivityIndicator size="small" color="#071706" />
              ) : (
                <DownloadIcon size={20} color="#071706" />
              )}
            </View>
            <Text
              allowFontScaling={false}
              className="ml-3.5 flex-1 text-[16px] font-bold text-zeno-text-primary"
            >
              {isLoadingStatement ? "Chargement en cours..." : "Demander un relevé"}
            </Text>
            <ChevronRightIcon size={20} color="#071706" />
          </Pressable>

          {/* Action Button 2: Signaler un problème */}
          <Pressable
            onPress={handleReportProblem}
            className="flex-row items-center justify-between rounded-[24px] bg-white px-5 py-4 shadow-low border border-gray-100/60"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-red-50">
              <WarningTriangleIcon size={20} color="#EF4444" />
            </View>
            <Text
              allowFontScaling={false}
              className="ml-3.5 flex-1 text-[16px] font-bold text-zeno-error"
            >
              Signaler un problème
            </Text>
            <ChevronRightIcon size={20} color="#EF4444" />
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

