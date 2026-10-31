import { LocalizedTextInput as TextInput } from "@/components/ui/LocalizedText";
import { LocalizedText as Text } from "@/components/ui/LocalizedText";
import {Chevron } from "@/components/ui/Chevron";
import { CloseIcon } from "@/components/ui/CloseIcon";
import { ZenoIcon } from "@/components/ui/ZenoIcon";
import { images } from "@/constants/images";
import { springs } from "@/constants/motion";
import { getProvidersForCountry } from "@/data/mobile-money-providers";
import { formatAmount } from "@/data/currencies";
import { getFinancialTitleSegments, type FinancialTitleKey } from "@/lib/localization";
import { addMoneyService, type AddMoneyReceipt, type AddMoneySender } from "@/features/mobile-money/add-money-service";
import { convertWalletAmountToXof, estimateDepositWalletAmount, formatWalletAmountInput, getDepositPreviewRateLabel } from "@/features/mobile-money/deposit-conversion";
import type { AddMoneyCountry } from "@/features/mobile-money/add-money-service";
import { supportedCountries } from "@/data/countries";
import { cardDragY } from "@/store/wallet-gesture";
import { useTransactionStore } from "@/store/transaction-store";
import { useWalletNav } from "@/store/wallet-nav";
import { useWalletStore } from "@/store/wallet-store";
import { useLanguageStore } from "@/store/language-store";
import { colors } from "@/theme/colors";
import type { CurrencyCode, MobileMoneyProvider, SupportedCountry } from "@/types/content";
import { useAuth } from "@clerk/clerk-expo";
import { useUser } from "@clerk/clerk-expo";
import * as Crypto from "expo-crypto";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text as NativeText, View} from "react-native";
import { withSpring } from "react-native-reanimated";

type AddMoneySurfaceProps = { contentTopGap: number };
type AddMoneyStep = "amount" | "sender" | "review" | "result";
type SenderTab = "saved" | "new";

const ADD_MONEY_COUNTRIES = supportedCountries.filter(
  (country) => country.id === "benin" || country.id === "cote-divoire"
);
const ACCOUNT_PHONE_SENDER_ID = "account-phone";

