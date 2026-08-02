import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function HelpScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-zeno-auth-background px-6">
      <Text className="text-3xl font-bold text-zeno-text-primary">Help & Support</Text>
      <Text className="mt-3 text-center text-base text-zeno-text-secondary">
        This is the Help & Support screen placeholder. Support content and
        contact options can be added here.
      </Text>
      <Link href="/" asChild>
        <Pressable className="mt-8 rounded-full bg-zeno-blue px-6 py-3">
          <Text className="text-sm font-bold text-white">Back Home</Text>
        </Pressable>
      </Link>
    </View>
  );
}
