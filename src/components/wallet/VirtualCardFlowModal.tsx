import { LocalizedText as Text } from "@/components/ui/LocalizedText";
/**
 * VirtualCardFlowModal
 *
 * Hosts all sub-flows launched from the ZENO Card surface:
 *   - topup         (lime-green full screen with numpad)
 *   - details-pin   (bottom sheet — PIN entry before revealing card)
 *   - details       (bottom sheet — revealed card data)
 *   - more          (bottom sheet — Transfer / Freeze / Unfreeze)
 *   - transfer-info (light full screen — transfer review)
 *   - freeze        (bottom sheet — freeze confirmation)
 *   - unfreeze      (bottom sheet — unfreeze confirmation)
 *
 * Design ref: assets/03 · Carte/
 * Architecture: AGENTS.md — no financial logic in the UI; service calls only.
 */

import { PIN_LENGTH } from "@/components/auth/PinPad";
import { CloseIcon } from "@/components/ui/CloseIcon";
import { ZenoLoading } from "@/components/ui/ZenoLoading";
import { CopyToast } from "@/components/ui/CopyToast";
import { CopyIcon } from "@/components/ui/ProfileIcons";
import { CardPinEntryScreen } from "@/components/wallet/CardPinEntryScreen";
import { waitForPinLoading } from "@/components/auth/PinProcessingOverlay";
import { images } from "@/constants/images";
import { ZenoCardLogo } from "@/components/wallet/ZenoCardLogo";
import {
    isCardSandboxEnabled,
    virtualCardService,
    type CardBalanceResult,
    type VirtualCardDetails,
    type VirtualCardStatus,
} from "@/features/virtual-card/card-service";
import { recordCardMovement } from "@/features/virtual-card/record-card-activity";
import { useLanguageStore } from "@/store/language-store";
import { useSecurityStore } from "@/store/security-store";
import { useWalletStore } from "@/store/wallet-store";
import { concealMoney } from "@/lib/money-visibility";
import { useAuth, useUser } from "@clerk/expo";
import * as LocalAuthentication from "expo-local-authentication";
import * as Clipboard from "expo-clipboard";
import * as Crypto from "expo-crypto";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import {
    BackHandler,
    Pressable,

    View,
    useWindowDimensions} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type CardFlowPanel =
  | "topup"
  | "details-pin"
  | "details"
  | "more"
  | "transfer-info"
  | "freeze"
  | "unfreeze";

type Props = {
  panel: CardFlowPanel | null;
  onClose: () => void;
  onPanelChange: (panel: CardFlowPanel) => void;
  cardBalance: string;
  fundingWalletBalance?: string;
  /** Called after freeze/unfreeze succeeds so ZenoCardSurface can update visuals. */
  onCardStatusChange?: (status: VirtualCardStatus) => void;
  onBalanceChange?: (result: CardBalanceResult) => void;
};

const LIME = "#C7FF4A";
const DARK = "#0A1712";
const LIGHT_BG = "#F4FAFF";

// Panels rendered as a full-screen slide (opaque background).
const FULL_SCREEN: CardFlowPanel[] = ["topup", "transfer-info", "details-pin"];

