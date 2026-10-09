import { Chevron } from "@/components/ui/Chevron";
import { CloseIcon } from "@/components/ui/CloseIcon";
import { images } from "@/constants/images";
import { springs } from "@/constants/motion";
import { formatAmount, getCurrency } from "@/data/currencies";
import { getProvidersForCountry } from "@/data/mobile-money-providers";
import { cardDragY } from "@/store/wallet-gesture";
import { useWalletNav } from "@/store/wallet-nav";
import { useWalletStore } from "@/store/wallet-store";
import { colors } from "@/theme/colors";
import type { MobileMoneyProvider } from "@/types/content";
import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { withSpring } from "react-native-reanimated";

type WithdrawSurfaceProps = {
  contentTopGap: number;
};

/** The four panels of the withdrawal, in order. */
type WithdrawStep = "amount" | "recipient" | "confirm" | "success";

/**
 * Payout market. Hard-coded to Benin until the account's country is available
 * from the profile — swapping this line is all it takes to serve another market.
 */
const PAYOUT_COUNTRY = "benin" as const;

/**
 * Withdraw Money surface (WITHDRAW room).
 *
 * Rendered inside the Dynamic Island's `islande model`, like ZENO Card, Send
 * Money and Get Paid, so the room shares the one island-scale morph instead of
 * getting its own transition. Consequences for this file:
 *
 * - the layout is authored at full-screen size and anchored top-left, because
 *   the island scales it up from its own top-left corner;
 * - it paints no background — the island's liquid shape is the dark hero, and
 *   an opaque rect here would cover the siphon neck with a hard edge;
 * - only the top ~80px (the header) must stay legible throughout the morph.
 *
 * The four panels are internal steps rather than separate rooms: confirmation
 * and success are sheets layered over the amount panel in the design, so they
 * share this surface's header and its single island morph.
 */
export function WithdrawSurface({ contentTopGap }: WithdrawSurfaceProps) {
  const goHome = useWalletNav((s) => s.goHome);
  const wallet = useWalletStore((s) => s.wallet);

  const providers = getProvidersForCountry(PAYOUT_COUNTRY);
  const [step, setStep] = useState<WithdrawStep>("amount");
  const [amount, setAmount] = useState("");
  const [providerId, setProviderId] = useState(providers[0]?.id);
  const [providersOpen, setProvidersOpen] = useState(true);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");

  const provider = providers.find((p) => p.id === providerId);
  const currency = wallet ? getCurrency(wallet.currency) : null;
  const amountValue = Number(amount.replace(",", ".")) || 0;

  const canWithdraw = amountValue > 0 && provider !== undefined;

  const close = () => {
    cardDragY.value = withSpring(0, springs.liquid);
    goHome();
  };

  // The room now closes only through the dismiss/back action, leaving the
  // content free to scroll without a swipe-to-close conflict.

  // TODO: submit the withdrawal to the backend (validate, debit, call the
  // Mobile Money adapter) and only advance on its response. The client shows
  // the outcome, it never decides it.
  const submit = () => setStep("success");

  const amountPanel = (
    <AmountPanel
      amount={amount}
      onAmountChange={setAmount}
      amountValue={amountValue}
      currencySymbol={currency?.symbol ?? ""}
      balanceLabel={
        wallet ? formatAmount(wallet.balance, wallet.currency) : "—"
      }
      providers={providers}
      providerId={providerId}
      providersOpen={providersOpen}
      onToggleProviders={() => setProvidersOpen((open) => !open)}
      onSelectProvider={(id) => {
        setProviderId(id);
        setProvidersOpen(false);
      }}
      canWithdraw={canWithdraw}
      onWithdraw={() => setStep("recipient")}
    />
  );

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingTop: contentTopGap, paddingBottom: 36 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1">
        {step === "amount" ? (
          <>
            <Header onDismiss={close} label="Close Withdraw Money" />
            <Title muted="Withdraw" strong="Money" />
            {amountPanel}
          </>
        ) : step === "recipient" ? (
          <>
            <Header onBack={() => setStep("amount")} label="Back to amount" />
            <Title muted="By" strong="Mobile Money" />
            <RecipientPanel
              phone={phone}
              onPhoneChange={setPhone}
              name={name}
              onNameChange={setName}
              onNext={() => setStep("confirm")}
            />
          </>
        ) : step === "confirm" ? (
          <>
            <Header onBack={() => setStep("recipient")} label="Back to recipient" />
            <Title muted="Withdraw" strong="Money" dimmed />
            {/* The amount panel stays behind the sheet, dimmed — the design
                keeps the user's context visible while they confirm. */}
            <View className="flex-1" pointerEvents="none">
              {amountPanel}
              <View className="absolute inset-0 bg-black/45" />
            </View>

            <ConfirmSheet
              amountLabel={`${formatValue(amountValue)} ${currency?.symbol ?? ""}`}
              feeLabel={`0 ${currency?.symbol ?? ""}`}
              totalLabel={`${formatValue(amountValue)} ${currency?.symbol ?? ""}`}
              onConfirm={submit}
              onEdit={() => setStep("amount")}
              onClose={() => setStep("recipient")}
            />
          </>
        ) : (
          <>
            <Header onBack={() => setStep("amount")} label="Back to amount" />
            <SuccessPanel
              providerName={provider?.name ?? ""}
              onContinue={close}
              onClose={close}
            />
          </>
        )}
      </View>
    </ScrollView>
  );
}

