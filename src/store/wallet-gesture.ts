import { makeMutable } from "react-native-reanimated";

/**
 * Global shared Reanimated value for 1:1 real-time gesture coupling
 * between Wallet Home Surface sliding down and Dynamic Island Morphing.
 *
 * 0 = Wallet Home at top (compact Dynamic Island pill)
 * 300 = ZENO Card fully open (expanded Dynamic Island container)
 */
export const cardDragY = makeMutable(0);
