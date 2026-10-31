import { showLocalizedAlert } from "@/components/ui/LocalizedText";
import { LocalizedTextInput as TextInput } from "@/components/ui/LocalizedText";
import { LocalizedText as Text } from "@/components/ui/LocalizedText";
﻿import { Chevron } from "@/components/ui/Chevron";
import { CloseIcon } from "@/components/ui/CloseIcon";
import { images } from "@/constants/images";
import { springs } from "@/constants/motion";
import { formatAmount, getCurrency } from "@/data/currencies";
import { getFinancialTitleSegments, type FinancialTitleKey } from "@/lib/localization";
import { getProvidersForCountry } from "@/data/mobile-money-providers";
import { cardDragY } from "@/store/wallet-gesture";
import { useWalletNav } from "@/store/wallet-nav";
import { useWalletStore } from "@/store/wallet-store";
import { useLanguageStore } from "@/store/language-store";
import { useTransactionStore } from "@/store/transaction-store";
import { useSecurityStore } from "@/store/security-store";
import { withdrawalService, type WithdrawalReceipt } from "@/features/withdrawals/withdrawal-service";
import { colors } from "@/theme/colors";
import { supportedCountries } from "@/data/countries";
import type { CountryId, MobileMoneyProvider, SupportedCountry } from "@/types/content";
import * as Crypto from "expo-crypto";
import { useAuth } from "@clerk/clerk-expo";
import { Image } from "expo-image";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text as NativeText, View } from "react-native";
import { withSpring } from "react-native-reanimated";

type WithdrawSurfaceProps = {
  contentTopGap: number;
};

/** The withdrawal steps, in order. */
type WithdrawStep = "amount" | "recipient" | "confirm" | "pin" | "success";

/** Only show countries that currently have a configured withdrawal operator. */
const payoutCountries = supportedCountries.filter(
  (country) => getProvidersForCountry(country.id).length > 0,
);
const DEFAULT_PAYOUT_COUNTRY: CountryId = "benin";

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
 * The steps are internal panels rather than separate rooms: confirmation
 * and success are sheets layered over the amount panel in the design, so they
 * share this surface's header and its single island morph.
 */