/** Header row — a dismiss cross on the right, or the back button on the left. */
function Header({
  onDismiss,
  onBack,
  label,
}: {
  onDismiss?: () => void;
  onBack?: () => void;
  label: string;
}) {
  return (
    <View
      className={`h-[38px] flex-row px-8 ${onBack ? "justify-start" : "justify-end"}`}
    >
      <Pressable
        onPress={onBack ?? onDismiss}
        hitSlop={14}
        accessibilityRole="button"
        accessibilityLabel={label}
        className="active:opacity-60"
      >
        {onBack ? (
          <Image
            source={images.back}
            style={{ width: 38, height: 38 }}
            contentFit="contain"
          />
        ) : (
          <CloseIcon size={26} color="rgba(255,255,255,0.45)" />
        )}
      </Pressable>
    </View>
  );
}

/** First word muted, rest emphasised — the locked island typography. */
function Title({
  muted,
  strong,
  dimmed = false,
}: {
  muted: string;
  strong: string;
  dimmed?: boolean;
}) {
  return (
    <View className="mt-4 flex-row items-baseline px-8">
      <Text
        allowFontScaling={false}
        className={`font-semibold text-[32px] ${dimmed ? "text-white/25" : "text-white/40"}`}
      >
        {muted}{" "}
      </Text>
      <Text
        allowFontScaling={false}
        className={`font-bold text-[32px] ${dimmed ? "text-white/45" : "text-white"}`}
      >
        {strong}
      </Text>
    </View>
  );
}

