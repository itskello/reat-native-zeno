import { showLocalizedAlert } from "@/components/ui/LocalizedText";
import { LocalizedTextInput as TextInput } from "@/components/ui/LocalizedText";
import { LocalizedText as Text } from "@/components/ui/LocalizedText";
import {Chevron } from "@/components/ui/Chevron";
import { CloseIcon } from "@/components/ui/CloseIcon";
import { PersonPlusIcon } from "@/components/ui/PersonPlusIcon";
import { images } from "@/constants/images";
import { supportedCountries, formatPhoneNumber } from "@/data/countries";
import { formatAmount, getCurrency } from "@/data/currencies";
import { getProvidersForCountry } from "@/data/mobile-money-providers";
import { getFinancialTitleSegments } from "@/lib/localization";
import { ZenoCardLogo } from "@/components/wallet/ZenoCardLogo";
import { transferService, type TransferReceipt } from "@/features/transfers/transfer-service";
import { useRecipientStore, type Recipient } from "@/store/recipient-store";
import { useSecurityStore } from "@/store/security-store";
import { useTransactionStore } from "@/store/transaction-store";
import { useWalletStore } from "@/store/wallet-store";
import { useLanguageStore } from "@/store/language-store";
import { colors } from "@/theme/colors";
import type { SupportedCountry } from "@/types/content";
import { useAuth, useUser } from "@clerk/clerk-expo";
import * as Crypto from "expo-crypto";
import { Image } from "expo-image";
import Svg, { Path } from "react-native-svg";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text as NativeText, View } from "react-native";

type FlowKind = "zeno" | "mobile";
const PIN_LENGTH = 6;
const DESIGN_USD_TO_XOF_RATE = 750;
type Step =
  | "zeno-search"
  | "zeno-add"
  | "zeno-amount"
  | "zeno-review"
  | "zeno-pin"
  | "mobile-country"
  | "mobile-recipient"
  | "mobile-amount"
  | "mobile-review"
  | "processing"
  | "result";

type TransferFlowProps = {
  contentTopGap: number;
  flow: FlowKind;
  onBackToMenu: () => void;
  initialRecipient?: import("@/store/recipient-store").Recipient;
};

const CURRENCY_INPUT_LIMIT = 12;