/** Add Money is one Wallet room; each step replaces the content in the island block. */
export function AddMoneySurface({ contentTopGap }: AddMoneySurfaceProps) {
  const goHome = useWalletNav((state) => state.goHome);
  const wallet = useWalletStore((state) => state.wallet);
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const { getToken, userId } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const appliedAccountCountry = useRef(false);

  const [step, setStep] = useState<AddMoneyStep>("amount");
  const [senderTab, setSenderTab] = useState<SenderTab>("saved");
  const [countryId, setCountryId] = useState<AddMoneyCountry>("cote-divoire");
  const [amount, setAmount] = useState("");
  const [walletAmountInput, setWalletAmountInput] = useState("");
  const [lastEditedAmount, setLastEditedAmount] = useState<"xof" | "wallet">("xof");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [providerId, setProviderId] = useState<string | null>(null);
  const [providerMenuOpen, setProviderMenuOpen] = useState(false);
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [senders, setSenders] = useState<AddMoneySender[]>([]);
  const [accountPhoneSelected, setAccountPhoneSelected] = useState(false);
  const [sendersLoading, setSendersLoading] = useState(false);
  const [sendersLoaded, setSendersLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savingSender, setSavingSender] = useState(false);
  const [receipt, setReceipt] = useState<AddMoneyReceipt | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => Crypto.randomUUID());

  useEffect(() => {
    if (!isUserLoaded || appliedAccountCountry.current) return;
    appliedAccountCountry.current = true;

    const metadataCountry = user?.unsafeMetadata?.countryId;
    const phone = user?.unsafeMetadata?.phoneNumber;
    const phoneCountry = supportedCountries.find((item) =>
      typeof phone === "string" && phone.startsWith(item.dialCode)
    )?.id;
    const preferredCountry = isAddMoneyCountry(metadataCountry)
      ? metadataCountry
      : isAddMoneyCountry(phoneCountry)
        ? phoneCountry
        : "cote-divoire";

    setCountryId(preferredCountry);
    setProviderId(getProvidersForCountry(preferredCountry)[0]?.id ?? null);
  }, [isUserLoaded, user]);

  const currencyCode = wallet?.currency ?? "XOF";
  const country = supportedCountries.find((item) => item.id === countryId) ?? ADD_MONEY_COUNTRIES[0];
  const providers = getProvidersForCountry(countryId);
  const amountXof = Number(amount.replace(",", ".")) || 0;
  const walletAmountEstimate = estimateDepositWalletAmount(amountXof, currencyCode);
  const walletAmountDisplay = lastEditedAmount === "wallet" && walletAmountInput !== ""
    ? walletAmountInput
    : formatWalletAmountInput(walletAmountEstimate, currencyCode);
  const provider = providers.find((item) => item.id === providerId);
  const canContinueAmount = amountXof > 0;
  const canContinueSender = phoneNumber.replace(/\D/g, "").length === country.nationalNumberLength && !!provider;
  const filteredSenders = senders.filter((sender) =>
    `${sender.name ?? ""} ${sender.phoneNumber} ${sender.providerName}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  const selectCountry = (nextCountry: AddMoneyCountry) => {
    setAccountPhoneSelected(false);
    setCountryId(nextCountry);
    setPhoneNumber("");
    setProviderId(getProvidersForCountry(nextCountry)[0]?.id ?? null);
    setCountryMenuOpen(false);
    setProviderMenuOpen(false);
  };

  const close = () => {
    cardDragY.value = withSpring(0, springs.liquid);
    goHome();
  };

  const handleXofAmountChange = (value: string) => {
    const nextAmount = value.replace(/\D/g, "").slice(0, 12);
    const nextAmountXof = Number(nextAmount) || 0;
    setAmount(nextAmount);
    setWalletAmountInput(formatWalletAmountInput(
      estimateDepositWalletAmount(nextAmountXof, currencyCode),
      currencyCode,
    ));
    setLastEditedAmount("xof");
  };

  const handleWalletAmountChange = (value: string) => {
    const normalized = value.replace(/,/g, ".").replace(/[^\d.]/g, "");
    const [whole = "", ...fractionParts] = normalized.split(".");
    const nextAmount = currencyCode === "XOF"
      ? whole.slice(0, 12)
      : `${whole.slice(0, 12)}${fractionParts.length ? `.${fractionParts.join("").slice(0, 2)}` : ""}`;
    const parsedAmount = Number(nextAmount) || 0;
    setWalletAmountInput(nextAmount);
    setAmount(String(convertWalletAmountToXof(parsedAmount, currencyCode)));
    setLastEditedAmount("wallet");
  };

  const loadSenders = async () => {
    if (sendersLoaded || sendersLoading) return;
    setSendersLoading(true);
    const accountSender = getAccountPhoneSender(user?.unsafeMetadata);
    if (accountSender) setSenders((current) => mergeSenderLists([accountSender], current));
    try {
      const token = await getToken();
      if (!token) {
        setError("Ta session a expiré. Reconnecte-toi puis réessaie.");
        return;
      }
      if (!userId) return;
      const result = await addMoneyService.listSenders(token, userId);
      if (result.ok) {
        setSenders(mergeSenderLists(
          accountSender ? [accountSender] : [],
          result.data.senders.filter(isSender)
        ));
      }
    } catch {
      if (!accountSender) setSenders([]);
    } finally {
      setSendersLoaded(true);
      setSendersLoading(false);
    }
  };

  const openSenders = () => {
    setError(null);
    setStep("sender");
    void loadSenders();
  };

  const continueFromSender = async () => {
    setError(null);
    if (senderTab === "saved") {
      setStep("review");
      return;
    }
    if (!provider || !canContinueSender || savingSender) return;

    setSavingSender(true);
    try {
      if (!userId) {
        setError("Ta session a expiré. Reconnecte-toi puis réessaie.");
        return;
      }
      const token = await getToken();
      if (!token) {
        setError("Ta session a expiré. Reconnecte-toi puis réessaie.");
        return;
      }
      if (accountPhoneSelected) {
        setStep("review");
        return;
      }
      const result = await addMoneyService.saveSender(token, userId, {
        countryId,
        phoneNumber: `${country.dialCode}${phoneNumber.replace(/\D/g, "")}`,
        providerId: provider.id,
        providerName: provider.name,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSenders((current) => mergeSenderLists([result.data.sender], current));
      setStep("review");
    } catch {
      setError("Impossible d’enregistrer cet envoyeur pour le moment.");
    } finally {
      setSavingSender(false);
    }
  };

  const selectSender = (sender: AddMoneySender) => {
    const senderCountry = supportedCountries.find((item) => item.id === sender.countryId);
    setCountryId(sender.countryId);
    const dialDigits = senderCountry?.dialCode.replace(/\D/g, "") ?? "";
    const digits = sender.phoneNumber.replace(/\D/g, "");
    setPhoneNumber(dialDigits && digits.startsWith(dialDigits) ? digits.slice(dialDigits.length) : digits);
    if (sender.id === ACCOUNT_PHONE_SENDER_ID) {
      setProviderId(null);
      setAccountPhoneSelected(true);
      setSenderTab("new");
      return;
    }
    setProviderId(sender.providerId);
    setAccountPhoneSelected(false);
  };

  const submitDeposit = async () => {
    if (busy || !userId || !provider || !canContinueSender || amountXof <= 0) return;
    setBusy(true);
    setError(null);
    try {
      // The provider's Mobile Money authorization happens after this request.
      // The backend calculates conversion/fees and records the ledger entry.
      const token = await getToken();
      if (!token) {
        setError("Ta session a expiré. Reconnecte-toi puis réessaie.");
        return;
      }
      const result = await addMoneyService.create(token, {
        countryId,
        providerId: provider.id,
        phoneNumber: `${country.dialCode}${phoneNumber.replace(/\D/g, "")}`,
        amountXof,
        walletCurrency: currencyCode,
        idempotencyKey,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }

      const deposit = result.data.deposit;
      setReceipt(deposit);
      addTransaction({
        id: deposit.id,
        typeId: "deposit",
        category: "received",
        title: deposit.senderName || deposit.phoneNumber,
        description: `Dépôt Mobile Money · ${deposit.providerName}`,
        amount: deposit.walletAmount,
        totalAmount: deposit.totalAmount,
        fee: deposit.fee,
        sentAmountXof: deposit.amountXof,
        exchangeRate: deposit.exchangeRate,
        currency: deposit.walletCurrency,
        direction: "in",
        status: deposit.status,
        createdAt: deposit.createdAt,
        recipientOrSender: deposit.senderName || deposit.phoneNumber,
        reference: deposit.reference,
        paymentMethod: `Mobile Money (${deposit.providerName})`,
      });
      setStep("result");
    } catch {
      setError("Le dépôt n’a pas pu être confirmé. Vérifie l’historique avant de réessayer.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingTop: contentTopGap, flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1">
        {step === "amount" ? (
          <>
            <Header onDismiss={close} label="Close Add Money" />
            <Title title="addMoney" />
            <AmountStep
              amount={amount}
              onAmountChange={handleXofAmountChange}
              amountXof={amountXof}
              walletAmount={walletAmountDisplay}
              onWalletAmountChange={handleWalletAmountChange}
              conversionRateLabel={getDepositPreviewRateLabel(currencyCode, useLanguageStore.getState().language)}
              walletBalance={wallet ? formatAmount(wallet.balance, wallet.currency) : "—"}
              walletCurrency={currencyCode}
              countryName={country.name}
              country={country}
              countries={ADD_MONEY_COUNTRIES}
              countryMenuOpen={countryMenuOpen}
              onToggleCountry={() => setCountryMenuOpen((open) => !open)}
              onSelectCountry={selectCountry}
              canContinue={canContinueAmount}
              onContinue={openSenders}
            />
          </>
        ) : step === "sender" ? (
          <>
            <Header onBack={() => setStep("amount")} label="Back to amount" />
            <Title title="mobileMoney" />
            <SenderStep
              tab={senderTab}
              onTabChange={(nextTab) => { setSenderTab(nextTab); setError(null); }}
              senders={filteredSenders}
              selectedPhone={phoneNumber}
              country={country}
              countries={ADD_MONEY_COUNTRIES}
              countryMenuOpen={countryMenuOpen}
              providers={providers}
              onToggleCountry={() => setCountryMenuOpen((open) => !open)}
              onSelectCountry={selectCountry}
              search={search}
              onSearchChange={setSearch}
              loading={sendersLoading}
              phone={phoneNumber}
              onPhoneChange={(value) => { setAccountPhoneSelected(false); setPhoneNumber(value.replace(/\D/g, "").slice(0, country.nationalNumberLength)); }}
              provider={provider}
              providerMenuOpen={providerMenuOpen}
              onToggleProvider={() => setProviderMenuOpen((open) => !open)}
              onSelectProvider={(id) => { setProviderId(id); setProviderMenuOpen(false); }}
              onSelectSender={selectSender}
              error={error}
              busy={savingSender}
              canContinue={senderTab === "saved" ? phoneNumber.replace(/\D/g, "").length === country.nationalNumberLength && !!provider : canContinueSender}
              onContinue={() => { void continueFromSender(); }}
            />
          </>
        ) : step === "review" ? (
          <>
            <Header onBack={() => setStep("sender")} label="Back to sender" />
            <Title title="reviewDeposit" />
            <ReviewStep
              amountXof={amountXof}
              walletAmount={formatAmount(walletAmountEstimate, currencyCode)}
              providerName={provider?.name ?? "—"}
              phoneNumber={`${country.dialCode} ${phoneNumber}`}
              error={error}
              busy={busy}
              onConfirm={() => { void submitDeposit(); }}
            />
          </>
        ) : (
          <>
            <Header onBack={close} label="Close deposit receipt" />
            <ResultStep receipt={receipt} onContinue={close} />
          </>
        )}
      </View>
    </ScrollView>
  );
}

function Header({ onDismiss, onBack, label }: { onDismiss?: () => void; onBack?: () => void; label: string }) {
  return (
    <View className={`h-[44px] flex-row items-center px-5 ${onBack ? "justify-start" : "justify-end"}`}>
      <Pressable
        onPress={onBack ?? onDismiss}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={label}
        className={onBack ? "h-[42px] w-[42px] items-center justify-center rounded-[12px] bg-white active:opacity-70" : "active:opacity-60"}
      >
        {onBack ? <Image source={images.back} style={{ width: 42, height: 42 }} contentFit="contain" /> : <CloseIcon size={26} color="rgba(255,255,255,0.45)" />}
      </Pressable>
    </View>
  );
}

function Title({ title }: { title: FinancialTitleKey }) {
  const language = useLanguageStore((state) => state.language);
  const [muted, strong] = getFinancialTitleSegments(title, language);
  return (
    <View className="mt-4 flex-row items-baseline px-8">
      <NativeText allowFontScaling={false} className="font-semibold text-[32px] text-white/40">{muted} </NativeText>
      <NativeText allowFontScaling={false} className="font-bold text-[32px] text-white">{strong}</NativeText>
    </View>
  );
}

function AmountStep({
  amount,
  onAmountChange,
  amountXof,
  walletAmount,
  onWalletAmountChange,
  conversionRateLabel,
  walletBalance,
  walletCurrency,
  countryName,
  country,
  countries,
  countryMenuOpen,
  onToggleCountry,
  onSelectCountry,
  canContinue,
  onContinue,
}: {
  amount: string;
  onAmountChange: (value: string) => void;
  amountXof: number;
  walletAmount: string;
  onWalletAmountChange: (value: string) => void;
  conversionRateLabel: string;
  walletBalance: string;
  walletCurrency: CurrencyCode;
  countryName: string;
  country: SupportedCountry;
  countries: SupportedCountry[];
  countryMenuOpen: boolean;
  onToggleCountry: () => void;
  onSelectCountry: (countryId: AddMoneyCountry) => void;
  canContinue: boolean;
  onContinue: () => void;
}) {
  return (
    <View className="mt-6 flex-1 rounded-t-[28px] bg-white px-5 pb-8 pt-7">
      <Text allowFontScaling={false} className="text-[18px] font-semibold text-zeno-text-primary">How much do you want to deposit?</Text>
      <View className="mt-6 flex-row items-center justify-between">
        <Text className="text-[13px] font-medium text-zeno-text-secondary">DEPOSIT FROM {countryName.toUpperCase()}</Text>
        <Text className="text-[13px] font-semibold text-zeno-text-secondary">TO ZENO WALLET</Text>
      </View>
      <View className="mt-3 h-[62px] flex-row items-center rounded-[16px] border border-black/10 bg-white px-4">
        <TextInput
          value={amount}
          onChangeText={onAmountChange}
          placeholder="0"
          placeholderTextColor="rgba(7,23,6,0.4)"
          keyboardType="number-pad"
          textAlignVertical="center"
          allowFontScaling={false}
          accessibilityLabel="Deposit amount in XOF"
          className="h-full min-w-0 flex-1 py-0 font-semibold text-[24px] leading-[30px] text-zeno-text-primary"
        />
        <View className="relative">
          <Pressable
            onPress={onToggleCountry}
            accessibilityRole="button"
            accessibilityLabel={`Pays du dépôt : ${country.name}`}
            accessibilityState={{ expanded: countryMenuOpen }}
            className="flex-row items-center"
          >
            <Image source={country.flag} style={{ width: 30, height: 30, borderRadius: 15 }} contentFit="cover" />
            <Text allowFontScaling={false} className="ml-2 text-[20px] font-bold text-zeno-text-primary">XOF</Text>
            <View className="ml-1" style={{ transform: [{ rotate: countryMenuOpen ? "180deg" : "0deg" }] }}>
              <Chevron direction="down" size={12} color={colors.zenoTextPrimary} thickness={2.5} />
            </View>
          </Pressable>
          {countryMenuOpen ? (
            <View className="absolute right-0 top-[40px] z-30 w-[210px] rounded-[16px] border border-black/5 bg-white p-1 shadow-sm">
              {countries.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => onSelectCountry(item.id as AddMoneyCountry)}
                  className="h-[48px] flex-row items-center rounded-[12px] px-3"
                  style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
                >
                  <Image source={item.flag} style={{ width: 26, height: 26, borderRadius: 13 }} contentFit="cover" />
                  <Text className="ml-2 flex-1 text-[14px] text-zeno-text-primary">{item.name}</Text>
                  <Text className="text-[13px] text-zeno-text-secondary">XOF</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <View className="my-5 flex-row items-center">
        <View className="h-px flex-1 bg-black/10" />
        <View className="mx-2 rounded-full bg-zeno-blue px-3 py-1.5">
          <Text allowFontScaling={false} className="text-[12px] text-white">
            {conversionRateLabel}
          </Text>
        </View>
        <View className="h-px flex-1 bg-black/10" />
      </View>

      <Text allowFontScaling={false} className="mb-2 text-[12px] tracking-wider text-zeno-text-primary">TO YOUR ZENO WALLET</Text>
      <View className="h-[62px] flex-row items-center rounded-[16px] border border-black/10 bg-[#F7F8F7] px-4">
        <TextInput
          value={walletAmount}
          onChangeText={onWalletAmountChange}
          placeholder={walletCurrency === "XOF" ? "0" : "0.00"}
          placeholderTextColor="rgba(7,23,6,0.4)"
          keyboardType="decimal-pad"
          textAlignVertical="center"
          allowFontScaling={false}
          accessibilityLabel={`Amount to receive in ${walletCurrency}`}
          className="h-full min-w-0 flex-1 py-0 font-semibold text-[24px] leading-[30px] text-zeno-text-primary"
        />
        <ZenoIcon size={30} />
        <Text allowFontScaling={false} className="ml-2 text-[16px] font-bold text-zeno-text-primary">{walletCurrency}</Text>
      </View>

      <View className="mt-5 self-start rounded-full bg-black/[0.04] px-4 py-2.5">
        <Text allowFontScaling={false} className="text-[13px] text-zeno-text-primary">Wallet balance <Text className="font-bold">{walletBalance}</Text></Text>
      </View>

      <View className="mt-auto pt-8">
        <PrimaryButton label="Next" onPress={onContinue} disabled={!canContinue} tone="lime" />
      </View>
    </View>
  );
}

function SenderStep({
  tab,
  onTabChange,
  senders,
  selectedPhone,
  country,
  countries,
  countryMenuOpen,
  providers,
  onToggleCountry,
  onSelectCountry,
  search,
  onSearchChange,
  loading,
  phone,
  onPhoneChange,
  provider,
  providerMenuOpen,
  onToggleProvider,
  onSelectProvider,
  onSelectSender,
  error,
  busy,
  canContinue,
  onContinue,
}: {
  tab: SenderTab;
  onTabChange: (tab: SenderTab) => void;
  senders: AddMoneySender[];
  selectedPhone: string;
  country: SupportedCountry;
  countries: SupportedCountry[];
  countryMenuOpen: boolean;
  providers: MobileMoneyProvider[];
  onToggleCountry: () => void;
  onSelectCountry: (countryId: AddMoneyCountry) => void;
  search: string;
  onSearchChange: (value: string) => void;
  loading: boolean;
  phone: string;
  onPhoneChange: (value: string) => void;
  provider?: MobileMoneyProvider;
  providerMenuOpen: boolean;
  onToggleProvider: () => void;
  onSelectProvider: (id: string) => void;
  onSelectSender: (sender: AddMoneySender) => void;
  error: string | null;
  busy: boolean;
  canContinue: boolean;
  onContinue: () => void;
}) {
  return (
    <View className="mt-6 flex-1 rounded-t-[28px] bg-white px-5 pb-8 pt-7">
      <View className="h-[52px] flex-row rounded-[14px] bg-black/[0.08] p-1">
        <Pressable onPress={() => onTabChange("saved")} accessibilityRole="tab" accessibilityState={{ selected: tab === "saved" }} className={`flex-1 items-center justify-center rounded-[11px] ${tab === "saved" ? "bg-white" : ""}`}>
          <Text allowFontScaling={false} className={`text-[15px] font-semibold ${tab === "saved" ? "text-zeno-text-primary" : "text-zeno-text-secondary"}`}>My senders</Text>
        </Pressable>
        <Pressable onPress={() => onTabChange("new")} accessibilityRole="tab" accessibilityState={{ selected: tab === "new" }} className={`flex-1 items-center justify-center rounded-[11px] ${tab === "new" ? "bg-white" : ""}`}>
          <Text allowFontScaling={false} className={`text-[15px] font-semibold ${tab === "new" ? "text-zeno-text-primary" : "text-zeno-text-secondary"}`}>New sender</Text>
        </Pressable>
      </View>

      {tab === "saved" ? (
        <>
          <View className="mt-6 h-[52px] flex-row items-center rounded-[14px] border border-black/5 bg-[#F7F8F7] px-4">
            <Text allowFontScaling={false} className="mr-3 text-[21px] text-zeno-text-secondary">⌕</Text>
            <TextInput value={search} onChangeText={onSearchChange} placeholder="Search a sender" placeholderTextColor="#969A9A" className="h-full flex-1 text-[16px] text-zeno-text-primary" />
          </View>
          {loading ? <ActivityIndicator className="mt-8" color={colors.zenoBlue} /> : senders.length ? (
            <ScrollView className="mt-3 max-h-[390px]" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {senders.map((sender) => {
                const selected = selectedPhone === sender.phoneNumber.replace(/\D/g, "").slice(-10);
                return (
                  <Pressable key={sender.id} onPress={() => onSelectSender(sender)} accessibilityRole="button" accessibilityState={{ selected }} className={`min-h-[72px] flex-row items-center rounded-[16px] px-3 ${selected ? "bg-zeno-sky" : "bg-white"}`}>
                    <View className="h-[48px] w-[48px] items-center justify-center rounded-full bg-zeno-mint-soft"><Text className="text-[13px] font-semibold text-zeno-blue">{sender.providerName?.slice(0, 1) ?? "Z"}</Text></View>
                    <View className="ml-3 flex-1"><Text className="text-[16px] font-semibold text-zeno-text-primary">{sender.name || sender.providerName || "Account phone number"}</Text><Text className="mt-0.5 text-[13px] text-zeno-text-secondary">{sender.phoneNumber} · {sender.providerName || "Choose a network"}</Text></View>
                    {selected ? <Text className="text-[20px] font-bold text-zeno-blue">✓</Text> : <Chevron direction="right" size={12} color={colors.zenoTextSecondary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <View className="mt-8 items-center rounded-[18px] bg-[#F7F8F7] px-5 py-7">
              <Text allowFontScaling={false} className="text-center text-[15px] text-zeno-text-secondary">{search ? "No sender matches your search." : "No saved senders yet. Add a sender to continue."}</Text>
              <Pressable onPress={() => onTabChange("new")} className="mt-4 rounded-full bg-zeno-sky px-5 py-3"><Text className="font-semibold text-zeno-blue">Add a sender</Text></Pressable>
            </View>
          )}
        </>
      ) : (
        <ScrollView className="mt-6" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text allowFontScaling={false} className="mb-2.5 text-[16px] text-zeno-text-primary">Phone Number</Text>
          <View className="relative flex-row">
            <View>
              <Pressable onPress={onToggleCountry} accessibilityRole="button" accessibilityState={{ expanded: countryMenuOpen }} className="h-[56px] w-[116px] flex-row items-center justify-center rounded-[14px] border border-black/5 bg-white px-3">
                <Text allowFontScaling={false} className="text-[16px] font-medium text-zeno-text-primary">{country.dialCode}</Text>
                <View className="ml-2" style={{ transform: [{ rotate: countryMenuOpen ? "180deg" : "0deg" }] }}>
                  <Chevron direction="down" size={10} color={colors.zenoTextPrimary} thickness={2.5} />
                </View>
              </Pressable>
              {countryMenuOpen ? <View className="absolute left-0 top-[60px] z-20 w-[190px] rounded-[16px] border border-black/5 bg-white p-1 shadow-sm">{countries.map((item) => <Pressable key={item.id} onPress={() => onSelectCountry(item.id as AddMoneyCountry)} className="h-[48px] flex-row items-center rounded-[12px] px-3" style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}><Text className="flex-1 text-[14px] text-zeno-text-primary">{item.name}</Text><Text className="text-[14px] text-zeno-text-secondary">{item.dialCode}</Text></Pressable>)}</View> : null}
            </View>
            <TextInput value={phone} onChangeText={onPhoneChange} placeholder="Phone Number" placeholderTextColor="#969A9A" keyboardType="phone-pad" className="ml-2 h-[56px] min-w-0 flex-1 rounded-[14px] border border-black/5 bg-white px-4 text-[16px] text-zeno-text-primary" />
          </View>

          <Text allowFontScaling={false} className="mb-2.5 mt-6 text-[16px] text-zeno-text-primary">Mobile Money network</Text>
          <Pressable onPress={onToggleProvider} accessibilityRole="button" accessibilityState={{ expanded: providerMenuOpen }} className="h-[62px] flex-row items-center rounded-[14px] border border-black/5 bg-white px-4">
            <Text allowFontScaling={false} className="flex-1 text-[16px] text-zeno-text-primary">{provider?.name.replace(" Money", "") ?? "Choose a network"}</Text>
            <View style={{ transform: [{ rotate: providerMenuOpen ? "180deg" : "0deg" }] }}><Chevron direction="down" size={12} color={colors.zenoTextPrimary} thickness={2.5} /></View>
          </Pressable>
          {providerMenuOpen ? <View className="mt-1 rounded-[18px] bg-[#F1F2F1] p-2">{providers.map((item) => <ProviderRow key={item.id} provider={item} onPress={() => onSelectProvider(item.id)} />)}</View> : null}
        </ScrollView>
      )}

      {error ? <Text accessibilityRole="alert" className="mt-3 text-[14px] text-red-600">{error}</Text> : null}
      <View className="mt-auto pt-6"><PrimaryButton label={tab === "new" ? "Confirm" : "Next"} onPress={onContinue} disabled={!canContinue} busy={busy} tone="lime" /></View>
    </View>
  );
}

function ReviewStep({
  amountXof,
  walletAmount,
  providerName,
  phoneNumber,
  error,
  busy,
  onConfirm,
}: {
  amountXof: number;
  walletAmount: string;
  providerName: string;
  phoneNumber: string;
  error: string | null;
  busy: boolean;
  onConfirm: () => void;
}) {
  return (
    <View className="mt-6 flex-1 rounded-t-[28px] bg-white px-5 pb-8 pt-7">
      <Text allowFontScaling={false} className="text-[18px] font-semibold leading-[25px] text-zeno-text-primary">Review your deposit details</Text>
      <View className="mt-6 rounded-[20px] border border-black/5 bg-white px-5 py-4">
        <SummaryRow label="Deposit amount" value={formatAmount(amountXof, "XOF")} />
        <SummaryRow label="To ZENO Wallet" value={walletAmount} />
        <SummaryRow label="Via" value={`${providerName} · ${phoneNumber}`} />
      </View>

      {error ? <Text accessibilityRole="alert" className="mt-3 text-[14px] text-red-600">{error}</Text> : null}
      <View className="mt-auto pt-8"><PrimaryButton label="Confirm deposit" onPress={onConfirm} busy={busy} tone="lime" /></View>
    </View>
  );
}

function ResultStep({ receipt, onContinue }: { receipt: AddMoneyReceipt | null; onContinue: () => void }) {
  const completed = receipt?.status === "completed";
  const pending = receipt?.status === "pending";
  const title = completed ? "Deposit successful" : pending ? "Deposit submitted" : "Deposit failed";
  const description = completed
    ? "Your deposit has been confirmed."
    : pending
      ? "Check your phone and approve the Mobile Money request to complete your deposit."
      : "The Mobile Money provider could not complete this deposit.";
  return (
    <View className="flex-1 px-5">
      <View className="mt-14 items-center px-5">
        <View className={`h-[100px] w-[100px] items-center justify-center rounded-full ${completed ? "bg-zeno-green" : pending ? "bg-zeno-warning/15" : "bg-zeno-error/10"}`}>
          <Text allowFontScaling={false} className={`text-[52px] font-bold ${completed ? "text-zeno-dark" : pending ? "text-zeno-warning" : "text-zeno-error"}`}>{completed ? "✓" : pending ? "…" : "×"}</Text>
        </View>
        <Text allowFontScaling={false} className="mt-6 text-center text-[28px] font-bold text-white">{title}</Text>
        <Text allowFontScaling={false} className="mt-3 text-center text-[16px] leading-[23px] text-white/75">{description}</Text>
      </View>

      {receipt ? (
        <View className="mt-auto rounded-t-[28px] bg-white px-5 pb-8 pt-7">
          <Text allowFontScaling={false} className="text-[22px] font-bold text-zeno-text-primary">Transaction receipt</Text>
          <View className="mt-5 rounded-[18px] bg-[#F7F8F7] px-4 py-3">
            <SummaryRow label="Amount deposited" value={formatAmount(receipt.amountXof, "XOF")} />
            <SummaryRow label="Via" value={`${receipt.providerName} · ${receipt.phoneNumber}`} />
            <SummaryRow label="Reference" value={receipt.reference} />
            <SummaryRow label="Status" value={receipt.status} />
          </View>
          <View className="mt-6"><PrimaryButton label="Continue" onPress={onContinue} tone="lime" /></View>
        </View>
      ) : (
        <View className="mt-auto pb-8"><PrimaryButton label="Continue" onPress={onContinue} tone="lime" /></View>
      )}
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: "phone-pad" }) {
  return (
    <View className="mb-5">
      <Text allowFontScaling={false} className="mb-2.5 text-[16px] text-zeno-text-primary">{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="rgba(7,23,6,0.4)" keyboardType={keyboardType} allowFontScaling={false} className="h-[52px] rounded-full bg-[#F4F6F5] px-5 text-[16px] text-zeno-text-primary" />
    </View>
  );
}

function ProviderRow({ provider, onPress }: { provider: MobileMoneyProvider; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="h-[54px] flex-row items-center rounded-full px-3" style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}>
      {provider.logoKey ? <Image source={images.providers[provider.logoKey]} style={{ width: 32, height: 32, borderRadius: 5 }} contentFit="contain" /> : <View className="h-[32px] w-[32px] rounded-[5px] bg-black/10" />}
      <Text allowFontScaling={false} className="ml-3 text-[15px] font-semibold text-zeno-text-primary">{provider.name}</Text>
    </Pressable>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-h-[48px] flex-row items-center justify-between border-b border-black/5 py-2 last:border-b-0">
      <Text allowFontScaling={false} className="max-w-[42%] text-[14px] text-zeno-text-secondary">{label}</Text>
      <Text allowFontScaling={false} numberOfLines={2} className="max-w-[58%] text-right text-[14px] font-semibold text-zeno-text-primary">{value}</Text>
    </View>
  );
}

function PrimaryButton({ label, onPress, disabled = false, busy = false, tone = "forest" }: { label: string; onPress: () => void; disabled?: boolean; busy?: boolean; tone?: "forest" | "lime" }) {
  const inactive = disabled || busy;
  return (
    <Pressable onPress={onPress} disabled={inactive} accessibilityRole="button" accessibilityState={{ disabled: inactive }} className={`h-[62px] items-center justify-center rounded-full ${inactive ? "bg-black/15" : tone === "lime" ? "bg-zeno-green active:opacity-90" : "bg-zeno-intro active:opacity-90"}`}>
      {busy ? <ActivityIndicator color={colors.zenoDark} /> : <Text allowFontScaling={false} className={`text-[19px] font-bold ${inactive ? "text-black/30" : tone === "lime" ? "text-zeno-dark" : "text-white"}`}>{label}</Text>}
    </Pressable>
  );
}

function isSender(value: unknown): value is AddMoneySender {
  if (!value || typeof value !== "object") return false;
  const sender = value as Partial<AddMoneySender>;
  return typeof sender.id === "string" && (sender.name === undefined || typeof sender.name === "string") && (sender.countryId === "benin" || sender.countryId === "cote-divoire") && typeof sender.phoneNumber === "string" && typeof sender.providerId === "string" && typeof sender.providerName === "string";
}

function getAccountPhoneSender(metadata: Record<string, unknown> | undefined): AddMoneySender | null {
  const phoneNumber = metadata?.phoneNumber;
  if (typeof phoneNumber !== "string") return null;

  const country = ADD_MONEY_COUNTRIES.find((item) => phoneNumber.startsWith(item.dialCode));
  if (!country) return null;

  const nationalDigits = phoneNumber.slice(country.dialCode.length).replace(/\D/g, "");
  if (nationalDigits.length !== country.nationalNumberLength) return null;

  return {
    id: ACCOUNT_PHONE_SENDER_ID,
    name: "Account phone number",
    countryId: country.id as AddMoneyCountry,
    phoneNumber: `${country.dialCode}${nationalDigits}`,
    providerId: null,
    providerName: null,
  };
}

function mergeSenderLists(...groups: AddMoneySender[][]): AddMoneySender[] {
  const senders = new Map<string, AddMoneySender>();
  groups.flat().forEach((sender) => senders.set(sender.id, sender));
  return [...senders.values()];
}

function isAddMoneyCountry(value: unknown): value is AddMoneyCountry {
  return value === "benin" || value === "cote-divoire";
}