/** Step 1 — how much, into which currency, through which operator. */
function AmountPanel({
  amount,
  onAmountChange,
  amountValue,
  currencySymbol,
  balanceLabel,
  providers,
  providerId,
  providersOpen,
  onToggleProviders,
  onSelectProvider,
  canWithdraw,
  onWithdraw,
}: {
  amount: string;
  onAmountChange: (value: string) => void;
  amountValue: number;
  currencySymbol: string;
  balanceLabel: string;
  providers: MobileMoneyProvider[];
  providerId?: string;
  providersOpen: boolean;
  onToggleProviders: () => void;
  onSelectProvider: (id: MobileMoneyProvider["id"]) => void;
  canWithdraw: boolean;
  onWithdraw: () => void;
}) {
  const selected = providers.find((p) => p.id === providerId);
  const rest = providers.filter((p) => p.id !== providerId);

  return (
    <View className="mt-6 flex-1 rounded-t-[26px] bg-white px-6 pt-7">
      <Text
        allowFontScaling={false}
        className="text-[17px] text-zeno-text-primary"
      >
        How Much Do You Want To Withdraw
      </Text>

      <Text
        allowFontScaling={false}
        className="mb-2 mt-6 text-[13px] text-zeno-text-primary"
      >
        Amount
      </Text>
      <View className="h-[62px] flex-row items-center rounded-full bg-black/[0.04] px-6">
        <View className="flex-1 flex-row items-baseline">
          <TextInput
            value={amount}
            onChangeText={onAmountChange}
            placeholder="0.0"
            placeholderTextColor="rgba(7,23,6,0.35)"
            keyboardType="decimal-pad"
            allowFontScaling={false}
            className="min-w-[70px] font-semibold text-[24px] text-zeno-text-primary"
            accessibilityLabel="Amount to withdraw"
          />
          <Text
            allowFontScaling={false}
            className="ml-1.5 font-bold text-[24px] text-zeno-text-primary"
          >
            {currencySymbol}
          </Text>
        </View>

        <Text allowFontScaling={false} className="text-[16px] text-zeno-text-secondary">
          From{" "}
        </Text>
        <Triangle color={colors.zenoBlue} />
        <Text
          allowFontScaling={false}
          className="ml-1.5 font-bold text-[16px] text-zeno-blue"
        >
          Wallet
        </Text>
      </View>

      {/* Hairline separating the two amount fields. Both markets pay out in
          the wallet's own currency, so the design's FX badge has nothing to
          quote yet — it returns when the backend supplies a real rate (the
          client must never compute one itself). */}
      <View className="my-6 h-px bg-black/10" />

      <Text
        allowFontScaling={false}
        className="mb-2 text-[12px] tracking-wider text-zeno-text-primary"
      >
        YOU WILL GET
      </Text>
      <View className="h-[62px] flex-row items-center rounded-full bg-black/[0.04] px-6">
        <Text
          allowFontScaling={false}
          className="flex-1 font-semibold text-[24px] text-zeno-text-primary/45"
        >
          {formatValue(amountValue)}
        </Text>
        <Image
          source={images.flags.benin}
          style={{ width: 32, height: 32, borderRadius: 16 }}
          contentFit="cover"
        />
        <Text
          allowFontScaling={false}
          className="ml-2.5 mr-2 font-bold text-[22px] text-zeno-text-primary"
        >
          {currencySymbol}
        </Text>
        <Chevron direction="down" size={11} color={colors.zenoTextPrimary} thickness={2.6} />
      </View>

      <View className="mt-6 self-start rounded-full bg-black/[0.04] px-5 py-3">
        <Text allowFontScaling={false} className="text-[14px] text-zeno-text-primary">
          Your Current Balance Is{" "}
          <Text className="font-bold">{balanceLabel}</Text>
        </Text>
      </View>

      <Text
        allowFontScaling={false}
        className="mb-3 mt-7 text-[17px] text-zeno-text-primary"
      >
        Reception Method
      </Text>

      {/* Accordion: the chosen operator sits on top, the alternatives drop
          out of a slightly darker panel behind it. */}
      <View className="rounded-[22px] bg-black/[0.07]">
        {selected ? (
          <ProviderRow
            provider={selected}
            onPress={onToggleProviders}
            trailing={<Triangle color={colors.zenoTextPrimary} up={providersOpen} />}
            className="rounded-[22px] bg-black/[0.02]"
          />
        ) : null}

        {providersOpen
          ? rest.map((item) => (
              <ProviderRow
                key={item.id}
                provider={item}
                onPress={() => onSelectProvider(item.id)}
              />
            ))
          : null}
      </View>

      <View className="mt-auto pb-9 pt-6">
        <PrimaryButton
          label="Withdraw"
          onPress={onWithdraw}
          disabled={!canWithdraw}
        />
      </View>
    </View>
  );
}

