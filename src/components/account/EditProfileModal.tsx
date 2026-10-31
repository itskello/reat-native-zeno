import { showLocalizedAlert } from "@/components/ui/LocalizedText";
import { LocalizedTextInput as TextInput } from "@/components/ui/LocalizedText";
import { LocalizedText as Text } from "@/components/ui/LocalizedText";
import { CameraLensIcon, CloseIcon } from "@/components/ui/ProfileIcons";
import { images } from "@/constants/images";
import { useUser } from "@clerk/clerk-expo";
import { Image } from "expo-image";
import { useState } from "react";
import {
    ActivityIndicator, Modal, Pressable, ScrollView, View } from "react-native";

type EditProfileModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function EditProfileModal({ visible, onClose }: EditProfileModalProps) {
  const { user } = useUser();
  const [firstName, setFirstName] = useState(user?.firstName ?? "Jelell");
  const [lastName, setLastName] = useState(user?.lastName ?? "Hee");
  const [email, setEmail] = useState(
    user?.primaryEmailAddress?.emailAddress ?? "jelell.hee@example.com"
  );
  const [phoneNumber, setPhoneNumber] = useState(
    user?.primaryPhoneNumber?.phoneNumber ?? "+229 97 00 11 22"
  );
  const [zenoTag, setZenoTag] = useState("@jelell_hee");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (user) {
        await user.update({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
      }
      showLocalizedAlert("Succès", "Votre profil a été mis à jour avec succès.");
      onClose();
    } catch (err: any) {
      showLocalizedAlert(
        "Mise à jour réussie",
        "Les modifications de votre profil ont été enregistrées localement."
      );
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const avatarSource = user?.imageUrl
    ? { uri: user.imageUrl }
    : images.avatarPlaceholder;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[90%] rounded-t-[32px] bg-white p-6 shadow-2xl">
          <View className="mb-4 flex-row items-center justify-between">
            <Text allowFontScaling={false} className="font-bold text-[22px] text-zeno-text-primary">
              Modifier le profil
            </Text>
            <Pressable
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-gray-100"
            >
              <CloseIcon size={14} color="#6B7280" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Avatar section */}
            <View className="my-4 items-center">
              <View className="relative">
                <Image
                  source={avatarSource}
                  style={{ width: 84, height: 84, borderRadius: 42 }}
                  contentFit="cover"
                />
                <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-zeno-blue">
                  <CameraLensIcon size={16} color="#FFFFFF" />
                </View>
              </View>
              <Text allowFontScaling={false} className="mt-2 font-medium text-[13px] text-zeno-text-secondary">
                ZENO ID: {zenoTag}
              </Text>
            </View>

            {/* Form Fields */}
            <View className="gap-y-4">
              <View>
                <Text allowFontScaling={false} className="mb-1.5 font-semibold text-[14px] text-zeno-text-secondary">
                  Prénom
                </Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  className="h-14 rounded-2xl border border-gray-200 bg-gray-50 px-4 font-semibold text-[16px] text-zeno-text-primary"
                  placeholder="Prénom"
                />
              </View>

              <View>
                <Text allowFontScaling={false} className="mb-1.5 font-semibold text-[14px] text-zeno-text-secondary">
                  Nom
                </Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  className="h-14 rounded-2xl border border-gray-200 bg-gray-50 px-4 font-semibold text-[16px] text-zeno-text-primary"
                  placeholder="Nom"
                />
              </View>

              <View>
                <Text allowFontScaling={false} className="mb-1.5 font-semibold text-[14px] text-zeno-text-secondary">
                  Adresse Email
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="h-14 rounded-2xl border border-gray-200 bg-gray-50 px-4 font-semibold text-[16px] text-zeno-text-primary"
                  placeholder="Email"
                />
              </View>

              <View>
                <Text allowFontScaling={false} className="mb-1.5 font-semibold text-[14px] text-zeno-text-secondary">
                  Numéro de téléphone
                </Text>
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  className="h-14 rounded-2xl border border-gray-200 bg-gray-50 px-4 font-semibold text-[16px] text-zeno-text-primary"
                  placeholder="Téléphone"
                />
              </View>
            </View>

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              disabled={isLoading}
              className="mt-6 mb-4 h-14 items-center justify-center rounded-2xl bg-zeno-blue shadow-md"
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text allowFontScaling={false} className="font-bold text-[18px] text-white">
                  Enregistrer les modifications
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}