/** Internal Send-room steps. This keeps the Wallet island and its transition mounted. */
export function TransferFlow({ contentTopGap, flow, onBackToMenu, initialRecipient }: TransferFlowProps) {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const { user } = useUser();
  const language = useLanguageStore((state) => state.language);
  const wallet = useWalletStore((state) => state.wallet);
  const addRecentRecipient = useRecipientStore((state) => state.addRecentRecipient);
  const savedRecipients = useRecipientStore((state) => state.recent);
  const removeSavedRecipient = useRecipientStore((state) => state.removeRecipient);
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const verifyPin = useSecurityStore((state) => state.verifyPin);
  const hasPin = useSecurityStore((state) => state.hasPin);

  const [step, setStep] = useState<Step>(flow === "zeno" ? (initialRecipient ? "zeno-amount" : "zeno-search") : "mobile-country");
  const [recipient, setRecipient] = useState(initialRecipient);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Recipient[]>([]);
  const [isSearchingRecipients, setIsSearchingRecipients] = useState(false);
  const [recipientSearchError, setRecipientSearchError] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [country, setCountry] = useState<SupportedCountry>(supportedCountries[0]);
  const [providerId, setProviderId] = useState<string>(getProvidersForCountry(supportedCountries[0].id)[0]?.id ?? "");
  const [providerMenuOpen, setProviderMenuOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<TransferReceipt | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => Crypto.randomUUID());

  const currencyCode = wallet?.currency ?? country.defaultCurrency;
  const currency = getCurrency(currencyCode);
  const amountValue = Number(amount.replace(",", ".")) || 0;
  const formattedAmount = formatAmount(amountValue, currencyCode);
  const providers = useMemo(() => getProvidersForCountry(country.id), [country.id]);
  const provider = providers.find((item) => item.id === providerId);
  const searchQuery = query.trim();

  useEffect(() => {
    if (searchQuery.length < 1) {
      setSearchResults([]);
      setRecipientSearchError(null);
      setIsSearchingRecipients(false);
      return;
    }

    let isCurrent = true;
    setIsSearchingRecipients(true);
    setRecipientSearchError(null);

    const timeout = setTimeout(() => {
      void (async () => {
        try {
          const token = await getTokenRef.current();
          if (!token) {
            if (isCurrent) setRecipientSearchError("Ta session a expiré. Reconnecte-toi puis réessaie.");
            return;
          }

          const result = await transferService.searchRecipients(token, searchQuery);
          if (!isCurrent) return;
          if (!result.ok) {
            setRecipientSearchError(result.error);
            setSearchResults([]);
            return;
          }
          setSearchResults(result.data.recipients);
        } catch {
          if (isCurrent) {
            setRecipientSearchError("La recherche n’a pas abouti. Vérifie ta connexion puis réessaie.");
            setSearchResults([]);
          }
        } finally {
          if (isCurrent) setIsSearchingRecipients(false);
        }
      })();
    }, 75);

    return () => {
      isCurrent = false;
      clearTimeout(timeout);
    };
  }, [searchQuery]);

  const back = () => {
    setError(null);
    setBusy(false);
    if (step === "zeno-search" || step === "mobile-country") return onBackToMenu();
    if (step === "zeno-add") return setStep("zeno-search");
    if (step === "zeno-amount") return setStep("zeno-search");
    if (step === "zeno-review") return setStep("zeno-amount");
    if (step === "zeno-pin") return setStep("zeno-review");
    if (step === "mobile-recipient") return setStep("mobile-country");
    if (step === "mobile-amount") return setStep("mobile-recipient");
    if (step === "mobile-review") return setStep("mobile-amount");
    if (step === "result") return onBackToMenu();
    if (step === "processing") return;
    onBackToMenu();
  };

  const selectCountry = (selected: SupportedCountry) => {
    setCountry(selected);
    setProviderId(getProvidersForCountry(selected.id)[0]?.id ?? "");
  };

  const appendAmount = (key: string) => {
    setError(null);
    if (key === "back") return setAmount((value) => value.slice(0, -1));
    if (key === "." && (currency.decimalDigits === 0 || amount.includes("."))) return;
    if (amount.length < CURRENCY_INPUT_LIMIT) setAmount((value) => value + key);
  };

  const addRecipient = async () => {
    if (!recipientName.trim() || !recipientEmail.trim()) {
      setError("Saisis le nom et l’adresse e-mail du bénéficiaire.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(recipientEmail.trim())) {
      setError("Saisis une adresse e-mail valide.");
      return;
    }
    setBusy(true);
    setError(null);
    const token = await getToken();
    if (!token) {
      setBusy(false);
      setError("Ta session a expiré. Reconnecte-toi puis réessaie.");
      return;
    }
    const result = await transferService.addRecipient(token, {
      name: recipientName.trim(),
      email: recipientEmail.trim(),
    });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    const saved = result.data.recipient;
    if (!saved?.id || !saved.name) {
      return setError("Le serveur a renvoyé un bénéficiaire incomplet.");
    }
    addRecentRecipient(saved);
    setRecipient(saved);
    setStep("zeno-amount");
  };

  const submitTransfer = async (pinValue = pin) => {
    if (!wallet || !amountValue || busy) return;
    setBusy(true);
    setError(null);
    setStep("processing");
    const token = await getToken();
    if (!token) {
      setBusy(false);
      setStep(flow === "zeno" ? "zeno-pin" : "mobile-review");
      setPin("");
      setError("Ta session a expiré. Reconnecte-toi puis réessaie.");
      return;
    }

    const result = flow === "zeno"
      ? recipient
        ? await transferService.sendToZeno(token, {
            recipientId: recipient.id,
            amount: amountValue,
            currency: currencyCode,
            pin: pinValue,
            idempotencyKey,
          })
        : null
      : provider
        ? await transferService.sendToMobileMoney(token, {
            countryId: country.id,
            providerId: provider.id,
            phoneNumber: `${country.dialCode}${phone.replace(/\D/g, "")}`,
            recipientName: recipientName.trim(),
            amount: amountValue,
            currency: currencyCode,
            idempotencyKey,
          })
        : null;
    setBusy(false);
    if (!result) {
      setStep(flow === "zeno" ? "zeno-pin" : "mobile-review");
      setPin("");
      setError("Vérifie les informations du transfert et réessaie.");
      return;
    }
    if (!result.ok) {
      setStep(flow === "zeno" ? "zeno-pin" : "mobile-review");
      setPin("");
      setError(result.error);
      return;
    }
    const transfer = result.data.transfer;
    if (!transfer?.id || !transfer.reference || !["completed", "pending", "failed"].includes(transfer.status)) {
      setStep(flow === "zeno" ? "zeno-pin" : "mobile-review");
      setPin("");
      setError("La réponse du serveur est incomplète. Vérifie l’historique avant de réessayer.");
      return;
    }
    setReceipt(transfer);
    if (flow === "zeno" && recipient && transfer.status !== "failed") {
      addRecentRecipient(recipient);
      void transferService.saveRecipient(token, recipient.id).catch(() => {
        // The transfer is already recorded; contact persistence must not change its result.
      });
    }
    addTransaction({
      id: transfer.id,
      typeId: "sent",
      category: "sent",
      title: flow === "zeno" ? (recipient?.name ?? transfer.recipientName) : transfer.recipientName,
      description: flow === "zeno" ? "Transfert ZENO" : `Mobile Money · ${provider?.name ?? transfer.paymentMethod}`,
      amount: transfer.amount,
      totalAmount: transfer.totalAmount,
      fee: transfer.fee,
      currency: transfer.currency,
      direction: "out",
      status: transfer.status,
      createdAt: transfer.createdAt,
      timeLabel: transfer.createdAt,
      recipientOrSender: transfer.recipientName,
      reference: transfer.reference,
      paymentMethod: transfer.paymentMethod,
    });
    setStep("result");
  };

  const continueFromPin = async (pinValue = pin) => {
    if (pinValue.length !== PIN_LENGTH || busy) return;
    setBusy(true);
    setError(null);
    if (!user?.id || !(await hasPin(user.id))) {
      setBusy(false);
      setError("Aucun code PIN n’est configuré pour ce compte.");
      setPin("");
      return;
    }
    if (!(await verifyPin(user.id, pinValue))) {
      setBusy(false);
      setError("Code PIN incorrect. Réessaie.");
      setPin("");
      return;
    }
    setBusy(false);
    await submitTransfer(pinValue);
  };

  const validPhone = phone.replace(/\D/g, "").length === country.nationalNumberLength;
  const currentTitle = step.startsWith("zeno")
    ? getFinancialTitleSegments(step === "zeno-search" || step === "zeno-add" ? "sendOnZeno" : "sendMoney", language)
    : getFinancialTitleSegments("viaMobileMoney", language);

  return (
    <View className={`flex-1 ${step === "zeno-pin" || step === "mobile-amount" ? "bg-zeno-green" : ""}`} style={{ paddingTop: contentTopGap }}>
      {step !== "processing" && step !== "result" && step !== "mobile-amount" ? <FlowHeader onBack={back} label="Go back" /> : null}
      {step !== "processing" && step !== "result" && step !== "zeno-pin" && step !== "mobile-amount" ? (
        <View className="mt-4 flex-row items-baseline px-8">
          <NativeText allowFontScaling={false} className="font-semibold text-[30px] text-white/40">{currentTitle[0]} </NativeText>
          <NativeText allowFontScaling={false} className="font-bold text-[30px] text-white">{currentTitle[1]}</NativeText>
        </View>
      ) : null}

      {step === "zeno-search" ? (
        <SearchRecipients
          query={query}
          onQueryChange={(value) => { setQuery(value); setSearchResults([]); setRecipientSearchError(null); }}
          recipients={searchQuery ? searchResults : savedRecipients}
          isSavedList={!searchQuery}
          isSearching={isSearchingRecipients}
          searchError={recipientSearchError}
          onSelect={(item) => { setRecipient(item); setStep("zeno-amount"); }}
          onRemove={async (item) => {
            const token = await getToken();
            if (!token) return setRecipientSearchError("Ta session a expiré. Reconnecte-toi puis réessaie.");
            const result = await transferService.removeRecipient(token, item.id);
            if (!result.ok) return setRecipientSearchError(result.error);
            removeSavedRecipient(item.id);
          }}
          onAdd={() => { setError(null); setStep("zeno-add"); }}
        />
      ) : step === "zeno-add" ? (
        <AddRecipient
          name={recipientName}
          email={recipientEmail}
          onNameChange={setRecipientName}
          onEmailChange={setRecipientEmail}
          onSubmit={addRecipient}
          onCancel={() => setStep("zeno-search")}
          busy={busy}
          error={error}
        />
      ) : step === "mobile-amount" ? (
        <MobileMoneyAmountStep
          amount={amount}
          balanceLabel={wallet
            ? wallet.currency === "USD"
              ? `${wallet.balance.toFixed(2)} USD`
              : formatAmount(wallet.balance, wallet.currency)
            : "—"}
          currencySymbol={currency.symbol}
          decimalDigits={currency.decimalDigits}
          currencyCode={currencyCode}
          canContinue={amountValue > 0}
          onBack={back}
          onKey={appendAmount}
          onContinue={() => { setError(null); setIdempotencyKey(Crypto.randomUUID()); setStep("mobile-review"); }}
          error={error}
        />
      ) : step === "zeno-amount" ? (
        <AmountStep
          flow={flow}
          recipientName={recipient?.name ?? ""}
          amount={amount}
          balanceLabel={wallet ? formatAmount(wallet.balance, wallet.currency) : "—"}
          currencySymbol={currency.symbol}
          symbolPosition={currency.symbolPosition}
          decimalDigits={currency.decimalDigits}
          canContinue={amountValue > 0}
          onKey={appendAmount}
          onContinue={() => { setError(null); setIdempotencyKey(Crypto.randomUUID()); setStep(flow === "zeno" ? "zeno-review" : "mobile-review"); }}
          error={error}
        />
      ) : step === "zeno-review" ? (
        <ReviewStep
          title="Review Transfer"
          rows={[
            ["Recipient", recipient?.name ?? ""],
            ...(recipient?.zenoId ? [["ZENO ID", recipient.zenoId] as [string, string]] : []),
            ["Amount", formattedAmount],
            ["Fee", "À confirmer par le serveur"],
          ]}
          buttonLabel="Continue"
          onContinue={() => { setPin(""); setError(null); setStep("zeno-pin"); }}
          onEdit={() => { setIdempotencyKey(Crypto.randomUUID()); setStep("zeno-amount"); }}
          error={error}
        />
      ) : step === "zeno-pin" ? (
        <PinStep
          pin={pin}
          onPinChange={(value) => { setPin(value); setError(null); if (value.length === PIN_LENGTH) void continueFromPin(value); }}
          busy={busy}
          error={error}
        />
      ) : step === "mobile-country" ? (
        <CountryStep
          onSelect={(selected) => { selectCountry(selected); setStep("mobile-recipient"); }}
          onUnavailable={(name) => showLocalizedAlert("Bientôt disponible", `Les transferts Mobile Money vers ${name} ne sont pas encore activés.`)}
          onClose={onBackToMenu}
        />
      ) : step === "mobile-recipient" ? (
        <MobileRecipientStep
          country={country}
          onBackToCountries={() => { setProviderMenuOpen(false); setStep("mobile-country"); }}
          providers={providers}
          providerId={providerId}
          providerMenuOpen={providerMenuOpen}
          onToggleProviders={() => setProviderMenuOpen((open) => !open)}
          onSelectProvider={(id) => { setProviderId(id); setProviderMenuOpen(false); }}
          phone={phone}
          name={recipientName}
          onPhoneChange={setPhone}
          onNameChange={setRecipientName}
          onContinue={() => { setError(null); setStep("mobile-amount"); }}
          canContinue={validPhone && recipientName.trim().length > 1 && !!provider}
          error={error}
        />
      ) : step === "mobile-review" ? (
        <ReviewStep
          title="Confirm Transfer"
          rows={[
            ["Amount", formattedAmount],
            ["Recipient’s name", recipientName],
            ["Number", `${country.dialCode} ${formatPhoneNumber(phone, country.phoneFormat)}`],
            ["Network", provider?.name ?? ""],
            ["Transaction fee", "À confirmer par le serveur"],
          ]}
          buttonLabel="Send"
          onContinue={submitTransfer}
          onEdit={() => { setIdempotencyKey(Crypto.randomUUID()); setStep("mobile-amount"); }}
          busy={busy}
          error={error}
        />
      ) : step === "processing" ? (
        <View className="flex-1 items-center justify-center px-10">
          <ActivityIndicator size="large" color={colors.zenoGreen} />
          <Text allowFontScaling={false} className="mt-5 text-center font-semibold text-[19px] text-white">Traitement sécurisé du transfert…</Text>
          <Text allowFontScaling={false} className="mt-2 text-center text-[14px] text-white/60">Ne ferme pas cette étape.</Text>
        </View>
      ) : (
        <TransferResult
          receipt={receipt}
          onDone={onBackToMenu}
        />
      )}

    </View>
  );
}

function FlowHeader({ onBack, label }: { onBack: () => void; label: string }) {
  return (
    <View className="h-[44px] flex-row items-center px-5">
      <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel={label} className="h-[42px] w-[42px] items-center justify-center rounded-[12px] bg-white active:opacity-70">
        <Image source={images.back} style={{ width: 42, height: 42 }} contentFit="contain" />
      </Pressable>
    </View>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <ScrollView className="mt-5 flex-1" contentContainerClassName="flex-grow" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}><View className={`min-h-full rounded-t-[28px] bg-white px-6 pb-8 pt-7 ${className}`}>{children}</View></ScrollView>;
}

function SearchRecipients({ query, onQueryChange, recipients, isSavedList, isSearching, searchError, onSelect, onRemove, onAdd }: {
  query: string; onQueryChange: (value: string) => void; recipients: Recipient[];
  isSavedList: boolean;
  isSearching: boolean; searchError: string | null;
  onSelect: (recipient: Recipient) => void; onRemove: (recipient: Recipient) => void; onAdd: () => void;
}) {
  return (
    <Panel>
      <Pressable onPress={onAdd} accessibilityRole="button" accessibilityLabel="Add New Recipient" className="h-[68px] flex-row items-center rounded-full bg-zeno-sky px-4 active:opacity-80">
        <View className="h-[48px] w-[48px] items-center justify-center rounded-full bg-zeno-mint-soft"><Text className="text-[25px] text-zeno-dark">＋</Text></View>
        <Text allowFontScaling={false} numberOfLines={1} className="ml-3 min-w-0 flex-1 font-semibold text-[16px] text-zeno-text-primary">Add New Recipient</Text>
        <Chevron direction="right" size={14} />
      </Pressable>
      <TextInput value={query} onChangeText={onQueryChange} placeholder="Search recipient" placeholderTextColor="#858585" autoCapitalize="none" className="mt-5 h-[62px] rounded-full bg-[#F1F1F1] px-6 text-[16px] text-zeno-text-primary" accessibilityLabel="Search recipient" />
      <Text allowFontScaling={false} className="mb-3 mt-8 text-[17px] font-semibold text-zeno-text-primary">All Contacts</Text>
      {!isSavedList && isSearching ? (
        <View className="items-center py-8"><ActivityIndicator color={colors.zenoBlue} /><Text className="mt-3 text-[14px] text-zeno-text-secondary">Recherche des utilisateurs…</Text></View>
      ) : searchError ? (
        <ErrorText message={searchError} />
      ) : recipients.length ? recipients.map((item) => (
        <View key={item.id} className="min-h-[72px] flex-row items-center border-b border-black/5 py-2">
          <Pressable onPress={() => onSelect(item)} className="min-h-[64px] flex-1 flex-row items-center active:opacity-60">
            <Image source={{ uri: item.avatarUrl }} style={{ width: 48, height: 48, borderRadius: 24 }} contentFit="cover" />
            <View className="ml-4 flex-1"><Text allowFontScaling={false} className="font-medium text-[16px] text-zeno-text-primary">{item.name}</Text><Text className="mt-1 text-[13px] text-zeno-text-secondary">{item.zenoId ?? "Compte ZENO"}</Text></View>
            <Chevron direction="right" size={13} />
          </Pressable>
          {isSavedList ? <Pressable onPress={() => onRemove(item)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Supprimer ${item.name} des contacts`} className="ml-2 h-10 w-10 items-center justify-center"><CloseIcon size={17} color="#6B7280" /></Pressable> : null}
        </View>
      )) : <Text className="py-8 text-center text-[14px] text-zeno-text-secondary">{isSavedList ? "Tes contacts ZENO apparaîtront ici après un transfert." : "Aucun utilisateur ZENO trouvé."}</Text>}
    </Panel>
  );
}

function AddRecipient({ name, email, onNameChange, onEmailChange, onSubmit, onCancel, busy, error }: {
  name: string; email: string; onNameChange: (value: string) => void; onEmailChange: (value: string) => void;
  onSubmit: () => void; onCancel: () => void; busy: boolean; error: string | null;
}) {
  return (
    <Panel>
      <View className="flex-row items-center justify-between">
        <Text allowFontScaling={false} className="font-bold text-[23px] text-zeno-text-primary">Add Recipient</Text>
        <Pressable onPress={onCancel} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close add recipient" className="h-10 w-10 items-center justify-center active:opacity-60">
          <CloseIcon size={32} color="#6B7280" thickness={2.5} />
        </Pressable>
      </View>
      <Field label="User Name" labelClassName="text-zeno-text-primary" value={name} onChangeText={onNameChange} placeholder="Recipient User Name" />
      <Field label="Email Address" labelClassName="text-zeno-text-primary" value={email} onChangeText={onEmailChange} placeholder="Enter Recipient Email" keyboardType="email-address" />
      {error ? <ErrorText message={error} /> : null}
      <View className="mt-auto items-center pt-8">
        <Pressable onPress={onSubmit} disabled={busy} accessibilityRole="button" accessibilityState={{ disabled: busy }} className="flex-row items-center active:opacity-80">
          <View className="h-[58px] w-[58px] items-center justify-center rounded-full bg-zeno-mint-soft">
            <PersonPlusIcon size={30} color={colors.zenoDark} />
          </View>
          <View className="ml-3 h-[68px] min-w-[220px] flex-row items-center justify-center rounded-full bg-zeno-sky px-7">
            {busy ? <ActivityIndicator color={colors.zenoDark} /> : <Text allowFontScaling={false} className="text-[20px] text-zeno-text-primary">Add Recipient</Text>}
          </View>
        </Pressable>
      </View>
    </Panel>
  );
}

const COUNTRY_PICKER_OPTIONS: { id: string; name: string; dialCode: string; emoji: string; supported: SupportedCountry | undefined }[] = [
  { id: "benin", name: "Benin", dialCode: "+229", emoji: "🇧🇯", supported: supportedCountries.find((item) => item.id === "benin") },
  { id: "cote-divoire", name: "Côte d’Ivoire", dialCode: "+225", emoji: "🇨🇮", supported: supportedCountries.find((item) => item.id === "cote-divoire") },
  { id: "cameroon", name: "Cameroon", dialCode: "+237", emoji: "🇨🇲", supported: undefined },
  { id: "senegal", name: "Senegal", dialCode: "+221", emoji: "🇸🇳", supported: undefined },
  { id: "congo", name: "Congo", dialCode: "+242", emoji: "🇨🇬", supported: undefined },
];

function CountryStep({ onSelect, onUnavailable, onClose }: {
  onSelect: (country: SupportedCountry) => void;
  onUnavailable: (name: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filteredCountries = COUNTRY_PICKER_OPTIONS.filter((item) =>
    `${item.name} ${item.dialCode}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  );

  return (
    <ScrollView
      className="mt-5 w-full flex-1 rounded-[28px] bg-white"
      contentContainerClassName="flex-grow pb-5"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row items-center justify-between px-5 pt-6">
        <Text allowFontScaling={false} className="font-semibold text-[20px] text-zeno-text-primary">Country</Text>
        <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close country selection" className="h-10 w-10 items-center justify-center active:opacity-60">
          <CloseIcon size={25} color="#B5B5B5" thickness={2.2} />
        </Pressable>
      </View>

      <View className="mb-5 mt-6 flex-row items-center px-4">
          <View className="h-[48px] flex-1 flex-row items-center rounded-full border border-black/5 bg-[#F1F1F1] px-3">
          <View className="mr-3 h-[18px] w-[18px] rounded-full border-2 border-[#858585]">
            <View className="absolute -bottom-[4px] -right-[5px] h-[8px] w-[2px] rotate-[-45deg] rounded-full bg-[#858585]" />
          </View>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search Country Or Region"
            placeholderTextColor="#777777"
            autoCapitalize="none"
            autoCorrect={false}
            className="h-full flex-1 text-[13px] text-zeno-text-primary"
            accessibilityLabel="Search country or region"
          />
        </View>
        <Pressable onPress={() => setSearch("")} hitSlop={8} className="ml-3 min-w-[46px] items-center justify-center">
          <Text allowFontScaling={false} className="text-[15px] text-zeno-text-primary">Cancel</Text>
        </Pressable>
      </View>

      {filteredCountries.map((item) => {
        return (
          <Pressable
            key={item.id}
            onPress={() => item.supported ? onSelect(item.supported) : onUnavailable(item.name)}
            accessibilityRole="button"
            className="h-[62px] flex-row items-center border-b border-black/5 bg-white px-4 active:bg-[#F4F8FC]"
          >
            {item.supported ? (
              <Image source={item.supported.flag} style={{ width: 28, height: 28, borderRadius: 14 }} contentFit="cover" />
            ) : (
              <View className="h-[28px] w-[28px] items-center justify-center overflow-hidden rounded-full bg-white"><Text className="text-[23px] leading-[28px]">{item.emoji}</Text></View>
            )}
            <Text allowFontScaling={false} className="ml-1.5 w-[48px] text-[15px] text-zeno-text-secondary">{item.dialCode}</Text>
            <Text allowFontScaling={false} className="ml-2 flex-1 font-medium text-[15px] text-zeno-text-primary">{item.name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function MobileRecipientStep({ country, onBackToCountries, providers, providerId, providerMenuOpen, onToggleProviders, onSelectProvider, phone, name, onPhoneChange, onNameChange, onContinue, canContinue, error }: {
  country: SupportedCountry; onBackToCountries: () => void; providers: ReturnType<typeof getProvidersForCountry>; providerId: string; providerMenuOpen: boolean;
  onToggleProviders: () => void; onSelectProvider: (id: string) => void; phone: string; name: string;
  onPhoneChange: (value: string) => void; onNameChange: (value: string) => void; onContinue: () => void; canContinue: boolean; error: string | null;
}) {
  const selected = providers.find((item) => item.id === providerId);
  return (
    <Panel>
      <Pressable className="mb-6 flex-row items-center" onPress={onBackToCountries} accessibilityRole="button" accessibilityLabel="Change country">
        <Image source={country.flag} style={{ width: 38, height: 38, borderRadius: 19 }} contentFit="cover" />
        <Text className="ml-3 text-[16px] text-zeno-text-secondary">{country.name}</Text>
        <View className="ml-auto mr-2" style={{ transform: [{ rotate: "180deg" }] }}><Chevron direction="right" size={12} color="#B8B8B8" thickness={3} /></View>
      </Pressable>
      <Text allowFontScaling={false} className="mb-3 text-[16px] text-zeno-text-primary">Réseau</Text>
      <Pressable onPress={onToggleProviders} accessibilityRole="button" accessibilityState={{ expanded: providerMenuOpen }} className="h-[48px] flex-row items-center rounded-full bg-[#F4F4F4] px-4">
        {selected?.logoKey ? <Image source={images.providers[selected.logoKey]} style={{ width: 38, height: 38 }} contentFit="contain" /> : <View className="h-[38px] w-[38px] items-center justify-center rounded-full bg-zeno-mint"><Text className="font-bold text-zeno-dark">O</Text></View>}
        <Text allowFontScaling={false} className="ml-4 flex-1 font-semibold text-[16px] text-zeno-text-primary">{selected?.name ?? "Choose a network"}</Text>
        <View style={{ transform: [{ rotate: providerMenuOpen ? "180deg" : "0deg" }] }}><Svg width={14} height={10} viewBox="0 0 14 10"><Path d="M1 2h12L7 9 1 2Z" fill="#333333" /></Svg></View>
      </Pressable>
      {providerMenuOpen ? <View className="rounded-b-[22px] bg-[#E7E7E7] px-4 py-1">{providers.filter((item) => item.id !== providerId).map((item) => (
        <Pressable key={item.id} onPress={() => onSelectProvider(item.id)} className="h-[40px] flex-row items-center">
          {item.logoKey ? <Image source={images.providers[item.logoKey]} style={{ width: 24, height: 24 }} contentFit="contain" /> : <View className="h-[24px] w-[24px] items-center justify-center rounded-full bg-zeno-mint"><Text className="font-bold text-zeno-dark">O</Text></View>}
          <Text className="ml-4 text-[15px] text-zeno-text-primary">{item.name}</Text>
        </Pressable>
      ))}</View> : null}
      <Field label="Number" value={phone} onChangeText={(value) => onPhoneChange(value.replace(/\D/g, "").slice(0, country.nationalNumberLength))} placeholder="01 00 00 00 00" keyboardType="phone-pad" labelClassName="text-zeno-text-primary" inputClassName="h-[48px] bg-[#F4F4F4]" />
      <Field label="Name" value={name} onChangeText={onNameChange} placeholder="Olala" labelClassName="text-zeno-text-primary" inputClassName="h-[48px] bg-[#F4F4F4]" />
      {error ? <ErrorText message={error} /> : null}
      <View className="mt-auto pt-8"><PrimaryButton label="Next" onPress={onContinue} disabled={!canContinue} disabledStyle="bright" className="h-[56px]" /></View>
    </Panel>
  );
}

function MobileMoneyAmountStep({ amount, balanceLabel, currencySymbol, decimalDigits, currencyCode, canContinue, onBack, onKey, onContinue, error }: {
  amount: string;
  balanceLabel: string;
  currencySymbol: string;
  decimalDigits: number;
  currencyCode: string;
  canContinue: boolean;
  onBack: () => void;
  onKey: (key: string) => void;
  onContinue: () => void;
  error: string | null;
}) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", decimalDigits === 0 ? "" : ".", "0", "back"];
  const amountValue = Number(amount.replace(",", ".")) || 0;
  // The reference image itself shows $20 -> 15,000 FCFA. This is a visual
  // preview only; the backend must provide and validate the live quote.
  const recipientAmount = currencyCode === "USD"
    ? Math.round(amountValue * DESIGN_USD_TO_XOF_RATE)
    : currencyCode === "XOF" ? Math.round(amountValue) : null;
  const amountCurrencySymbol = currencyCode === "XOF" ? "F" : currencySymbol;

  return (
    <View className="flex-1 px-5 pb-3">
      <View className="mt-4 h-[48px] flex-row items-center justify-center">
        <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back" className="absolute left-0 h-[42px] w-[42px] items-center justify-center rounded-[10px] bg-white active:opacity-70">
          <Image source={images.back} style={{ width: 42, height: 42 }} contentFit="contain" />
        </Pressable>
        <ZenoCardLogo height={30} variant="dark" />
      </View>

      <View className="mt-[48px] items-center">
        <View className="flex-row items-start justify-center">
          <Text allowFontScaling={false} className="mr-1 mt-[5px] text-[28px] font-semibold leading-[34px] text-zeno-dark">{amountCurrencySymbol}</Text>
          <Text allowFontScaling={false} className="text-[66px] font-bold leading-[74px] text-zeno-dark">{amount || "0"}</Text>
        </View>
        <Text allowFontScaling={false} className="mt-3 text-center text-[16px] text-zeno-dark/60">
          Your Current Balance Is <Text className="text-zeno-dark">{balanceLabel}</Text>
        </Text>
        <View className="mt-3 min-h-[48px] w-full max-w-[330px] flex-row items-center justify-center rounded-full bg-[#C8EA70] px-4">
          <Text allowFontScaling={false} numberOfLines={1} className="text-center text-[15px] text-zeno-dark/65">
            The Recipient Will Receive <Text className="font-semibold text-zeno-dark">{recipientAmount === null ? "—" : `${recipientAmount.toLocaleString(language === "fr" ? "fr-FR" : "en-US")} F`}</Text>
          </Text>
        </View>
      </View>

      <View className="mt-auto w-full pt-3">
        <View className="flex-row flex-wrap">
          {keys.map((key, index) => (
            <Pressable key={`${key}-${index}`} disabled={!key} onPress={() => key && onKey(key)} className="h-[54px] w-1/3 items-center justify-center active:opacity-50">
              <Text allowFontScaling={false} className="text-[36px] text-zeno-dark">{key === "back" ? "‹" : key}</Text>
            </Pressable>
          ))}
        </View>
        {error ? <Text accessibilityRole="alert" className="mt-2 text-center text-[14px] text-red-700">{error}</Text> : null}
        <Pressable onPress={onContinue} disabled={!canContinue} accessibilityRole="button" accessibilityState={{ disabled: !canContinue }} className="mt-3 h-[54px] items-center justify-center rounded-full bg-white active:opacity-70" style={{ opacity: canContinue ? 1 : 0.55 }}>
          <Text allowFontScaling={false} className="font-semibold text-[19px] text-zeno-dark">Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AmountStep({ flow, recipientName, amount, balanceLabel, currencySymbol, symbolPosition, decimalDigits, canContinue, onKey, onContinue, error }: {
  flow: FlowKind; recipientName: string; amount: string; balanceLabel: string; currencySymbol: string; symbolPosition: "prefix" | "suffix";
  decimalDigits: number; canContinue: boolean; onKey: (key: string) => void; onContinue: () => void; error: string | null;
}) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", decimalDigits === 0 ? "" : ".", "0", "back"];
  return (
    <Panel className="items-center">
      {flow === "mobile" ? <View className="w-full flex-row items-center"><Text className="flex-1 text-[15px] text-zeno-text-secondary">{recipientName}</Text><Text className="font-medium text-[14px] text-zeno-text-primary">{currencySymbol}</Text></View> : null}
      <Text allowFontScaling={false} className="mt-8 text-center text-[15px] text-zeno-text-secondary">{flow === "zeno" ? `Send to ${recipientName}` : `Your current balance is ${balanceLabel}`}</Text>
      <View className="mt-4 flex-row items-start justify-center">
        {symbolPosition === "prefix" ? <Text allowFontScaling={false} className="mr-1 mt-2 text-[25px] font-semibold text-zeno-text-primary">{currencySymbol}</Text> : null}
        <Text allowFontScaling={false} className="text-[54px] font-bold leading-[64px] text-zeno-text-primary">{amount || "0"}</Text>
        {symbolPosition === "suffix" ? <Text allowFontScaling={false} className="ml-2 mt-5 text-[18px] font-semibold text-zeno-text-primary">{currencySymbol}</Text> : null}
      </View>
      {flow === "mobile" ? <View className="mt-5 rounded-full bg-zeno-green/50 px-5 py-3"><Text className="text-center text-[14px] text-zeno-text-primary">Le montant reçu et les frais seront confirmés par le serveur.</Text></View> : null}
      <View className="mt-auto w-full pt-8">
        <View className="flex-row flex-wrap">{keys.map((key, index) => <Pressable key={`${key}-${index}`} disabled={!key} onPress={() => key && onKey(key)} className="h-[61px] w-1/3 items-center justify-center active:opacity-50"><Text allowFontScaling={false} className="text-[34px] text-zeno-text-primary">{key === "back" ? "‹" : key}</Text></Pressable>)}</View>
        {error ? <ErrorText message={error} /> : null}
        <View className="mt-5"><PrimaryButton label="Continue" onPress={onContinue} disabled={!canContinue} /></View>
      </View>
    </Panel>
  );
}

function ReviewStep({ title, rows, buttonLabel, onContinue, onEdit, busy = false, error }: {
  title: string; rows: [string, string][]; buttonLabel: string; onContinue: () => void; onEdit: () => void; busy?: boolean; error: string | null;
}) {
  return (
    <Panel>
      <Text allowFontScaling={false} className="font-bold text-[24px] text-zeno-text-primary">{title}</Text>
      <View className="mt-6 rounded-[22px] border border-black/10 bg-[#F4F4F4] px-5 py-2">{rows.map(([label, value]) => <View key={label} className="min-h-[52px] flex-row items-center justify-between border-b border-black/5 py-2 last:border-b-0"><Text className="max-w-[46%] text-[14px] text-zeno-text-secondary">{label}</Text><Text numberOfLines={2} className="max-w-[54%] text-right text-[14px] font-semibold text-zeno-text-primary">{value}</Text></View>)}</View>
      <Text className="mt-5 text-[14px] text-zeno-text-secondary">Vérifie les détails avant l’envoi.</Text>
      {error ? <ErrorText message={error} /> : null}
      <View className="mt-auto pt-8"><PrimaryButton label={buttonLabel} onPress={onContinue} busy={busy} /></View>
      <Pressable onPress={onEdit} className="mt-4 self-center p-3 active:opacity-60"><Text className="font-semibold text-[16px] text-zeno-text-primary">Modifier</Text></Pressable>
    </Panel>
  );
}

function PinStep({ pin, onPinChange, busy, error }: {
  pin: string; onPinChange: (value: string) => void; busy: boolean; error: string | null;
}) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];
  return (
    <View className="flex-1 px-5 pb-4">
      <View className="mt-[72px] items-center"><ZenoCardLogo height={52} variant="dark" /><Text allowFontScaling={false} className="mt-4 font-semibold text-[25px] text-zeno-dark">Enter Your PIN</Text></View>
      <View className="mt-8 flex-row items-center justify-center gap-x-6">{Array.from({ length: PIN_LENGTH }).map((_, index) => <View key={index} className={`h-[9px] w-[9px] rounded-full ${index < pin.length ? "bg-zeno-dark" : "bg-zeno-dark/25"}`} />)}</View>
      {error ? <ErrorText message={error} light /> : null}
      {busy ? <View className="mt-5"><ActivityIndicator color={colors.zenoDark} /></View> : null}
      <View className="flex-1" />
      <View className="flex-row flex-wrap">{keys.map((key, index) => <Pressable key={`${key}-${index}`} disabled={!key || busy} onPress={() => key === "back" ? onPinChange(pin.slice(0, -1)) : key && pin.length < PIN_LENGTH ? onPinChange(pin + key) : undefined} className="h-[68px] w-1/3 items-center justify-center active:opacity-50">{key ? <Text allowFontScaling={false} className="text-[38px] text-zeno-dark">{key === "back" ? "‹" : key}</Text> : null}</Pressable>)}</View>
    </View>
  );
}

function TransferResult({ receipt, onDone }: { receipt: TransferReceipt | null; onDone: () => void }) {
  const completed = receipt?.status === "completed";
  const failed = receipt?.status === "failed";
  return (
    <Panel>
      <View className="flex-1 items-center justify-center px-2">
        <View className={`h-[92px] w-[92px] items-center justify-center rounded-full ${completed ? "bg-zeno-green" : failed ? "bg-zeno-error/10" : "bg-zeno-warning/15"}`}><Text className="text-[42px] font-bold text-zeno-dark">{completed ? "✓" : failed ? "×" : "…"}</Text></View>
        <Text allowFontScaling={false} className="mt-6 text-center font-bold text-[25px] text-zeno-text-primary">{completed ? "Transfert effectué" : failed ? "Transfert échoué" : "Transfert en attente"}</Text>
        <Text className="mt-2 text-center text-[15px] text-zeno-text-secondary">{receipt ? formatAmount(receipt.amount, receipt.currency) : ""}</Text>
        {receipt ? <View className="mt-7 w-full rounded-[20px] bg-[#F4F4F4] p-5"><View className="flex-row justify-between"><Text className="text-[14px] text-zeno-text-secondary">Bénéficiaire</Text><Text className="font-medium text-zeno-text-primary">{receipt.recipientName}</Text></View><View className="mt-4 flex-row justify-between"><Text className="text-[14px] text-zeno-text-secondary">Référence</Text><Text className="font-medium text-zeno-text-primary">{receipt.reference}</Text></View><View className="mt-4 flex-row justify-between"><Text className="text-[14px] text-zeno-text-secondary">Statut</Text><Text className="font-semibold text-zeno-text-primary">{completed ? "Terminé" : failed ? "Échoué" : "En attente"}</Text></View></View> : null}
      </View>
      <View className="pt-8"><PrimaryButton label="Terminé" onPress={onDone} /></View>
    </Panel>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType = "default", labelClassName = "text-white", inputClassName = "h-[60px] bg-zeno-sky" }: {
  label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: "default" | "email-address" | "phone-pad"; labelClassName?: string; inputClassName?: string;
}) {
  return <View className="mt-6"><Text allowFontScaling={false} className={`mb-3 text-[15px] ${labelClassName}`}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#828282" keyboardType={keyboardType} autoCapitalize={keyboardType === "email-address" ? "none" : "words"} autoCorrect={false} className={`${inputClassName} rounded-full px-5 text-[16px] text-zeno-text-primary`} /></View>;
}

function PrimaryButton({ label, onPress, disabled = false, busy = false, disabledStyle = "muted", className = "" }: {
  label: string; onPress: () => void; disabled?: boolean; busy?: boolean; disabledStyle?: "muted" | "bright"; className?: string;
}) {
  const visuallyDisabled = disabled || busy;
  const muted = visuallyDisabled && disabledStyle === "muted";
  return <Pressable onPress={onPress} disabled={visuallyDisabled} accessibilityRole="button" accessibilityState={{ disabled: visuallyDisabled }} className={`h-[62px] flex-row items-center justify-center rounded-full ${muted ? "bg-zeno-green/45" : "bg-zeno-green active:opacity-80"} ${className}`}>
    {busy ? <ActivityIndicator color={colors.zenoDark} /> : <Text allowFontScaling={false} className={`font-bold text-[19px] ${muted ? "text-zeno-dark/40" : "text-zeno-dark"}`}>{label}</Text>}
  </Pressable>;
}

function ErrorText({ message, light = false }: { message: string; light?: boolean }) {
  return <Text accessibilityRole="alert" className={`mt-4 text-[14px] ${light ? "text-zeno-dark" : "text-zeno-error"}`}>{message}</Text>;
}