/** One operator: brand mark, name, optional trailing caret. */
function ProviderRow({
  provider,
  onPress,
  trailing,
  className = "",
}: {
  provider: MobileMoneyProvider;
  onPress: () => void;
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={provider.name}
      className={`h-[64px] flex-row items-center px-4 active:opacity-70 ${className}`}
    >
      {provider.logoKey ? (
        <Image
          source={images.providers[provider.logoKey]}
          style={{ width: 38, height: 38, borderRadius: 6 }}
          contentFit="contain"
        />
      ) : (
        <View className="h-[38px] w-[38px] rounded-[6px] bg-black/10" />
      )}
      <Text
        allowFontScaling={false}
        className="ml-4 flex-1 text-[17px] text-zeno-text-primary"
      >
        {provider.name}
      </Text>
      {trailing}
    </Pressable>
  );
}

/** Step 2 — who receives the payout. */
function RecipientPanel({
  phone,
  onPhoneChange,
  name,
  onNameChange,
  onNext,
}: {
  phone: string;
  onPhoneChange: (value: string) => void;
  name: string;
  onNameChange: (value: string) => void;
  onNext: () => void;
}) {
  return (
    <View className="mt-6 flex-1 rounded-t-[26px] bg-white px-6 pt-8">
      <Field
        label="Phone Number"
        value={phone}
        onChangeText={onPhoneChange}
        placeholder="01 00 00 00 00"
        keyboardType="phone-pad"
      />
      <Field
        label="Name"
        value={name}
        onChangeText={onNameChange}
        placeholder="Olala"
      />

      <View className="mt-auto pb-9">
        <PrimaryButton
          label="Next"
          onPress={onNext}
          disabled={phone.trim().length === 0}
          tone="lime"
        />
      </View>
    </View>
  );
}

/** Labelled pill input — the only field shape used on this surface. */
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "phone-pad";
}) {
  return (
    <View className="mb-5">
      <Text
        allowFontScaling={false}
        className="mb-2.5 text-[16px] text-zeno-text-primary"
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(7,23,6,0.4)"
        keyboardType={keyboardType}
        allowFontScaling={false}
        accessibilityLabel={label}
        className="h-[62px] rounded-full bg-black/[0.04] px-6 font-semibold text-[17px] text-zeno-text-primary"
      />
    </View>
  );
}

/** Step 3 — the confirmation sheet over the dimmed amount panel. */
function ConfirmSheet({
  amountLabel,
  feeLabel,
  totalLabel,
  onConfirm,
  onEdit,
  onClose,
}: {
  amountLabel: string;
  feeLabel: string;
  totalLabel: string;
  onConfirm: () => void;
  onEdit: () => void;
  onClose: () => void;
}) {
  return (
    <View className="absolute inset-x-0 bottom-0 rounded-t-[30px] bg-white px-6 pb-9 pt-7">
      <SheetHeader title="Confirmation" onClose={onClose} />

      <View className="mt-6 rounded-[22px] bg-black/[0.04] px-5 py-5">
        <SummaryRow label="Amount to withdraw" value={amountLabel} />
        <SummaryRow label="Transaction fee" value={feeLabel} />
        <SummaryRow label="Total" value={totalLabel} strong />
      </View>

      <View className="mt-8">
        <PrimaryButton label="Withdraw" onPress={onConfirm} tone="forest" />
      </View>

      <Pressable
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel="Edit withdrawal"
        className="mt-5 self-center active:opacity-60"
      >
        <Text
          allowFontScaling={false}
          className="font-bold text-[17px] text-zeno-text-primary"
        >
          Edit
        </Text>
      </Pressable>
    </View>
  );
}

