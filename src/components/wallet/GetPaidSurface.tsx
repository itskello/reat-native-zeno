import { LocalizedTextInput as TextInput } from "@/components/ui/LocalizedText";
import { LocalizedText as Text } from "@/components/ui/LocalizedText";
import { ZenoLoading } from "@/components/ui/ZenoLoading";
import { Chevron } from "@/components/ui/Chevron";
import { CloseIcon } from "@/components/ui/CloseIcon";
import { images } from "@/constants/images";
import { springs } from "@/constants/motion";
import { formatAmount } from "@/data/currencies";
import { getFinancialTitleSegments, type FinancialTitleKey } from "@/lib/localization";
import { getPaidService, type PaymentLink, type PaymentRequestReceipt } from "@/features/payments/get-paid-service";
import { transferService } from "@/features/transfers/transfer-service";
import { cardDragY } from "@/store/wallet-gesture";
import { useRecipientStore, type Recipient } from "@/store/recipient-store";
import { useWalletNav } from "@/store/wallet-nav";
import { useWalletStore } from "@/store/wallet-store";
import { concealMoney } from "@/lib/money-visibility";
import { useLanguageStore } from "@/store/language-store";
import { colors } from "@/theme/colors";
import { useAuth } from "@clerk/expo";
import * as Clipboard from "expo-clipboard";
import * as Crypto from "expo-crypto";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Share, Text as NativeText, View } from "react-native";
import { withSpring } from "react-native-reanimated";

type GetPaidSurfaceProps = { contentTopGap: number };
type Page = "menu" | "links-home" | "link-create" | "link-list" | "link-detail" | "contacts" | "request-amount" | "request-review" | "request-note" | "request-confirm" | "qr";
type Currency = "XOF" | "USD" | "EUR";

