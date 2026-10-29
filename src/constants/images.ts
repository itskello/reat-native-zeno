export const images = {
  back: require("../../assets/images/back.png"),
  closeCircleBlack: require("../../assets/images/close circle black.png"),
  closeCircleGray: require("../../assets/images/close circle gray.png"),
  cardInWallet: require("../../assets/images/illustration card in wallet.png"),
  google: require("../../assets/images/Google icon.png"),
  logoGreenLight: require("../../assets/images/logo green light.png"),
  logoWhite: require("../../assets/images/Logo white.png"),
  requestMoney: require("../../assets/images/request moeny.png"),
  mastercard: require("../../assets/images/mastercard icon.png"),
  addMoney: require("../../assets/images/add money.png"),
  linkIcon: require("../../assets/images/link.png"),
  sendMoney: require("../../assets/images/send.png"),
  withdraw: require("../../assets/images/Withdraw.png"),
  /** Supplied card artwork for the active/unfrozen state. */
  zenoCardActive: require("../../assets/images/Zenocard active.png"),
  secureGreen: require("../../assets/images/secure green.png"),
  bioSetupPadlock: require("../../assets/images/setup biometric.png"),
  bioSetupFingerprint: require("../../assets/images/BIO - setup fingprint.png"),
  bioValidated: require("../../assets/images/BIO - biometric valide.png"),
  // PLACEHOLDER avatar for the Wallet greeting until Clerk provides a real
  // profile photo (user.imageUrl). Swap this remote image for a bundled asset
  // or the Clerk URL once available.
  avatarPlaceholder: {
    uri: "https://i.pravatar.cc/150?img=12",
  },
  flags: {
    benin: require("../../assets/images/flag Benin.png"),
    coteDIvoire: require("../../assets/images/Flag Côte d'ivoire.png"),
    togo: require("../../assets/images/Flag Togo.png"),
  },
  /** Mobile Money operator marks, keyed by `MobileMoneyProvider.logoKey`. */
  providers: {
    mtn: require("../../assets/images/icone R MTN.png"),
    moov: require("../../assets/images/icone R MOOVE.png"),
    celtiis: require("../../assets/images/icone R CELTIIS.png"),
  },
} as const;