/** Step 4 — the outcome, with the receipt sheet under it. */
function SuccessPanel({
  providerName,
  onContinue,
  onClose,
}: {
  providerName: string;
  onContinue: () => void;
  onClose: () => void;
}) {
  return (
    <View className="flex-1">
      <View className="mt-16 items-center px-10">
        <View
          className="h-[145px] w-[145px] items-center justify-center rounded-full"
          style={{ backgroundColor: colors.success }}
        >
          <CheckGlyph size={80} color={colors.zenoMint} />
        </View>
        <Text
          allowFontScaling={false}
          className="mt-9 text-center font-bold text-[30px] leading-[38px] text-white"
        >
          Your withdrawal was successful
        </Text>
      </View>

      <View className="mt-auto rounded-t-[30px] bg-white px-6 pb-9 pt-7">
        <SheetHeader title="Transaction Receipt" onClose={onClose} muted />

        {/* PLACEHOLDER receipt — these values come from the backend's
            withdrawal response once the Mobile Money adapter is wired. */}
        <View className="mt-6 rounded-[22px] bg-black/[0.04] px-5 py-5">
          <SummaryRow label="Method" value={providerName} valueStrong />
          <SummaryRow label="Payment method" value="Withdraw" valueStrong />
          <SummaryRow label="Transaction date" value="—" valueStrong />
          <SummaryRow label="Session ID" value="—" valueStrong />
        </View>

        <View className="mt-7">
          <PrimaryButton label="Continue" onPress={onContinue} tone="forest" />
        </View>

        <Pressable
          onPress={() => {}}
          accessibilityRole="button"
          accessibilityLabel="Report an issue"
          className="mt-5 self-center active:opacity-60"
        >
          <Text
            allowFontScaling={false}
            className="text-[17px] text-zeno-text-primary"
          >
            Report Issue
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Sheet title with its circled dismiss control. */
function SheetHeader({
  title,
  onClose,
  muted = false,
}: {
  title: string;
  onClose: () => void;
  muted?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text
        allowFontScaling={false}
        className="font-bold text-[26px] text-zeno-intro"
      >
        {title}
      </Text>
      <Pressable
        onPress={onClose}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={`Close ${title}`}
        className="active:opacity-60"
      >
        <Image
          source={muted ? images.closeCircleGray : images.closeCircleBlack}
          style={{ width: 42, height: 42 }}
          contentFit="contain"
        />
      </Pressable>
    </View>
  );
}

/** One label/value line inside a summary or receipt card. */
function SummaryRow({
  label,
  value,
  strong = false,
  valueStrong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  valueStrong?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text
        allowFontScaling={false}
        className={`text-[16px] ${
          strong ? "font-bold text-zeno-text-primary" : "text-zeno-text-secondary"
        }`}
      >
        {label}
      </Text>
      <Text
        allowFontScaling={false}
        className={`text-[16px] text-zeno-text-primary ${
          strong || valueStrong ? "font-bold" : ""
        }`}
      >
        {value}
      </Text>
    </View>
  );
}

/** The single full-width pill button shape used on every step. */
function PrimaryButton({
  label,
  onPress,
  disabled = false,
  tone = "forest",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "forest" | "lime";
}) {
  const background = disabled
    ? "bg-black/20"
    : tone === "lime"
      ? "bg-zeno-green"
      : "bg-zeno-intro";
  const text = disabled
    ? "text-black/25"
    : tone === "lime"
      ? "text-zeno-text-primary"
      : "text-white";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      className={`h-[64px] items-center justify-center rounded-full ${background} ${
        disabled ? "" : "active:opacity-90"
      }`}
    >
      <Text allowFontScaling={false} className={`font-bold text-[22px] ${text}`}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Small solid caret — the accordion and the "From" selector both use it. */
function Triangle({ color, up = false }: { color: string; up?: boolean }) {
  return (
    <View
      style={{
        width: 0,
        height: 0,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: up ? 0 : 8,
        borderBottomWidth: up ? 8 : 0,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderTopColor: up ? "transparent" : color,
        borderBottomColor: up ? color : "transparent",
      }}
    />
  );
}

/** A tick built from two bars — the project's hand-drawn icon convention. */
function CheckGlyph({ size, color }: { size: number; color: string }) {
  const thickness = size * 0.19;

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          position: "absolute",
          left: size * 0.04,
          top: size * 0.56,
          width: size * 0.42,
          height: thickness,
          backgroundColor: color,
          transform: [{ rotate: "45deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          left: size * 0.28,
          top: size * 0.4,
          width: size * 0.76,
          height: thickness,
          backgroundColor: color,
          transform: [{ rotate: "-45deg" }],
        }}
      />
    </View>
  );
}

/** Display helper for the two amount fields — the design shows one decimal. */
function formatValue(value: number) {
  return value.toFixed(1);
}