/** Every subflow replaces the content of the existing GETPAID Dynamic Island room. */
export function GetPaidSurface({ contentTopGap }: GetPaidSurfaceProps) {
  const goHome = useWalletNav((state) => state.goHome);
  const wallet = useWalletStore((state) => state.wallet);
  const isBalanceHidden = useWalletStore((state) => state.isBalanceHidden);
  const language = useLanguageStore((state) => state.language);
  const recipients = useRecipientStore((state) => state.recent);
  const setRecipients = useRecipientStore((state) => state.setRecipients);
  const { getToken } = useAuth();

  const [page, setPage] = useState<Page>("menu");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [selectedLink, setSelectedLink] = useState<PaymentLink | null>(null);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [linkAmount, setLinkAmount] = useState("");
  const [linkImage, setLinkImage] = useState<{ uri: string; name: string; mimeType: string } | null>(null);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Recipient[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [requestAmount, setRequestAmount] = useState("");
  const [requestCurrency, setRequestCurrency] = useState<Currency>((wallet?.currency as Currency) ?? "XOF");
  const [note, setNote] = useState("");
  const [requestReceipt, setRequestReceipt] = useState<PaymentRequestReceipt | null>(null);
  const [qrPayload, setQrPayload] = useState("");
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [sellerCode, setSellerCode] = useState("");
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);
  const amountValue = Number(requestAmount.replace(",", ".")) || 0;
  const amountValid = amountValue > 0 && Number.isFinite(amountValue);
  const linkAmountValue = Number(linkAmount.replace(",", ".")) || 0;

  const close = useCallback(() => {
    cardDragY.value = withSpring(0, springs.liquid);
    goHome();
  }, [goHome]);

  const loadLinks = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) { setError("Ta session a expiré. Reconnecte-toi puis réessaie."); return; }
      const result = await getPaidService.listLinks(token);
      if (!result.ok) { setError(result.error); return; }
      setLinks(result.data.links);
    } catch {
      setError("Impossible de charger tes liens de paiement.");
    } finally { setBusy(false); }
  }, [getToken]);

  const openContacts = useCallback(async () => {
    setPage("contacts"); setError(null); setQuery(""); setSearchResults([]); setSearching(false);
    try {
      const token = await getToken();
      if (!token) { setError("Ta session a expiré. Reconnecte-toi puis réessaie."); return; }
      const result = await transferService.listRecipients(token);
      if (result.ok) setRecipients(result.data.recipients);
      else setError(result.error);
    } catch { setError("Impossible de charger tes contacts ZENO."); }
  }, [getToken, setRecipients]);

  useEffect(() => {
    const normalized = query.trim();
    if (page !== "contacts" || normalized.length === 0) return;
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const token = await getToken();
          if (!token) return;
          const result = await transferService.searchRecipients(token, normalized, controller.signal);
          if (active && result.ok) setSearchResults(result.data.recipients);
          else if (active && !result.ok) setError(result.error);
        } catch {
          if (active) setError("La recherche des comptes ZENO est indisponible.");
        } finally { if (active) setSearching(false); }
      })();
    }, 180);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [getToken, page, query]);

  const createLink = async () => {
    if (!linkTitle.trim() || linkAmountValue <= 0 || !Number.isFinite(linkAmountValue) || busy) return;
    setBusy(true); setError(null);
    try {
      const token = await getToken();
      if (!token) { setError("Ta session a expiré. Reconnecte-toi puis réessaie."); return; }
      const result = await getPaidService.createLink(token, {
        title: linkTitle.trim(), description: linkDescription.trim(), amount: Number(linkAmount.replace(",", ".")),
        currency: requestCurrency, idempotencyKey: Crypto.randomUUID(), image: linkImage,
      });
      if (!result.ok) { setError(result.error); return; }
      setSelectedLink(result.data.link); setLinks((current) => [result.data.link, ...current.filter((item) => item.id !== result.data.link.id)]);
      setPage("link-detail");
    } catch { setError("Le lien n’a pas pu être créé. Réessaie."); }
    finally { setBusy(false); }
  };

  const chooseLinkImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError("Autorise l’accès à tes photos pour ajouter une image.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.85,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      setLinkImage({
        uri: asset.uri,
        name: asset.fileName ?? `payment-link-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? "image/jpeg",
      });
      setError(null);
    } catch {
      setError("Impossible d’ouvrir la galerie. Réessaie.");
    }
  };

  const submitRequest = async () => {
    if (!selectedRecipient || !amountValid || busy) return;
    setBusy(true); setError(null);
    try {
      const token = await getToken();
      if (!token) { setError("Ta session a expiré. Reconnecte-toi puis réessaie."); return; }
      const result = await getPaidService.requestMoney(token, {
        recipientId: selectedRecipient.id, amount: amountValue, currency: requestCurrency,
        note: note.trim(), idempotencyKey: Crypto.randomUUID(),
      });
      if (!result.ok) { setError(result.error); return; }
      setRequestReceipt(result.data.request); setPage("request-confirm");
    } catch { setError("La demande n’a pas pu être envoyée. Réessaie."); }
    finally { setBusy(false); }
  };

  const openQr = async () => {
    setPage("qr"); setError(null); setQrPayload(""); setSellerCode(""); setQrImageUrl(""); setBusy(true);
    try {
      const token = await getToken();
      if (!token) { setError("Ta session a expiré. Reconnecte-toi puis réessaie."); return; }
      const result = await getPaidService.getQr(token);
      if (!result.ok) { setError(result.error); return; }
      setQrPayload(result.data.payload); setSellerCode(result.data.sellerCode); setQrImageUrl(result.data.qrImageUrl);
    } catch { setError("Le QR code n’a pas pu être chargé."); }
    finally { setBusy(false); }
  };

  const pageTitles: Record<Page, FinancialTitleKey> = {
    menu: "getPaid", "links-home": "paymentLink", "link-create": "createLink",
    "link-list": "yourLinks", "link-detail": "linkDetails", contacts: "requestMoney",
    "request-amount": "requestMoney", "request-review": "requestReview",
    "request-note": "requestNote", "request-confirm": "requestSent", qr: "qrCode",
  };
  const pageTitle = getFinancialTitleSegments(pageTitles[page], language);

  const back = () => {
    setError(null);
    if (page === "menu") close();
    else if (page === "link-create" || page === "link-list" || page === "qr") setPage("links-home");
    else if (page === "link-detail") setPage("link-list");
    else if (page === "contacts") { setPage("menu"); setSearching(false); }
    else if (page === "request-amount") setPage("contacts");
    else if (page === "request-review") setPage("request-amount");
    else if (page === "request-note") setPage("request-amount");
    else if (page === "request-confirm") setPage("menu");
  };

  const chooseRecipient = (recipient: Recipient) => {
    setSelectedRecipient(recipient); setRequestAmount(""); setNote(""); setError(null); setSearching(false); setPage("request-amount");
  };

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: contentTopGap }}>
      <View className="h-[34px] flex-row items-center justify-between px-5">
        {page === "menu" ? <View className="w-8" /> : <Pressable onPress={back} hitSlop={12} accessibilityRole="button" accessibilityLabel="Retour" className="h-[42px] w-[42px] items-center justify-center rounded-[12px] bg-white"><Image source={images.back} style={{ width: 42, height: 42 }} contentFit="contain" /></Pressable>}
        {page === "menu" ? <Pressable onPress={close} hitSlop={14} accessibilityRole="button" accessibilityLabel="Fermer Get Paid"><CloseIcon size={26} color="rgba(255,255,255,0.45)" /></Pressable> : <View className="w-8" />}
      </View>
      <View className="mt-4 flex-row items-baseline px-8">
        <NativeText allowFontScaling={false} className="font-semibold text-[32px] text-white/40">{pageTitle[0]} </NativeText>
        <NativeText allowFontScaling={false} className="font-bold text-[32px] text-white">{pageTitle[1]}</NativeText>
      </View>

      {page === "menu" ? (
        <ScrollView className="flex-1" contentContainerClassName="flex-grow justify-end px-8 pb-16 pt-10" showsVerticalScrollIndicator={false}>
          <Text allowFontScaling={false} className="mb-8 text-[20px] text-white/75">Choose Method</Text>
          <GetPaidOption title="Payment Link" onPress={() => { setPage("links-home"); void loadLinks(); }}><Image source={images.linkIcon} style={{ width: 26, height: 26 }} contentFit="contain" tintColor={colors.zenoDark} /></GetPaidOption>
          <GetPaidOption title="Request Money" onPress={() => { void openContacts(); }}><Image source={images.requestMoney} style={{ width: 26, height: 26 }} contentFit="contain" tintColor={colors.zenoDark} /></GetPaidOption>
          <GetPaidOption title="QR Code" onPress={() => { void openQr(); }} isLast><Image source={images.withdraw} style={{ width: 26, height: 26 }} contentFit="contain" tintColor={colors.zenoDark} /></GetPaidOption>
        </ScrollView>
      ) : (
        <ScrollView key={page} className={`mt-6 flex-1 ${page === "links-home" ? "" : "rounded-t-[28px] bg-white"}`} contentContainerClassName="flex-grow px-5 pb-8 pt-7" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {page === "links-home" ? (
            <>
              <View className="mt-6 items-center rounded-[24px] bg-[#242424] px-5 py-8">
                <Text className="text-[15px] text-white/65">Last Month</Text>
                <Text className="mt-5 text-center text-[26px] font-bold text-white">Earnings unavailable</Text>
                <Text className="mt-2 text-[14px] text-white/65">{links.length ? `${links.length} payment links` : "Create your first payment link"}</Text>
              </View>
              {error ? <InlineError message={error} /> : null}
              {busy ? <ZenoLoading variant="blue" size={20} className="mt-4" /> : null}
              <View className="mt-auto gap-y-3 pt-10">
                <PrimaryButton label="Create Link" onPress={() => { setError(null); setLinkTitle(""); setLinkDescription(""); setLinkAmount(""); setLinkImage(null); setPage("link-create"); }} />
                <SecondaryButton light label="Manage Link" onPress={() => { setPage("link-list"); void loadLinks(); }} />
              </View>
            </>
          ) : null}

          {page === "link-create" ? (
            <>
              <Text className="text-[23px] font-bold text-zeno-text-primary">Create Link</Text>
              <Field label="Service or product" value={linkTitle} onChangeText={setLinkTitle} placeholder="Ex. Design project" />
              <Field label="Price" value={linkAmount} onChangeText={(v) => setLinkAmount(v.replace(/[^0-9.,]/g, ""))} placeholder="100,000" keyboardType="decimal-pad" suffix={requestCurrency} secureTextEntry={isBalanceHidden} />
              <Text className="mb-2 mt-6 text-[16px] text-zeno-text-primary">Description</Text>
              <TextInput value={linkDescription} onChangeText={setLinkDescription} placeholder="Add details about this payment" placeholderTextColor="#858585" multiline textAlignVertical="top" className="min-h-[130px] rounded-[20px] border border-black/10 bg-[#F7F7F7] px-4 py-4 text-[15px] text-zeno-text-primary" />
              <Text className="mb-2 mt-6 text-[16px] text-zeno-text-primary">Image (optional)</Text>
              {linkImage ? (
                <View className="flex-row items-center gap-x-4">
                  <Image source={{ uri: linkImage.uri }} contentFit="cover" className="h-24 w-24 rounded-[16px]" />
                  <Pressable onPress={() => setLinkImage(null)} className="rounded-full bg-[#F1F1F1] px-4 py-3">
                    <Text className="text-[14px] font-semibold text-zeno-text-primary">Remove image</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => { void chooseLinkImage(); }} className="h-24 w-24 items-center justify-center rounded-[16px] border border-dashed border-black/20 bg-[#F7F7F7]" accessibilityRole="button" accessibilityLabel="Add an image to the payment link">
                  <Text className="text-[30px] text-zeno-text-secondary">＋</Text>
                  <Text className="text-[12px] text-zeno-text-secondary">Add image</Text>
                </Pressable>
              )}
              {error ? <InlineError message={error} /> : null}
              <View className="mt-auto pt-8"><PrimaryButton label="Create Link" onPress={() => { void createLink(); }} disabled={!linkTitle.trim() || linkAmountValue <= 0} busy={busy} /></View>
            </>
          ) : null}

          {page === "link-list" ? (
            <>
              <View className="flex-row items-center justify-between"><Text className="text-[23px] font-bold text-zeno-text-primary">Your Links</Text><Text className="text-[13px] text-zeno-text-secondary">{links.length}</Text></View>
              <View className="mt-6 flex-row border-b border-black/10 pb-3"><Text className="flex-1 text-[13px] font-semibold text-zeno-text-secondary">Service</Text><Text className="w-[78px] text-[13px] font-semibold text-zeno-text-secondary">Price</Text><Text className="w-[65px] text-[13px] font-semibold text-zeno-text-secondary">Link</Text></View>
              {busy ? <ZenoLoading variant="blue" size={20} className="mt-5" /> : links.length ? links.map((item) => <Pressable key={item.id} onPress={() => { setSelectedLink(item); setPage("link-detail"); }} className="min-h-[64px] flex-row items-center border-b border-black/5"><Text numberOfLines={1} className="flex-1 pr-2 text-[13px] text-zeno-text-primary">{item.title}</Text><Text className="w-[78px] text-[13px] text-zeno-text-secondary">{concealMoney(formatAmount(item.amount, item.currency), isBalanceHidden)}</Text><View className="w-[65px] items-end"><Chevron direction="right" size={11} /></View></Pressable>) : <Text className="py-10 text-center text-[14px] text-zeno-text-secondary">No payment links found.</Text>}
              {error ? <InlineError message={error} /> : null}
              <View className="mt-auto pt-8"><PrimaryButton label="Create Link" onPress={() => { setError(null); setPage("link-create"); }} /></View>
            </>
          ) : null}

          {page === "link-detail" && selectedLink ? (
            <>
              <Text className="text-[21px] font-bold text-zeno-text-primary">Payment Link Details</Text>
              <View className="mt-6 items-center rounded-[24px] bg-zeno-green/40 px-5 py-7">
                <View className="h-[54px] w-[54px] items-center justify-center rounded-full bg-white"><Image source={images.linkIcon} style={{ width: 25, height: 25 }} contentFit="contain" /></View>
                <Text className="mt-4 text-[16px] font-semibold text-zeno-text-primary">Payment link {selectedLink.status}</Text>
                <Text className="mt-2 text-[32px] font-bold text-zeno-text-primary">{concealMoney(formatAmount(selectedLink.amount, selectedLink.currency), isBalanceHidden)}</Text>
                <Text className="mt-2 text-center text-[16px] text-zeno-text-primary">For {selectedLink.title}</Text>
                <View className="mt-5 w-full rounded-full bg-white/75 px-4 py-3"><Text numberOfLines={1} className="text-center text-[13px] text-zeno-text-primary">{selectedLink.url}</Text></View>
                <View className="mt-3 w-full"><PrimaryButton label="Copy Link" onPress={() => { void Clipboard.setStringAsync(selectedLink.url); }} tone="blue" /></View>
                <View className="mt-2 w-full"><SecondaryButton label="Share Link" onPress={() => { void Share.share({ message: selectedLink.url, url: selectedLink.url }); }} /></View>
              </View>
              <Text className="mb-3 mt-7 text-[18px] font-semibold text-zeno-text-primary">Link activity</Text>
                <View className="rounded-[18px] border border-black/5 px-4 py-4"><Text className="text-[14px] font-semibold text-zeno-text-primary">Created</Text><Text className="mt-1 text-[13px] text-zeno-text-secondary">{new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(selectedLink.createdAt))}</Text><Text className="mt-4 text-[14px] text-zeno-text-secondary">{selectedLink.paymentsCount} {language === "fr" ? (selectedLink.paymentsCount > 1 ? "paiements reçus" : "paiement reçu") : (selectedLink.paymentsCount > 1 ? "payments received" : "payment received")}</Text></View>
              {error ? <InlineError message={error} /> : null}
            </>
          ) : null}

          {page === "contacts" ? (
            <>
              <View className="flex-row items-center rounded-full border border-black/10 bg-[#F7F7F7] px-4"><Text className="mr-2 text-[20px] text-zeno-text-secondary">⌕</Text><TextInput value={query} onChangeText={(v) => { setQuery(v); setError(null); setSearching(v.trim().length > 0); if (!v.trim()) setSearchResults([]); }} placeholder="Name, username, email" placeholderTextColor="#858585" className="h-[54px] flex-1 text-[15px] text-zeno-text-primary" /></View>
              <Text className="mb-3 mt-8 text-[18px] font-semibold text-zeno-text-primary">{query ? "People from ZENO" : "Your Contacts"}</Text>
              {searching ? <ZenoLoading variant="blue" size={20} className="py-4" /> : null}
              {(query ? searchResults : recipients).map((item) => <Pressable key={item.id} onPress={() => chooseRecipient(item)} className="min-h-[70px] flex-row items-center border-b border-black/5"><Image source={{ uri: item.avatarUrl }} style={{ width: 48, height: 48, borderRadius: 24 }} contentFit="cover" /><View className="ml-4 flex-1"><Text className="text-[16px] font-medium text-zeno-text-primary">{item.name}</Text><Text className="mt-1 text-[13px] text-zeno-text-secondary">{item.zenoId ?? "ZENO account"}</Text></View><Chevron direction="right" size={12} /></Pressable>)}
              {!searching && (query ? searchResults : recipients).length === 0 ? <Text className="py-8 text-center text-[14px] text-zeno-text-secondary">{error ?? (query ? "No ZENO users found." : "No saved contacts yet.")}</Text> : null}
              {error && (query ? searchResults : recipients).length ? <InlineError message={error} /> : null}
            </>
          ) : null}

          {page === "request-amount" ? (
            <>
              {selectedRecipient ? <View className="flex-row items-center"><Image source={{ uri: selectedRecipient.avatarUrl }} style={{ width: 54, height: 54, borderRadius: 27 }} contentFit="cover" /><Text className="ml-4 text-[22px] font-semibold text-zeno-text-primary">{selectedRecipient.name}</Text></View> : null}
              <View className="mt-10 flex-row items-center border-b border-black/10 pb-3"><TextInput value={requestAmount} onChangeText={(v) => setRequestAmount(v.replace(/[^0-9.,]/g, ""))} placeholder="0" placeholderTextColor="#9B9B9B" keyboardType="decimal-pad" secureTextEntry={isBalanceHidden} className="min-w-0 flex-1 text-[48px] text-zeno-text-primary" /><Pressable onPress={() => setCurrencyMenuOpen((open) => !open)} className="flex-row items-center rounded-full border border-black/20 px-4 py-2"><Text className="text-[17px] text-zeno-text-primary">{requestCurrency}</Text><View className="ml-2"><Chevron direction="down" size={10} /></View></Pressable></View>
              {currencyMenuOpen ? <View className="mt-2 self-end rounded-[16px] border border-black/10 bg-white p-1">{(["XOF", "USD", "EUR"] as Currency[]).map((currency) => <Pressable key={currency} onPress={() => { setRequestCurrency(currency); setCurrencyMenuOpen(false); }} className="h-[42px] justify-center px-5"><Text className="text-[15px] text-zeno-text-primary">{currency}</Text></Pressable>)}</View> : null}
              <View className="mt-auto flex-row gap-x-3 pt-8"><SecondaryButton label="Add Note" onPress={() => setPage("request-note")} /><PrimaryButton label="Next" onPress={() => setPage("request-review")} disabled={!amountValid} /></View>
            </>
          ) : null}

          {page === "request-note" ? (
            <>
              <Text className="mb-5 text-center text-[20px] font-semibold text-zeno-text-primary">Add Note</Text>
              <TextInput value={note} onChangeText={setNote} placeholder="Write a note (optional)" placeholderTextColor="#858585" multiline textAlignVertical="top" maxLength={240} className="min-h-[180px] rounded-[22px] border border-black/10 bg-[#F4F4F4] px-4 py-4 text-[15px] text-zeno-text-primary" />
              <View className="mt-auto items-end pt-8"><PrimaryButton label="Next" onPress={() => setPage("request-review")} /></View>
            </>
          ) : null}

          {page === "request-review" ? (
            <>
              <Text className="text-[24px] font-bold text-zeno-text-primary">Review</Text>
              <View className="mt-7 flex-row justify-between border-b border-black/10 pb-5"><Text className="text-[17px] text-zeno-text-primary">Your Request</Text><Text className="text-[17px] font-semibold text-zeno-text-primary">{concealMoney(formatAmount(amountValue, requestCurrency), isBalanceHidden)}</Text></View>
              <View className="mt-5 flex-row items-center"><Image source={{ uri: selectedRecipient?.avatarUrl }} style={{ width: 44, height: 44, borderRadius: 22 }} contentFit="cover" /><Text className="ml-3 text-[15px] text-zeno-text-primary">To {selectedRecipient?.name}</Text></View>
              {note.trim() ? <Text className="mt-5 rounded-[16px] bg-[#F5F5F5] px-4 py-3 text-[14px] text-zeno-text-secondary">{note}</Text> : null}
              <Text className="mt-6 text-[14px] leading-5 text-zeno-text-secondary">A request will be sent to this ZENO user. They must accept and pay it before money is transferred.</Text>
              {error ? <InlineError message={error} /> : null}
              <View className="mt-auto pt-8"><PrimaryButton label="Request Now" onPress={() => { void submitRequest(); }} busy={busy} /></View>
            </>
          ) : null}

          {page === "request-confirm" ? (
            <View className="flex-1 items-center justify-center">
              <View className="h-[88px] w-[88px] items-center justify-center rounded-full bg-zeno-green"><Text className="text-[45px] font-bold text-zeno-dark">✓</Text></View>
              <Text className="mt-6 text-[25px] font-bold text-zeno-text-primary">Request sent</Text>
              {requestReceipt ? <Text className="mt-3 text-center text-[15px] text-zeno-text-secondary">{concealMoney(formatAmount(requestReceipt.amount, requestReceipt.currency), isBalanceHidden)} requested from {requestReceipt.recipientName}</Text> : null}
              <View className="mt-auto w-full"><PrimaryButton label="Done" onPress={() => setPage("menu")} /></View>
            </View>
          ) : null}

          {page === "qr" ? (
            <>
              <View className="flex-1 items-center justify-center">
                <Text className="text-[18px] font-semibold text-zeno-text-primary">Your ZENO QR Code</Text>
                {busy ? <ZenoLoading variant="blue" size={20} className="mt-6" /> : qrPayload ? (
                  <>
                    {/* The QR image comes from the authenticated server payload. */}
                    <View className="mt-6 items-center rounded-[20px] border border-black/10 bg-white px-5 py-5">
                      <Image source={{ uri: qrImageUrl }} style={{ width: 250, height: 250 }} contentFit="contain" accessibilityLabel="Personal ZENO payment QR code" />
                      <Text className="mt-3 text-[15px] font-semibold text-zeno-text-primary">{sellerCode}</Text>
                    </View>
                    <Text className="mt-6 text-center text-[14px] text-zeno-text-secondary">Share your code so others can pay you.</Text>
                  </>
                ) : <Text className="mt-6 text-center text-[14px] text-zeno-text-secondary">{error ?? "QR code unavailable."}</Text>}
              </View>
              {qrPayload ? <View className="pb-5"><PrimaryButton label="Share Code" onPress={() => { void Share.share({ message: qrPayload }); }} /></View> : null}
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function GetPaidOption({ title, onPress, isLast = false, children }: { title: string; onPress: () => void; isLast?: boolean; children: React.ReactNode }) {
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title} className={`mb-7 flex-row items-center ${isLast ? "mb-0" : ""}`}><View className="h-[58px] w-[58px] items-center justify-center rounded-full border border-black/20 bg-zeno-green">{children}</View><Text allowFontScaling={false} className="ml-5 flex-1 text-[21px] font-semibold text-white">{title}</Text><Chevron direction="right" size={13} color="#FFFFFF" /></Pressable>;
}

function Field({ label, value, onChangeText, placeholder, keyboardType = "default", suffix, secureTextEntry = false }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: "default" | "decimal-pad"; suffix?: string; secureTextEntry?: boolean }) {
  return <><Text className="mb-2 mt-6 text-[16px] text-zeno-text-primary">{label}</Text><View className="h-[58px] flex-row items-center rounded-full bg-[#F4F4F4] px-5"><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#858585" keyboardType={keyboardType} secureTextEntry={secureTextEntry} className="h-full flex-1 text-[16px] text-zeno-text-primary" />{suffix ? <Text className="text-[15px] font-semibold text-zeno-text-secondary">{suffix}</Text> : null}</View></>;
}

function PrimaryButton({ label, onPress, disabled = false, busy = false, tone = "lime" }: { label: string; onPress: () => void; disabled?: boolean; busy?: boolean; tone?: "lime" | "blue" }) {
  return <Pressable onPress={onPress} disabled={disabled || busy} accessibilityRole="button" accessibilityState={{ disabled: disabled || busy }} className={`h-[58px] flex-1 items-center justify-center rounded-full ${tone === "lime" ? "bg-zeno-green" : "bg-zeno-sky"}`} style={{ opacity: disabled || busy ? 0.55 : 1 }}>{busy ? <ZenoLoading variant="blue" size={24} /> : <Text className="text-[18px] font-semibold text-zeno-dark">{label}</Text>}</Pressable>;
}

function SecondaryButton({ label, onPress, light = false }: { label: string; onPress: () => void; light?: boolean }) {
  return <Pressable onPress={onPress} accessibilityRole="button" className={`h-[58px] flex-1 items-center justify-center rounded-full ${light ? "bg-white" : "bg-[#F1F1F1]"}`}><Text className={`text-[17px] font-semibold ${light ? "text-zeno-text-primary" : "text-zeno-text-secondary"}`}>{label}</Text></Pressable>;
}

function InlineError({ message }: { message: string }) {
  return <Text accessibilityRole="alert" className="mt-4 text-[14px] leading-5 text-zeno-error">{message}</Text>;
}