export function WithdrawSurface({ contentTopGap }: WithdrawSurfaceProps) {
  const goHome = useWalletNav((s) => s.goHome);
  const wallet = useWalletStore((s) => s.wallet);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const verifyPin = useSecurityStore((s) => s.verifyPin);
  const hasPin = useSecurityStore((s) => s.hasPin);
  const { getToken, userId } = useAuth();

  const [payoutCountryId, setPayoutCountryId] = useState<CountryId>(DEFAULT_PAYOUT_COUNTRY);
  const providers = getProvidersForCountry(payoutCountryId);
  const [step, setStep] = useState<WithdrawStep>("amount");
  const [amount, setAmount] = useState("");
  const [providerId, setProviderId] = useState(providers[0]?.id);
  const [providersOpen, setProvidersOpen] = useState(true);
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<WithdrawalReceipt | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => Crypto.randomUUID());

  const provider = providers.find((p) => p.id === providerId);
  const payoutCountry = supportedCountries.find((item) => item.id === payoutCountryId);
  const currency = wallet ? getCurrency(wallet.currency) : null;
  const amountValue = Number(amount.replace(",", ".")) || 0;

  const canWithdraw = amountValue > 0 && !!wallet && amountValue <= wallet.balance && provider !== undefined;
  const canContinue = !!payoutCountry && phone.replace(/\D/g, "").length === payoutCountry.nationalNumberLength && name.trim().length > 1;

  const close = () => {
    cardDragY.value = withSpring(0, springs.liquid);
    goHome();
  };

  // The room now closes only through the dismiss/back action, leaving the
  // content free to scroll without a swipe-to-close conflict.

  const submit = async (value = pin) => {
    if (busy || value.length !== 6 || !userId || !wallet || !provider) return;
    setBusy(true);
    setError(null);
    try {
      if (!(await hasPin(userId)) || !(await verifyPin(userId, value))) {
        setPin("");
        setError("Code PIN incorrect ou non configuré. Réessaie.");
        return;
      }

      const token = await getToken();
      if (!token) {
        setPin("");
        setError("Ta session a expiré. Reconnecte-toi puis réessaie.");
        return;
      }

      const country = payoutCountry;
      if (!country) {
        setError("Le pays de retrait n’est pas configuré.");
        return;
      }

      const result = await withdrawalService.create(token, {
        countryId: payoutCountryId,
        providerId: provider.id,
        phoneNumber: `${country.dialCode}${phone.replace(/\D/g, "")}`,
        recipientName: name.trim(),
        amount: amountValue,
        currency: wallet.currency,
        pin: value,
        idempotencyKey,
      });
      if (!result.ok) {
        setPin("");
        setError(result.error);
        return;
      }

      const withdrawal = result.data.withdrawal;
      setReceipt(withdrawal);
      addTransaction({
        id: withdrawal.id,
        typeId: "withdrawal",
        category: "sent",
        title: withdrawal.recipientName,
        description: `Retrait Mobile Money · ${withdrawal.providerName || provider.name}`,
        amount: withdrawal.amount,
        totalAmount: withdrawal.totalAmount,
        fee: withdrawal.fee,
        currency: withdrawal.currency,
        direction: "out",
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
        recipientOrSender: withdrawal.recipientName,
        reference: withdrawal.reference,
        paymentMethod: withdrawal.paymentMethod,
      });
      setPin("");
      setStep("success");
    } catch {
      setPin("");
      setError("Le retrait n’a pas pu être confirmé. Vérifie l’historique avant de réessayer.");
    } finally {
      setBusy(false);
    }
  };

  const amountPanel = (
    <AmountPanel
      amount={amount}
      onAmountChange={(value) => {
        // XOF has no fractional units; USD/EUR amounts allow two decimals.
        const normalized = value.replace(/,/g, ".").replace(/[^\d.]/g, "");
        const [whole, ...fractionParts] = normalized.split(".");
        const fraction = fractionParts.join("").slice(0, wallet?.currency === "XOF" ? 0 : 2);
        setAmount(fractionParts.length ? `${whole}.${fraction}` : whole);
      }}
      amountValue={amountValue}
      currencyCode={wallet?.currency ?? "XOF"}
      payoutCountry={payoutCountry}
      countries={payoutCountries}
      countryMenuOpen={countryMenuOpen}
      onToggleCountry={() => setCountryMenuOpen((open) => !open)}
      onSelectCountry={(id) => {
        const nextProviders = getProvidersForCountry(id);
        setPayoutCountryId(id);
        setProviderId(nextProviders[0]?.id);
        setProvidersOpen(true);
        setCountryMenuOpen(false);
        setPhone("");
      }}
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
      contentContainerStyle={{ paddingTop: contentTopGap, flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1">
        {step === "amount" ? (
          <>
            <Header onDismiss={close} label="Close Withdraw Money" />
            <Title title="withdrawMoney" />
            {amountPanel}
          </>
        ) : step === "recipient" ? (
          <>
            <Header onBack={() => setStep("amount")} label="Back to amount" />
            <Title title="viaMobileMoney" />
            <RecipientPanel
              country={payoutCountry}
              phone={phone}
              onPhoneChange={setPhone}
              name={name}
              onNameChange={setName}
              onNext={() => { setError(null); setStep("confirm"); }}
              canContinue={canContinue}
            />
          </>
        ) : step === "confirm" ? (
          <>
            <Header onBack={() => setStep("recipient")} label="Back to recipient" />
            <Title title="withdrawMoney" dimmed />
            {/* The amount panel stays behind the sheet, dimmed — the design
                keeps the user's context visible while they confirm. */}
            <View className="flex-1" pointerEvents="none">
              {amountPanel}
              <View className="absolute inset-0 bg-black/45" />
            </View>

            <ConfirmSheet
              amountLabel={`${formatValue(amountValue)} ${currency?.symbol ?? ""}`}
              feeLabel="À confirmer par le serveur"
              totalLabel="À confirmer par le serveur"
              error={error}
              busy={busy}
              onConfirm={() => { setPin(""); setError(null); setStep("pin"); }}
              onEdit={() => { setIdempotencyKey(Crypto.randomUUID()); setStep("amount"); }}
              onClose={() => setStep("recipient")}
            />
          </>
        ) : step === "pin" ? (
          <>
            <Header onBack={() => { setError(null); setStep("confirm"); }} label="Back to confirmation" />
            <Title title="secureWithdrawal" />
            <PinPanel
              pin={pin}
              error={error}
              busy={busy}
              onDigit={(digit) => {
                if (busy || pin.length >= 6) return;
                const next = pin + digit;
                setPin(next);
                setError(null);
                if (next.length === 6) void submit(next);
              }}
              onDelete={() => setPin((current) => current.slice(0, -1))}
            />
          </>
        ) : (
          <>
            <Header onBack={() => setStep("amount")} label="Back to amount" />
            <SuccessPanel
              receipt={receipt}
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
      className={`h-[44px] flex-row items-center px-5 ${onBack ? "justify-start" : "justify-end"}`}
    >
      <Pressable
        onPress={onBack ?? onDismiss}
        hitSlop={14}
        accessibilityRole="button"
        accessibilityLabel={label}
        className={onBack
          ? "h-[42px] w-[42px] items-center justify-center rounded-[12px] bg-white active:opacity-70"
          : "active:opacity-60"}
      >
        {onBack ? (
          <Image
            source={images.back}
            style={{ width: 42, height: 42 }}
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
  title,
  dimmed = false,
}: {
  title: FinancialTitleKey;
  dimmed?: boolean;
}) {
  const language = useLanguageStore((state) => state.language);
  const [muted, strong] = getFinancialTitleSegments(title, language);
  return (
    <View className="mt-4 flex-row items-baseline px-8">
      <NativeText
        allowFontScaling={false}
        className={`font-semibold text-[32px] ${dimmed ? "text-white/25" : "text-white/40"}`}
      >
        {muted}{" "}
      </NativeText>
      <NativeText
        allowFontScaling={false}
        className={`font-bold text-[32px] ${dimmed ? "text-white/45" : "text-white"}`}
      >
        {strong}
      </NativeText>
    </View>
  );
}

/** Step 1 — how much, into which currency, through which operator. */
function AmountPanel({
  amount,
  onAmountChange,
  amountValue,
  currencyCode,
  payoutCountry,
  countries,
  countryMenuOpen,
  onToggleCountry,
  onSelectCountry,
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
  currencyCode: string;
  payoutCountry?: SupportedCountry;
  countries: SupportedCountry[];
  countryMenuOpen: boolean;
  onToggleCountry: () => void;
  onSelectCountry: (countryId: CountryId) => void;
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
  const receivedValue = currencyCode === "XOF" ? formatValue(amountValue) : amountValue > 0 ? "—" : "0.0";

  return (
    <View className="mt-6 flex-1 rounded-t-[26px] bg-white px-4 pt-7">
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
      <View className="h-[56px] flex-row items-center rounded-full bg-black/[0.04] px-5">
        <View className="h-full flex-1 flex-row items-center">
          <TextInput
            value={amount}
            onChangeText={onAmountChange}
            placeholder="0.0"
            placeholderTextColor="rgba(7,23,6,0.35)"
            keyboardType="decimal-pad"
            allowFontScaling={false}
            textAlignVertical="center"
            className="h-full min-w-[70px] py-0 font-semibold text-[24px] leading-[30px] text-zeno-text-primary"
            accessibilityLabel="Amount to withdraw"
          />
          <Text
            allowFontScaling={false}
            className="ml-1.5 font-bold text-[24px] leading-[30px] text-zeno-text-primary"
          >
            {currencyCode}
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

      <View className="my-5 flex-row items-center">
        <View className="h-px flex-1 bg-black/10" />
        <View className="mx-2 rounded-full bg-zeno-blue px-3 py-1.5">
          <Text allowFontScaling={false} className="text-[12px] text-white">
            {currencyCode === "XOF" ? "1 XOF = 1 XOF" : `1 ${currencyCode} = — XOF`}
          </Text>
        </View>
        <View className="h-px flex-1 bg-black/10" />
      </View>

      <Text
        allowFontScaling={false}
        className="mb-2 text-[12px] tracking-wider text-zeno-text-primary"
      >
        YOU WILL GET
      </Text>
      <Pressable
        onPress={onToggleCountry}
        accessibilityRole="button"
        accessibilityState={{ expanded: countryMenuOpen }}
        accessibilityLabel={`Payout country: ${payoutCountry?.name ?? "Select country"}`}
        className="h-[56px] flex-row items-center rounded-full bg-black/[0.04] px-5 active:opacity-70"
      >
        <Text
          allowFontScaling={false}
          className="flex-1 font-semibold text-[24px] text-zeno-text-primary/45"
        >
          {receivedValue}
        </Text>
        {payoutCountry ? <Image source={payoutCountry.flag} style={{ width: 32, height: 32, borderRadius: 16 }} contentFit="cover" /> : null}
        <Text
          allowFontScaling={false}
          className="ml-2.5 mr-2 font-bold text-[22px] text-zeno-text-primary"
        >
          {payoutCountry?.defaultCurrency ?? "XOF"}
        </Text>
        <View style={{ transform: [{ rotate: countryMenuOpen ? "180deg" : "0deg" }] }}>
          <Chevron direction="down" size={11} color={colors.zenoTextPrimary} thickness={2.6} />
        </View>
      </Pressable>
      {countryMenuOpen ? (
        <View className="mt-2 overflow-hidden rounded-[18px] bg-[#F1F2F1] p-1">
          {countries.map((country) => {
            const isSelected = country.id === payoutCountry?.id;
            return (
              <Pressable
                key={country.id}
                onPress={() => onSelectCountry(country.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                className={`min-h-[54px] flex-row items-center rounded-[14px] px-3 active:opacity-70 ${isSelected ? "bg-white" : ""}`}
              >
                <Image source={country.flag} style={{ width: 30, height: 30, borderRadius: 15 }} contentFit="cover" />
                <Text className="ml-3 flex-1 text-[15px] font-medium text-zeno-text-primary">{country.name}</Text>
                <Text className="mr-2 text-[14px] text-zeno-text-secondary">{country.defaultCurrency}</Text>
                {isSelected ? <Text className="text-[16px] font-bold text-zeno-blue">✓</Text> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View className="mt-6 self-start rounded-full bg-black/[0.04] px-5 py-3">
        <Text allowFontScaling={false} className="text-[14px] text-zeno-text-primary">
          Your Current Balance Is{" "}
          <Text className="font-bold">{balanceLabel}</Text>
        </Text>
      </View>

      <Text
        allowFontScaling={false}
        className="mb-2 mt-6 text-[15px] text-zeno-text-primary"
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

      <View className="mt-auto pb-8 pt-5">
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
      className={`h-[40px] flex-row items-center px-4 active:opacity-70 ${className}`}
    >
      {provider.logoKey ? (
        <Image
          source={images.providers[provider.logoKey]}
          style={{ width: 26, height: 26, borderRadius: 4 }}
          contentFit="contain"
        />
      ) : (
        <View className="h-[26px] w-[26px] rounded-[4px] bg-black/10" />
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
  country,
  phone,
  onPhoneChange,
  name,
  onNameChange,
  onNext,
  canContinue,
}: {
  country?: SupportedCountry;
  phone: string;
  onPhoneChange: (value: string) => void;
  name: string;
  onNameChange: (value: string) => void;
  onNext: () => void;
  canContinue: boolean;
}) {
  return (
    <View className="mt-6 flex-1 rounded-t-[26px] bg-white px-4 pt-7">
      <Field
        label="Phone Number"
        value={phone}
        onChangeText={(value) => onPhoneChange(value.replace(/\D/g, "").slice(0, country?.nationalNumberLength ?? 10))}
        placeholder={country?.phoneFormat.replace(/#/g, "0") ?? "01 00 00 00 00"}
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
          disabled={!canContinue}
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
        className="h-[48px] rounded-full bg-black/[0.04] px-6 font-semibold text-[17px] text-zeno-text-primary"
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
  error,
  busy,
}: {
  amountLabel: string;
  feeLabel: string;
  totalLabel: string;
  onConfirm: () => void;
  onEdit: () => void;
  onClose: () => void;
  error: string | null;
  busy: boolean;
}) {
  return (
    <View className="absolute inset-x-0 bottom-0 rounded-t-[30px] bg-white px-6 pb-9 pt-7">
      <SheetHeader title="Confirmation" onClose={onClose} />

      <View className="mt-6 rounded-[22px] bg-black/[0.04] px-5 py-5">
        <SummaryRow label="Amount to withdraw" value={amountLabel} />
        <SummaryRow label="Transaction fee" value={feeLabel} />
        <SummaryRow label="Total" value={totalLabel} strong />
      </View>

      {error ? <Text accessibilityRole="alert" className="mt-4 text-[14px] text-red-600">{error}</Text> : null}

      <View className="mt-8">
        <PrimaryButton label="Withdraw" onPress={onConfirm} tone="forest" busy={busy} />
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

/** The wallet's six-digit confirmation screen before a withdrawal request. */
function PinPanel({
  pin,
  error,
  busy,
  onDigit,
  onDelete,
}: {
  pin: string;
  error: string | null;
  busy: boolean;
  onDigit: (digit: string) => void;
  onDelete: () => void;
}) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];
  return (
    <View className="flex-1 px-5 pb-4">
      <Text allowFontScaling={false} className="mt-8 text-center font-semibold text-[20px] text-white">Enter your PIN</Text>
      <View className="mt-6 flex-row items-center justify-center gap-x-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <View key={index} className={`h-[9px] w-[9px] rounded-full ${index < pin.length ? "bg-zeno-green" : "bg-white/35"}`} />
        ))}
      </View>
      {error ? <Text accessibilityRole="alert" className="mt-4 text-center text-[14px] text-red-300">{error}</Text> : null}
      {busy ? <ActivityIndicator className="mt-4" color={colors.zenoGreen} /> : null}
      <View className="flex-1" />
      <View className="flex-row flex-wrap">
        {keys.map((key, index) => (
          <Pressable
            key={`${key}-${index}`}
            disabled={!key || busy}
            onPress={() => key === "back" ? onDelete() : key && onDigit(key)}
            accessibilityRole={key ? "button" : undefined}
            className="h-[58px] w-1/3 items-center justify-center active:opacity-50"
          >
            {key ? <Text allowFontScaling={false} className="text-[34px] text-white">{key === "back" ? "‹" : key}</Text> : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** Step 4 — the outcome, with the receipt sheet under it. */
function SuccessPanel({
  receipt,
  onContinue,
  onClose,
}: {
  receipt: WithdrawalReceipt | null;
  onContinue: () => void;
  onClose: () => void;
}) {
  const language = useLanguageStore((state) => state.language);
  const completed = receipt?.status === "completed";
  const pending = receipt?.status === "pending";
  const receiptDate = receipt?.createdAt
    ? new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(receipt.createdAt))
    : "—";
  return (
    <View className="flex-1">
      <View className="mt-16 items-center px-10">
        <View
          className="h-[145px] w-[145px] items-center justify-center rounded-full"
          style={{ backgroundColor: completed ? colors.success : pending ? colors.warning : colors.error }}
        >
          {completed ? (
            <CheckGlyph size={80} color={colors.zenoMint} />
          ) : pending ? (
            <Text allowFontScaling={false} className="font-bold text-[72px] text-white">…</Text>
          ) : (
            <Text allowFontScaling={false} className="font-medium text-[72px] text-white">×</Text>
          )}
        </View>
        <Text
          allowFontScaling={false}
          className="mt-9 text-center font-bold text-[30px] leading-[38px] text-white"
        >
          {completed ? "Your transaction is successful" : pending ? "Your withdrawal is pending" : "Your withdrawal failed"}
        </Text>
      </View>

      <View className="mt-auto rounded-t-[30px] bg-white px-6 pb-9 pt-7">
        <SheetHeader title="Transaction Receipt" onClose={onClose} muted />

        <View className="mt-6 rounded-[22px] bg-black/[0.04] px-5 py-5">
          <SummaryRow label="Recipient’s name" value={receipt?.recipientName ?? "—"} valueStrong />
          <SummaryRow label="Payment method" value={receipt?.paymentMethod ?? "Mobile Money"} valueStrong />
          <SummaryRow label="Transaction date" value={receiptDate} valueStrong />
          <SummaryRow label="Session ID" value={receipt?.reference ?? "—"} valueStrong />
        </View>

        <View className="mt-7">
          <PrimaryButton label="Continue" onPress={onContinue} tone="forest" />
        </View>

        <Pressable
          onPress={() => showLocalizedAlert("Report an issue", "Open Help & Support from your account to contact ZENO support.")}
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
  busy = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "forest" | "lime";
  busy?: boolean;
}) {
  const isDisabled = disabled || busy;
  const background = isDisabled
    ? "bg-black/20"
    : tone === "lime"
      ? "bg-zeno-green"
      : "bg-zeno-intro";
  const text = isDisabled
    ? "text-black/25"
    : tone === "lime"
      ? "text-zeno-text-primary"
      : "text-white";

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled }}
      className={`h-[64px] items-center justify-center rounded-full ${background} ${
        isDisabled ? "" : "active:opacity-90"
      }`}
    >
      {busy ? <ActivityIndicator color={tone === "lime" ? colors.zenoDark : "#FFFFFF"} /> : <Text allowFontScaling={false} className={`font-bold text-[22px] ${text}`}>{label}</Text>}
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

