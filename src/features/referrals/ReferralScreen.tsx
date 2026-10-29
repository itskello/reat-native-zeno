import { useUser } from "@clerk/clerk-expo";
import { images } from "@/constants/images";
import { Image } from "expo-image";
import { router, type Href } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Share, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

type ReferralPage = "home" | "invite" | "code" | "earn" | "summary" | "rewards";

const go = (path: string) => router.push(path as Href);
const GREEN = "#C7FF4A";
const DARK = "#0A1712";

export function ReferralScreen({ page }: { page: ReferralPage }) {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [filter, setFilter] = useState("All");
  const code = useMemo(() => {
    const value = user?.publicMetadata?.referralCode;
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }, [user?.publicMetadata]);
  const link = code ? `https://zeno.app/invite/${encodeURIComponent(code)}` : null;

  const share = async () => {
    if (!link) {
      Alert.alert("Referral code unavailable", "Your referral link will appear here once it has been set up for your account.");
      return;
    }
    await Share.share({ message: `Join me on ZENO: ${link}`, url: link });
  };

  const title = ({ home: "Referral", invite: "Invite Friends", code: "Referral Code", earn: "Earn Rewards", summary: "Referral Summary", rewards: "Rewards" } satisfies Record<ReferralPage, string>)[page];

  return (
    <View className="flex-1 bg-[#F4FAFF]" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row items-center gap-x-4 px-5 pt-3 pb-2">
        <Pressable className="h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white shadow-low" onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
          <Image source={images.back} style={{ width: 50, height: 50 }} contentFit="contain" />
        </Pressable>
        <Text className="ml-3 flex-1 text-[18px] font-bold text-[#071706]">{title}</Text>
        {page === "home" && <Pressable onPress={() => go("/settings/referral/summary")} accessibilityLabel="Referral information"><Text className="text-[22px]">ⓘ</Text></Pressable>}
      </View>
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8" showsVerticalScrollIndicator={false}>
        {page === "home" && <>
          <Text className="mt-5 text-[30px] font-bold leading-[36px] text-[#071706]">Invite Friends</Text>
          <Text className="mt-2 max-w-[310px] text-[16px] leading-6 text-[#6B7280]">Share ZENO with your friends and earn rewards when they join.</Text>
          <GiftArtwork />
          <View className="mt-5 items-center rounded-[24px] border border-gray-100 bg-white px-4 py-6">
            <Text className="text-[14px] text-[#6B7280]">Your Referral Code</Text>
            <Pressable onPress={() => go("/settings/referral/code")}><Text className="mt-2 text-[29px] font-bold text-[#071706]">{code ?? "Not available"}</Text></Pressable>
            <Text className="mt-2 text-[13px] text-[#6B7280]">{code ? "Tap Invite Friends to share your link" : "Your code will appear here when ready"}</Text>
            <PrimaryButton label="Invite Friends" onPress={() => go("/settings/referral/invite")} />
          </View>
          <MenuRow label="How it works" onPress={() => go("/settings/referral/earn")} />
          <MenuRow label="Referral summary" onPress={() => go("/settings/referral/summary")} />
          <MenuRow label="Rewards" onPress={() => go("/settings/referral/rewards")} />
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
          <PrimaryButton label="Withdraw Now" onPress={() => Alert.alert("Rewards unavailable", "Reward balance and payouts will be available once the referral service is connected.")} />
          <View className="mb-3 mt-8 flex-row items-center justify-between"><Text className="text-[18px] font-semibold text-[#071706]">Payout History</Text><Text className="text-[14px] text-[#6B7280]">View all</Text></View><View className="items-center rounded-[22px] border border-gray-100 bg-white px-5 py-8"><Text className="text-[14px] text-[#6B7280]">No payouts yet</Text></View>
        </>}
      </ScrollView>
    </View>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable onPress={onPress} className="mt-5 min-h-[50px] items-center justify-center rounded-2xl" style={{ backgroundColor: GREEN }}><Text className="font-bold text-[#071706]">{label}</Text></Pressable>; }
function MenuRow({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable onPress={onPress} className="mt-3 flex-row items-center rounded-2xl border border-gray-100 bg-white px-4 py-4"><Text className="flex-1 font-semibold text-[#071706]">{label}</Text><Text className="text-[21px] text-[#6B7280]">›</Text></Pressable>; }
function RuleRow({ title, detail }: { title: string; detail: string }) { return <View className="mb-3 rounded-2xl border border-gray-100 bg-white p-4"><Text className="font-semibold text-[#071706]">{title}</Text><Text className="mt-1 text-[14px] leading-5 text-[#6B7280]">{detail}</Text></View>; }
function GiftArtwork() { return <View className="h-[235px] items-center justify-center"><View className="h-[154px] w-[170px] items-center justify-center rounded-[30px] bg-[#102016]" style={{ transform: [{ rotate: "-9deg" }] }}><Text className="text-[24px] font-bold" style={{ color: GREEN }}>ZENO</Text></View><View className="absolute bottom-5 h-[76px] w-[105px] items-center justify-center rounded-xl bg-[#31551C]" style={{ transform: [{ rotate: "-8deg" }] }}><View className="absolute h-full w-4 bg-[#A6D936]"/><View className="absolute top-[-10px] h-5 w-[120px] rounded-full bg-[#A6D936]"/><Text className="text-3xl">🎁</Text></View></View>; }
function RewardMark() { return <View className="absolute right-5 top-6 h-11 w-11 items-center justify-center rounded-full bg-[#C7FF4A]"><Svg width={25} height={25} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="9" stroke={DARK} strokeWidth="2"/><Path d="M8 12h8M12 8v8" stroke={DARK} strokeWidth="2" strokeLinecap="round"/></Svg></View>; }
