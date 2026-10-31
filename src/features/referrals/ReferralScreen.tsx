import { showLocalizedAlert } from "@/components/ui/LocalizedText";
import { LocalizedText as Text } from "@/components/ui/LocalizedText";
import * as Clipboard from "expo-clipboard";
import { useUser } from "@clerk/clerk-expo";
import { images } from "@/constants/images";
import { useLanguageStore } from "@/store/language-store";
import { Image } from "expo-image";
import { router, type Href } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Share, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

type ReferralPage = "home" | "invite" | "code" | "earn" | "summary" | "rewards";

const go = (path: string) => router.push(path as Href);
const GREEN = "#C7FF4A";
const DARK = "#0A1712";

export function ReferralScreen({ page }: { page: ReferralPage }) {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const language = useLanguageStore((state) => state.language);
  const [filter, setFilter] = useState("All");
  const code = useMemo(() => {
    const value = user?.publicMetadata?.referralCode;
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }, [user?.publicMetadata]);
  const link = code ? `https://zeno.app/invite/${encodeURIComponent(code)}` : null;

  const share = async () => {
    if (!link) {
      showLocalizedAlert("Referral code unavailable", "Your referral link will appear here once it has been set up for your account.");
      return;
    }
    await Share.share({ message: `${language === "fr" ? "Rejoins-moi sur ZENO :" : "Join me on ZENO:"} ${link}`, url: link });
  };

  const copyReferralLink = async () => {
    if (!link || !code) {
      showLocalizedAlert(
        language === "fr" ? "Code indisponible" : "Referral code unavailable",
        language === "fr" ? "Ton lien de parrainage apparaîtra quand ton code sera configuré." : "Your referral link will appear once your code is set up.",
      );
      return;
    }
    try {
      await Clipboard.setStringAsync(link);
      showLocalizedAlert(language === "fr" ? "Lien copié" : "Link copied", language === "fr" ? `Ton lien contient le code ${code}.` : `Your link includes code ${code}.`);
    } catch {
      showLocalizedAlert(language === "fr" ? "Copie impossible" : "Copy failed", language === "fr" ? "Réessaie dans un instant." : "Please try again.");
    }
  };

  const copyReferralCode = async () => {
    if (!code) return;
    try {
      await Clipboard.setStringAsync(code);
      showLocalizedAlert(language === "fr" ? "Code copié" : "Code copied", language === "fr" ? "Ton code de parrainage est prêt à être partagé." : "Your referral code is ready to share.");
    } catch {
      showLocalizedAlert(language === "fr" ? "Copie impossible" : "Copy failed", language === "fr" ? "Réessaie dans un instant." : "Please try again.");
    }
  };

  const title = ({ home: "Referral", invite: "Invite Friends", code: "Referral Code", earn: "Earn Rewards", summary: "Referral Summary", rewards: "Rewards" } satisfies Record<ReferralPage, string>)[page];

  return (
    <View className="flex-1 bg-[#F4FAFF]" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row items-center gap-x-4 px-5 pt-3 pb-2">
        <Pressable className="h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white shadow-low" onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
          <Image source={images.back} style={{ width: 50, height: 50 }} contentFit="contain" />
        </Pressable>
        {page !== "home" && <Text className="ml-3 flex-1 text-[18px] font-bold text-[#071706]">{title}</Text>}
      </View>
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8" showsVerticalScrollIndicator={false}>
        {page === "home" && <>
          <View className="mt-5 overflow-hidden rounded-[28px] bg-[#EAF6FF] p-5">
            <View className="max-w-[86%]">
              <Text className="text-[25px] font-bold leading-[31px] text-[#071706]">{language === "fr" ? "Parraine un ami et gagne 5 $" : "Invite a friend and earn $5"}</Text>
              <Text className="mt-2 text-[14px] leading-[21px] text-[#526070]">{language === "fr" ? "Partage ton code. Tu recevras ta récompense lorsque ton ami s’inscrit et remplit les conditions de parrainage." : "Share your code. You’ll earn a reward when your friend joins and meets the referral requirements."}</Text>
            </View>
            <View className="mt-4 flex-row items-end justify-between">
              <View>
                <Text className="text-[13px] font-medium text-[#6B7280]">{language === "fr" ? "Code de parrainage" : "Referral code"}</Text>
                <Pressable onPress={copyReferralCode} disabled={!code} className="mt-1 flex-row items-center rounded-[14px] border border-dashed border-[#0F7153]/50 bg-white/80 px-3 py-2.5">
                  <Text className="text-[16px] font-bold tracking-[1px] text-[#071706]">{code ?? (language === "fr" ? "Indisponible" : "Unavailable")}</Text>
                  {code ? <Text className="ml-2 text-[17px] font-semibold text-[#0F7153]">⧉</Text> : null}
                </Pressable>
              </View>
              <ReferralIllustration />
            </View>
          </View>

          <View className="mt-4 flex-row items-center rounded-[20px] bg-white p-4 shadow-low">
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-[14px] bg-[#EAF6FF]"><RewardMarkInline /></View>
            <View>
              <Text className="text-[13px] font-medium text-[#6B7280]">{language === "fr" ? "Total des gains" : "Total earnings"}</Text>
              <Text className="mt-0.5 text-[20px] font-bold text-[#0057FF]">$0</Text>
            </View>
          </View>

          <Text className="mb-3 mt-7 text-[14px] font-semibold uppercase tracking-wide text-[#6B7280]">{language === "fr" ? "Mes parrainages" : "My referrals"}</Text>
          <View className="min-h-[220px] items-center justify-center rounded-[24px] bg-white px-5 py-8 shadow-low">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-[#F4FAFF]"><PeopleIcon /></View>
            <Text className="text-center text-[15px] font-medium text-[#8290A3]">{language === "fr" ? "Tu n’as pas encore de parrainage" : "You don’t have any referrals yet"}</Text>
          </View>
        </>}

        {page === "invite" && <>
          <View className="mt-3 rounded-[26px] border border-[#EDF3D9] bg-[#F4FBDD] p-5">
            <Text className="text-[19px] font-semibold text-[#071706]">Share your link</Text>
            <Text className="mt-1 text-[15px] text-[#6B7280]">Send your unique link to friends.</Text>
            <Pressable onPress={share} className="mt-5 flex-row items-center rounded-2xl bg-white px-4 py-4">
              <Text numberOfLines={1} className="flex-1 text-[14px] text-[#071706]">{link ?? "Referral link not available yet"}</Text>
              <Text className="ml-2 text-[20px] text-[#276D32]">⧉</Text>
            </Pressable>
            <Text className="mb-3 mt-7 text-[14px] font-semibold text-[#071706]">Share via</Text>
            <View className="flex-row justify-between">{["WhatsApp", "Telegram", "Facebook", "Twitter", "More"].map((name, i) => <Pressable key={name} onPress={share} className="items-center"><View className={`h-12 w-12 items-center justify-center rounded-2xl ${i === 0 ? "bg-[#DFF7DA]" : "bg-white"}`}><Text className="text-[20px] font-bold" style={{ color: ["#20A44A", "#2AA6D7", "#1775EB", "#249BEA", DARK][i] }}>{["◉", "➤", "f", "♥", "•••"][i]}</Text></View><Text className="mt-2 text-[10px] text-[#6B7280]">{name}</Text></Pressable>)}</View>
          </View>
          <View className="mt-5 rounded-[24px] border border-gray-100 bg-white p-5">
            <Text className="text-[18px] font-semibold text-[#071706]">Or invite from contacts</Text>
            <Text className="mt-1 text-[14px] text-[#6B7280]">Share your invite link with people you know.</Text>
            <Pressable onPress={share} className="mt-4 min-h-12 items-center justify-center rounded-2xl border border-gray-100 bg-white"><Text className="font-semibold text-[#071706]">Invite Contacts</Text></Pressable>
          </View>
          <View className="mt-5 rounded-[24px] bg-[#102016] p-5"><Text className="text-[14px] text-white">Your Code</Text><Text className="mt-2 text-[24px] font-bold" style={{ color: GREEN }}>{code ?? "Not available"}</Text><Text className="mt-1 text-[14px] leading-5 text-white/80">Share your code. Your friends can join ZENO using your referral link.</Text></View>
        </>}

        {page === "code" && <View className="mt-3 rounded-[26px] border border-gray-100 bg-white p-5">
          <Text className="font-semibold text-[#071706]">Your Referral Code</Text>
          <Pressable onPress={share} className="mt-4 flex-row items-center justify-center rounded-2xl border border-dashed border-[#C7FF4A] bg-[#F5FBDD] p-4"><Text className="text-[25px] font-bold text-[#071706]">{code ?? "Not available"}</Text><Text className="ml-3 text-[20px]">⧉</Text></Pressable>
          <Text className="my-5 text-center text-[13px] text-[#6B7280]">{code ? "Share this code with friends" : "Your referral code will show here when available"}</Text>
          <Text className="font-semibold text-[#071706]">Referral Link</Text>
          <Pressable onPress={share} className="mt-3 flex-row items-center rounded-2xl bg-[#F4FBDD] p-4"><Text numberOfLines={1} className="flex-1 text-[14px] text-[#071706]">{link ?? "Link not available"}</Text><Text className="ml-2 text-[19px]">⧉</Text></Pressable>
          <Text className="mb-3 mt-7 font-semibold text-[#071706]">Share your code anywhere</Text>
          {["Share on WhatsApp", "Share on Telegram", "Share on Facebook", "Share via SMS", "More Options"].map((label, i) => <Pressable key={label} onPress={share} className={`flex-row items-center border-t border-gray-100 py-4 ${i === 0 ? "border-t-0" : ""}`}><View className="h-8 w-8 items-center justify-center rounded-full bg-[#EFF8E6]"><Text>{["◉", "➤", "f", "▣", "•••"][i]}</Text></View><Text className="ml-3 flex-1 text-[14px] text-[#071706]">{label}</Text><Text className="text-[20px] text-[#9CA3AF]">›</Text></Pressable>)}
        </View>}

        {page === "earn" && <>
          <View className="mt-3 rounded-[24px] bg-[#102016] p-5"><Text className="text-[22px] font-bold text-white">Earn Rewards</Text><Text className="mt-2 max-w-[220px] text-[15px] leading-5 text-white/80">The more friends you invite, the more you can earn.</Text><RewardMark /></View>
          <View className="mt-5 rounded-[24px] border border-gray-100 bg-white p-5"><Text className="font-semibold text-[#071706]">Total Earned</Text><Text className="mt-2 text-[28px] font-bold text-[#16813D]">—</Text><Text className="mt-4 border-t border-gray-100 pt-4 text-[14px] text-[#6B7280]">Rewards information will appear here when available.</Text></View>
          <Text className="mb-3 mt-6 text-[18px] font-semibold text-[#071706]">How you earn</Text>
          <RuleRow title="When a friend joins ZENO" detail="You may receive a reward" />
          <RuleRow title="When a friend makes their first transaction" detail="Eligibility and reward amount depend on the current referral terms." />
        </>}

        {page === "summary" && <>
          <View className="mt-3 flex-row rounded-2xl bg-white p-1">{["All", "Joined", "Earned"].map((item) => <Pressable key={item} onPress={() => setFilter(item)} className={`flex-1 items-center rounded-xl py-3 ${filter === item ? "bg-[#C7FF4A]" : ""}`}><Text className="font-semibold text-[#071706]">{item}</Text></Pressable>)}</View>
          <View className="mt-5 flex-row rounded-[24px] border border-gray-100 bg-white p-4">{[["Invited", "—"], ["Joined", "—"], ["Earned", "—"]].map(([label, value]) => <View key={label} className="flex-1 items-center border-r border-gray-100 last:border-0"><Text className="text-[12px] text-[#6B7280]">{label}</Text><Text className="mt-1 text-[22px] font-bold text-[#071706]">{value}</Text></View>)}</View>
          <Text className="mb-3 mt-8 text-[18px] font-semibold text-[#071706]">Recent Activity</Text><View className="items-center rounded-[24px] border border-gray-100 bg-white px-5 py-10"><Text className="text-[16px] font-semibold text-[#071706]">No referral activity yet</Text><Text className="mt-2 text-center text-[14px] text-[#6B7280]">Your invitations and rewards will appear here.</Text><Pressable onPress={() => go("/settings/referral/invite")}><Text className="mt-4 font-semibold text-[#16813D]">Invite a friend</Text></Pressable></View>
        </>}

        {page === "rewards" && <>
          <View className="mt-3 rounded-[24px] bg-[#102016] p-5"><Text className="text-[14px] text-white/80">Your Balance</Text><Text className="mt-3 text-[34px] font-bold text-white">—</Text><Text className="mt-2 text-[14px] text-white/80">Total Rewards Earned</Text><RewardMark /></View>
          <Text className="mb-3 mt-7 text-[18px] font-semibold text-[#071706]">Withdraw Rewards</Text><View className="rounded-[22px] border border-gray-100 bg-white p-4"><Text className="font-semibold text-[#071706]">ZENO Wallet</Text><Text className="mt-1 text-[14px] text-[#6B7280]">Instant transfer to your wallet</Text></View>
          <PrimaryButton label="Withdraw Now" onPress={() => showLocalizedAlert("Rewards unavailable", "Reward balance and payouts will be available once the referral service is connected.")} />
          <View className="mb-3 mt-8 flex-row items-center justify-between"><Text className="text-[18px] font-semibold text-[#071706]">Payout History</Text><Text className="text-[14px] text-[#6B7280]">View all</Text></View><View className="items-center rounded-[22px] border border-gray-100 bg-white px-5 py-8"><Text className="text-[14px] text-[#6B7280]">No payouts yet</Text></View>
        </>}
      </ScrollView>
      {page === "home" && <View className="px-5 pb-3 pt-2" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        <Pressable onPress={copyReferralLink} className="h-[58px] items-center justify-center rounded-[20px] bg-[#0057FF]" style={({ pressed }) => ({ opacity: pressed ? 0.86 : 1 })}>
          <Text className="text-[16px] font-bold text-white">{language === "fr" ? "Partager le lien" : "Share referral link"}</Text>
        </Pressable>
      </View>}
    </View>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable onPress={onPress} className="mt-5 min-h-[50px] items-center justify-center rounded-2xl" style={{ backgroundColor: GREEN }}><Text className="font-bold text-[#071706]">{label}</Text></Pressable>; }
function MenuRow({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable onPress={onPress} className="mt-3 flex-row items-center rounded-2xl border border-gray-100 bg-white px-4 py-4"><Text className="flex-1 font-semibold text-[#071706]">{label}</Text><Text className="text-[21px] text-[#6B7280]">›</Text></Pressable>; }
function RuleRow({ title, detail }: { title: string; detail: string }) { return <View className="mb-3 rounded-2xl border border-gray-100 bg-white p-4"><Text className="font-semibold text-[#071706]">{title}</Text><Text className="mt-1 text-[14px] leading-5 text-[#6B7280]">{detail}</Text></View>; }
function ReferralIllustration() {
  return <View className="h-[68px] w-[92px] items-center justify-center">
    <View className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#0057FF]" />
    <View className="absolute left-2 top-3 h-2 w-2 rounded-full bg-[#C7FF4A]" />
    <View className="h-10 w-12 items-center justify-center rounded-[10px] bg-[#0057FF]" style={{ transform: [{ rotate: "-12deg" }] }}>
      <View className="h-2 w-6 rounded-full bg-white/90" />
      <View className="mt-1 h-2 w-8 rounded-full bg-[#C7FF4A]" />
    </View>
    <View className="absolute bottom-1 right-1 h-3 w-3 rounded-full bg-[#C7FF4A]" />
  </View>;
}
function RewardMarkInline() { return <Svg width={23} height={23} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="9" stroke="#0057FF" strokeWidth="2"/><Path d="M8 12h8M12 8v8" stroke="#0057FF" strokeWidth="2" strokeLinecap="round"/></Svg>; }
function PeopleIcon() { return <Svg width={36} height={36} viewBox="0 0 36 36" fill="none"><Circle cx="14" cy="12" r="6" fill="#AAB5C4"/><Circle cx="26" cy="15" r="4.5" fill="#AAB5C4"/><Path d="M3.5 29c0-5.2 4.4-9 10.5-9s10.5 3.8 10.5 9v1H3.5v-1ZM22 22c5.4-.7 10.5 2.5 10.5 7v1H27" fill="#AAB5C4"/></Svg>; }
function RewardMark() { return <View className="absolute right-5 top-6 h-11 w-11 items-center justify-center rounded-full bg-[#C7FF4A]"><Svg width={25} height={25} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="9" stroke={DARK} strokeWidth="2"/><Path d="M8 12h8M12 8v8" stroke={DARK} strokeWidth="2" strokeLinecap="round"/></Svg></View>; }