export function VirtualCardFlowModal({
  panel,
  onClose,
  onPanelChange,
  cardBalance,
  fundingWalletBalance = "0.00",
  onCardStatusChange,
  onBalanceChange,
}: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { getToken } = useAuth();
  const { user } = useUser();
  const language = useLanguageStore((state) => state.language);
  const verifyPin = useSecurityStore((state) => state.verifyPin);
  const biometricEnabled = useSecurityStore((state) => state.biometricEnabled);
  const isBalanceHidden = useWalletStore((state) => state.isBalanceHidden);

  const [pin, setPin] = useState("");
  const [details, setDetails] = useState<VirtualCardDetails | null>(null);
  const [cardStatus, setCardStatus] = useState<VirtualCardStatus | null>(null);
  const [topupAmount, setTopupAmount] = useState("");
  const [transferDirection, setTransferDirection] = useState<"topup" | "withdraw">("topup");
  const [pendingRequest, setPendingRequest] = useState<{ amount: string; key: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // Load card status when entering the "more" panel.
  useEffect(() => {
    if (panel !== "more" || cardStatus !== null) return;
    let cancelled = false;
    const load = async () => {
      const token = await getToken();
      if (!token && !isCardSandboxEnabled) return;
      const result = await virtualCardService.getStatus(token ?? "");
      if (cancelled) return;
      if (result.ok) setCardStatus(result.data.status);
      else setError(result.error);
    };
    void load();
    return () => { cancelled = true; };
  }, [getToken, panel, cardStatus]);

  // ── Shared actions ────────────────────────────────────────────────────────

  const close = useCallback(() => {
    setPin("");
    setDetails(null);
    setError(null);
    setTopupAmount("");
    setTransferDirection("topup");
    setPendingRequest(null);
    onClose();
  }, [onClose]);

  const handleBack = useCallback(() => {
    setError(null);
    if (panel === "freeze" || panel === "unfreeze") {
      onPanelChange("more");
    } else if (panel === "transfer-info") {
      onPanelChange("topup");
    } else if (panel === "details") {
      close();
    } else if (panel === "topup") {
      if (transferDirection === "withdraw") onPanelChange("more");
      else close();
    } else {
      close();
    }
  }, [close, onPanelChange, panel, transferDirection]);

  useEffect(() => {
    if (panel === null) return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        handleBack();
        return true;
      }
    );
    return () => subscription.remove();
  }, [handleBack, panel]);

  const revealCard = async (biometricAuthorized = false) => {
    setError(null);
    if (!user?.id || (!biometricAuthorized && pin.length !== PIN_LENGTH)) {
      setError("Saisissez votre PIN à 6 chiffres.");
      return;
    }
    const loadingStartedAt = Date.now();
    setBusy(true);
    const validPin = biometricAuthorized || await verifyPin(user.id, pin);
    if (!validPin) {
      await waitForPinLoading(loadingStartedAt);
      setBusy(false);
      setPin("");
      setError("PIN incorrect. Réessayez.");
      return;
    }
    const token = await getToken();
    if (!token && !isCardSandboxEnabled) {
      await waitForPinLoading(loadingStartedAt);
      setBusy(false);
      setError("Reconnectez-vous pour afficher les données de la carte.");
      return;
    }
    const result = await virtualCardService.getDetails(token ?? "");
    await waitForPinLoading(loadingStartedAt);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const data = result.data;
    if (
      ![data.cardholderName, data.number, data.expiry, data.cvc, data.last4].every(
        (v) => typeof v === "string" && v.length > 0
      )
    ) {
      setError("Les données de la carte reçues sont incomplètes.");
      return;
    }
    setDetails(data);
    setPin("");
    onPanelChange("details");
  };

  const revealWithBiometrics = async () => {
    if (biometricEnabled !== true) return;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Confirmer l’accès à votre carte ZENO",
      cancelLabel: "Annuler",
    });
    if (result.success) await revealCard(true);
  };

  // Auto-verify PIN when 6 digits are entered in details-pin screen
  useEffect(() => {
    if (panel === "details-pin" && pin.length === PIN_LENGTH && !busy) {
      revealCard();
    }
  }, [pin, panel, busy]);

  const updateCardStatus = async (next: VirtualCardStatus) => {
    setError(null);
    setBusy(true);
    const token = await getToken();
    if (!token && !isCardSandboxEnabled) {
      setBusy(false);
      setError("Reconnectez-vous pour gérer votre carte.");
      return;
    }
    const result =
      next === "frozen"
        ? await virtualCardService.freeze(token ?? "")
        : await virtualCardService.unfreeze(token ?? "");
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.data.status !== next) {
      setError("Le statut retourné par le service est invalide.");
      return;
    }
    setCardStatus(next);
    onCardStatusChange?.(next);
    onPanelChange("more");
  };

  const confirmTransfer = async () => {
    setError(null);
    if (!/^\d+(\.\d{1,2})?$/.test(topupAmount) || Number(topupAmount) <= 0) {
      setError("Saisissez un montant valide.");
      return;
    }
    setBusy(true);
    const token = await getToken();
    if (!token && !isCardSandboxEnabled) {
      setBusy(false);
      setError("Reconnectez-vous pour confirmer le transfert.");
      return;
    }
    const key = pendingRequest?.amount === topupAmount
      ? pendingRequest.key
      : Crypto.randomUUID();
    setPendingRequest({ amount: topupAmount, key });
    const result = transferDirection === "topup"
      ? await virtualCardService.topUp(token ?? "", topupAmount, key)
      : await virtualCardService.transferToWallet(token ?? "", topupAmount, key);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onBalanceChange?.(result.data);
    recordCardMovement({
      amount: topupAmount,
      walletBalance: result.data.walletBalance,
      cardBalance: Number(result.data.cardBalance),
      direction: transferDirection,
      transactionId: result.data.transactionId,
      isSandbox: isCardSandboxEnabled,
    });
    close();
  };

  // Numpad for top-up amount entry.
  const handleNumpad = (key: string) => {
    if (key === "<") {
      setTopupAmount((prev) => prev.slice(0, -1));
      return;
    }
    if (key === "." && topupAmount.includes(".")) return;
    if (topupAmount.length >= 10) return;
    setTopupAmount((prev) => (prev === "0" && key !== "." ? key : prev + key));
  };

  if (panel === null) return null;

  const isFullScreen = FULL_SCREEN.includes(panel);

  return (
    <View className="absolute inset-0 z-50">
      {isFullScreen ? (
        /* ── Full-screen panels ────────────────────────────────────────── */
        <View className="flex-1">
          {panel === "details-pin" && (
            <CardPinEntryScreen
              pin={pin}
              onPinChange={(v) => {
                setPin(v);
                setError(null);
              }}
              onBack={close}
              onBiometric={biometricEnabled === true ? revealWithBiometrics : undefined}
              error={error}
              busy={busy}
            />
          )}
          {panel === "topup" && (
            <View
              className="flex-1"
              style={{
                backgroundColor: LIME,
              }}
            >
              <TopUpPanel
                amount={topupAmount}
                isBalanceHidden={isBalanceHidden}
                cardBalance={cardBalance}
                fundingWalletBalance={fundingWalletBalance}
                language={language}
                direction={transferDirection}
                onNumpad={handleNumpad}
                onBack={handleBack}
                onContinue={() => onPanelChange("transfer-info")}
                insets={insets}
              />
            </View>
          )}
          {panel === "transfer-info" && (
            <View
              className="flex-1"
              style={{
                backgroundColor: LIGHT_BG,
              }}
            >
              <TransferReviewPanel
                amount={topupAmount}
                isBalanceHidden={isBalanceHidden}
                direction={transferDirection}
                busy={busy}
                error={error}
                onBack={handleBack}
                onConfirm={() => void confirmTransfer()}
                insets={insets}
              />
            </View>
          )}
        </View>
      ) : panel === "details" && details ? (
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.38)" }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close card details"
            onPress={close}
            className="absolute inset-0"
          />
          <View
            className="overflow-hidden rounded-t-[32px]"
            style={{
              height: Math.max(windowHeight * 0.47, 360),
              paddingBottom: Math.max(insets.bottom, 14),
              backgroundColor: "#2A461A",
            }}
          >
            <CardDetailsPanel details={details} onClose={close} />
          </View>
        </View>
      ) : (
        /* ── Bottom sheet panels ───────────────────────────────────────── */
        <View className="flex-1 justify-end">
          <Pressable
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close card options"
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.38)" }}
          />
          <View
            className="rounded-t-[28px] bg-white"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            {/* Drag handle and close control */}
            <View className="relative items-center pt-3 pb-1">
              <View className="h-[4px] w-[40px] rounded-full bg-black/10" />
              {panel !== "more" ? (
                <Pressable
                  onPress={close}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Close card options"
                  className="absolute right-5 top-1 h-9 w-9 items-center justify-center rounded-full active:bg-black/5"
                >
                  <CloseIcon size={18} color={DARK} />
                </Pressable>
              ) : null}
            </View>

            {panel === "more" && (
              <MorePanel
                cardStatus={cardStatus}
                onTransfer={() => { setTransferDirection("withdraw"); setTopupAmount(""); setError(null); onPanelChange("topup"); }}
                onFreeze={() => { setError(null); onPanelChange("freeze"); }}
                onUnfreeze={() => { setError(null); onPanelChange("unfreeze"); }}
                onClose={close}
              />
            )}

            {(panel === "freeze" || panel === "unfreeze") && (
              <FreezePanel
                mode={panel}
                busy={busy}
                error={error}
                onConfirm={() =>
                  updateCardStatus(panel === "freeze" ? "frozen" : "active")
                }
                onCancel={() => { setError(null); onPanelChange("more"); }}
              />
            )}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Top Up Panel ─────────────────────────────────────────────────────────────


function TopUpPanel({
  amount,
  isBalanceHidden,
  cardBalance,
  fundingWalletBalance,
  language,
  direction,
  onNumpad,
  onBack,
  onContinue,
  insets,
}: {
  amount: string;
  isBalanceHidden: boolean;
  cardBalance: string;
  fundingWalletBalance: string;
  language: "en" | "fr";
  direction: "topup" | "withdraw";
  onNumpad: (key: string) => void;
  onBack: () => void;
  onContinue: () => void;
  insets: ReturnType<typeof useSafeAreaInsets>;
}) {
  const hasAmount = amount.length > 0 && amount !== "0" && amount !== ".";

  return (
    <View className="flex-1 px-6" style={{ paddingTop: 0 }}>
      {/* Header */}
      <View className="relative flex-row items-center justify-center pt-7 pb-3">
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="absolute -left-2 top-7 h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white shadow-low active:opacity-60"
        >
          <Image source={images.back} style={{ width: 50, height: 50 }} contentFit="contain" />
        </Pressable>
        <ZenoCardLogo height={22} variant="dark" />
      </View>

      {/* Amount display */}
      <View className="mt-4 items-center">
        <View className="flex-row items-start justify-center">
          <Text
            allowFontScaling={false}
            className="mr-1 mt-2 text-[24px] font-bold leading-[30px]"
            style={{ color: DARK }}
          >
            $
          </Text>
          <Text
            allowFontScaling={false}
            className="text-[64px] font-bold leading-[72px]"
            style={{ color: DARK }}
          >
            {concealMoney(amount || "00", isBalanceHidden)}
          </Text>
        </View>
        <Text allowFontScaling={false} className="mt-1 text-[13px]" style={{ color: DARK + "99" }}>
          {language === "fr"
            ? direction === "topup" ? "Solde du Wallet principal : " : "Solde de la carte : "
            : direction === "topup" ? "Main Wallet balance: " : "Card balance: "}
          <Text className="font-semibold" style={{ color: DARK }}>
            {concealMoney(`$${direction === "topup" ? fundingWalletBalance : cardBalance}`, isBalanceHidden)}
          </Text>
        </Text>
        <Text allowFontScaling={false} className="mt-1 text-[14px]" style={{ color: DARK + "99" }}>
          {direction === "withdraw"
            ? language === "fr" ? "Transférer vers le Wallet ZENO" : "Transfer to your ZENO Wallet"
            : null}
        </Text>

        {/* Virtual Card chip */}
        <View
          className="mt-4 flex-row items-center rounded-full px-4 py-2.5 gap-x-3"
          style={{ backgroundColor: DARK }}
        >
          <View
            className="h-[30px] w-[30px] rounded-full"
            style={{ backgroundColor: "#B8E87A" }}
          />
          <Text
            allowFontScaling={false}
            className="font-semibold text-[15px] text-white"
          >
            {language === "fr" ? "Carte virtuelle" : "Virtual Card"}
          </Text>
          <Text
            allowFontScaling={false}
            className="text-[15px] text-white/60"
          >
            ••••• 5678
          </Text>
        </View>
      </View>

      {/* Numpad */}
      <View className="mt-6 flex-1">
        <Numpad onPress={onNumpad} />
      </View>

      {/* Continue button */}
      <Pressable
        onPress={onContinue}
        disabled={!hasAmount}
        className="mb-4 min-h-[58px] items-center justify-center rounded-full"
        style={{
          backgroundColor: hasAmount
            ? "rgba(255,255,255,0.95)"
            : "rgba(255,255,255,0.45)",
          marginBottom: Math.max(insets.bottom, 16),
        }}
      >
        <Text
          allowFontScaling={false}
          className="text-[17px] font-bold"
          style={{ color: DARK }}
        >
          Continue
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Transfer Review Panel ────────────────────────────────────────────────────

function TransferReviewPanel({
  amount,
  isBalanceHidden,
  direction,
  busy,
  error,
  onBack,
  onConfirm,
  insets,
}: {
  amount: string;
  isBalanceHidden: boolean;
  direction: "topup" | "withdraw";
  busy: boolean;
  error: string | null;
  onBack: () => void;
  onConfirm: () => void;
  insets: ReturnType<typeof useSafeAreaInsets>;
}) {
  return (
    <View className="flex-1 px-6" style={{ paddingTop: 0 }}>
      {/* Header */}
      <View className="relative flex-row items-center justify-center pt-7 pb-3">
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="absolute -left-2 top-7 h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white shadow-low active:opacity-60"
        >
          <Image source={images.back} style={{ width: 50, height: 50 }} contentFit="contain" />
        </Pressable>
        <ZenoCardLogo height={22} variant="dark" />
      </View>

      {/* Title */}
      <Text
        allowFontScaling={false}
        className="mt-4 text-[28px] font-bold"
        style={{ color: DARK }}
      >
        {direction === "topup" ? "Top Up Review" : "Transfer Review"}
      </Text>

      {/* Source and destination are explicit because the card has its own balance. */}
      <View className="mt-6 flex-row items-center rounded-[20px] bg-white p-4 gap-x-3">
        <View
          className="h-[52px] w-[52px] rounded-full"
          style={{ backgroundColor: DARK }}
        />
        <View>
          <Text
            allowFontScaling={false}
            className="font-semibold text-[16px]"
            style={{ color: DARK }}
          >
            {direction === "topup" ? "Wallet Balance" : "Virtual Card"}
          </Text>
          <Text allowFontScaling={false} className="text-[13px] text-[#6B7280]">
            ****5678
          </Text>
        </View>
      </View>

      {/* Amount pill */}
      <View className="mt-4 items-center">
        <View className="rounded-full px-8 py-3" style={{ backgroundColor: LIME }}>
          <Text
            allowFontScaling={false}
            className="text-[22px] font-bold"
            style={{ color: DARK }}
          >
            {concealMoney(`$${amount}`, isBalanceHidden)}
          </Text>
        </View>
      </View>

      {/* Destination */}
      <View className="mt-4 flex-row items-center rounded-[20px] bg-white p-4 gap-x-3">
        <View
          className="h-[52px] w-[52px] rounded-full"
          style={{ backgroundColor: DARK }}
        />
        <View>
          <Text
            allowFontScaling={false}
            className="font-semibold text-[16px]"
            style={{ color: DARK }}
          >
            {direction === "topup" ? "Virtual Card" : "Wallet Balance"}
          </Text>
          <Text allowFontScaling={false} className="text-[13px] text-[#6B7280]">
            Account Details
          </Text>
        </View>
      </View>

      <View className="flex-1" />

      {error ? <Text className="mb-3 rounded-xl bg-[#FEE2E2] p-3 text-[13px] text-[#B91C1C]">{error}</Text> : null}

      {/* Confirm */}
      <Pressable
        onPress={onConfirm}
        disabled={busy}
        className="min-h-[58px] items-center justify-center rounded-full"
        style={{
          backgroundColor: LIME,
          marginBottom: Math.max(insets.bottom, 24),
        }}
      >
        <Text
          allowFontScaling={false}
          className="text-[17px] font-bold"
          style={{ color: DARK }}
        >
          {busy ? "Processing…" : direction === "topup" ? "Top Up Card" : "Withdraw Money"}
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Card Details Panel ─────────────────────────────────────────────────────

function CardDetailsPanel({
  details,
  onClose,
}: {
  details: VirtualCardDetails;
  onClose: () => void;
}) {
  const language = useLanguageStore((state) => state.language);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (value: string, fieldName: string) => {
    try {
      await Clipboard.setStringAsync(value);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };
  const cardNumber = details.number.replace(/\s/g, "").replace(/(\d{4})(?=\d)/g, "$1 ").trim();

  return (
    <View className="flex-1 px-5 pt-5">
        <View className="relative items-center justify-center">
          <Text
            allowFontScaling={false}
            className="text-center text-[24px] font-bold"
            style={{ color: "#C4EC5C" }}
          >
            Card Details
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close card details"
            hitSlop={12}
            className="absolute right-0 h-9 w-9 items-center justify-center rounded-full active:bg-white/10"
          >
            <CloseIcon size={18} color="#F3FFD2" />
          </Pressable>
        </View>
        <View className="mt-4 gap-y-3">
          <DetailRow
            label={language === "fr" ? "Numéro de carte" : "Card Number"}
            value={cardNumber}
            onCopy={() => handleCopy(cardNumber, "Card Number")}
          />
          <DetailRow
            label="CVC"
            value={details.cvc}
            onCopy={() => handleCopy(details.cvc, "CVC")}
          />
          <DetailRow
            label={language === "fr" ? "Date d'expiration" : "Expiry Date"}
            value={details.expiry}
            onCopy={() => handleCopy(details.expiry, "Expiry")}
          />
      </View>
      <CopyToast visible={copiedField !== null} message="Copied!" />
    </View>
  );
}

function DetailRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <View>
        <Text
          allowFontScaling={false}
          className="mb-1.5 text-[14px] font-medium text-[#F3FFD2]"
        >
          {label}
        </Text>
      <View className="min-h-[54px] flex-row items-center justify-between rounded-full bg-[#E7F9CA] px-4">
        <Text
          allowFontScaling={false}
          selectable
          numberOfLines={1}
          adjustsFontSizeToFit
          className="flex-1 text-[16px] font-semibold text-[#192711]"
        >
          {value}
        </Text>
      <Pressable
        onPress={onCopy}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Copy ${label}`}
        className="ml-3 h-9 w-9 items-center justify-center rounded-full active:opacity-60"
      >
        <CopyIcon size={20} color="#2A461A" />
      </Pressable>
      </View>
    </View>
  );
}

// ─── More Panel (bottom sheet) ────────────────────────────────────────────────

function MorePanel({
  cardStatus,
  onTransfer,
  onFreeze,
  onUnfreeze,
  onClose,
}: {
  cardStatus: VirtualCardStatus | null;
  onTransfer: () => void;
  onFreeze: () => void;
  onUnfreeze: () => void;
  onClose: () => void;
}) {
  const isFrozen = cardStatus === "frozen";

  return (
    <View className="pb-2">
      <OptionRow
        icon="💳"
        label="Transfer To Balance"
        onPress={onTransfer}
      />
      {isFrozen ? (
        <OptionRow icon="🔥" label="Unfreeze Card" onPress={onUnfreeze} />
      ) : (
        <OptionRow icon="❄️" label="Freeze Card" onPress={onFreeze} />
      )}
      {cardStatus !== null ? (
        <Text className="px-6 pt-2 pb-1 text-[12px] text-[#6B7280] text-center">
          Card is currently{" "}
          <Text className="font-semibold">
            {isFrozen ? "frozen" : "active"}
          </Text>
        </Text>
      ) : (
        <View className="flex-row items-center justify-center py-3">
          <ZenoLoading variant="green" size={24} />
          <Text className="ml-2 text-[13px] text-[#6B7280]">
            Loading card status…
          </Text>
        </View>
      )}
    </View>
  );
}

function OptionRow({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-6 py-5 border-b border-black/[0.06] active:bg-black/[0.03]"
    >
      <View
        className="h-[40px] w-[40px] items-center justify-center rounded-full mr-4"
        style={{ backgroundColor: LIME + "55" }}
      >
        <Text className="text-[18px]">{icon}</Text>
      </View>
      <Text
        allowFontScaling={false}
        className="flex-1 text-[17px] font-semibold"
        style={{ color: DARK }}
      >
        {label}
      </Text>
      <Text className="text-[20px] text-[#6B7280]">›</Text>
    </Pressable>
  );
}

// ─── Freeze / Unfreeze Confirmation (bottom sheet) ────────────────────────────

function FreezePanel({
  mode,
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  mode: "freeze" | "unfreeze";
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isFreeze = mode === "freeze";

  return (
    <View className="px-6 pt-3 pb-2">
      <Text
        allowFontScaling={false}
        className="text-[26px] font-bold"
        style={{ color: DARK }}
      >
        {isFreeze ? "Freeze Card" : "Unfreeze Card"}
      </Text>
      <Text
        allowFontScaling={false}
        className="mt-3 text-[15px] leading-6 text-[#6B7280]"
      >
        {isFreeze
          ? "No one will be able to use this card, including you. You can turn it back on anytime."
          : "This will make the card usable again."}
      </Text>
      {error ? (
        <Text className="mt-3 rounded-xl bg-[#FEE2E2] p-3 text-[13px] text-[#B91C1C]">
          {error}
        </Text>
      ) : null}
      <Pressable
        onPress={onConfirm}
        disabled={busy}
        className="mt-6 min-h-[56px] items-center justify-center rounded-full"
        style={{ backgroundColor: isFreeze ? "#FFE4E4" : LIME }}
      >
        {busy ? (
          <ZenoLoading variant="green" size={24} />
        ) : (
          <Text
            allowFontScaling={false}
            className="text-[16px] font-bold"
            style={{ color: isFreeze ? "#EF4444" : DARK }}
          >
            {isFreeze ? "Yes, freeze my card" : "Yes, unfreeze my card"}
          </Text>
        )}
      </Pressable>
      <Pressable onPress={onCancel} className="mt-4 items-center py-3">
        <Text
          allowFontScaling={false}
          className="font-semibold text-[15px]"
          style={{ color: DARK }}
        >
          No, cancel
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Numpad ───────────────────────────────────────────────────────────────────

const NUMPAD_KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "<"],
];

function Numpad({ onPress }: { onPress: (key: string) => void }) {
  return (
    <View className="flex-1 justify-evenly">
      {NUMPAD_KEYS.map((row, ri) => (
        <View key={ri} className="flex-row justify-evenly">
          {row.map((key) => (
            <Pressable
              key={key}
              onPress={() => onPress(key)}
              hitSlop={10}
              className="items-center justify-center active:opacity-50"
              style={{ minWidth: 72, minHeight: 50 }}
            >
              <Text
                allowFontScaling={false}
                className="text-[36px] font-semibold"
                style={{ color: DARK }}
              >
                {key}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}
