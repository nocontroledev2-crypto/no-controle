import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const DEFAULT_CATEGORY_ICON: IoniconName =
  "ellipsis-horizontal-outline";

export const CATEGORY_ICON_NAMES: Record<string, IoniconName> = {
  Moradia: "home-outline",
  "Contas da Casa": "receipt-outline",
  Alimentação: "restaurant-outline",
  Assinaturas: "repeat-outline",
  Transporte: "car-outline",
  Saúde: "medkit-outline",
  Educação: "book-outline",
  Lazer: "game-controller-outline",
  Compras: "bag-handle-outline",
  Serviços: "construct-outline",
  Pets: "paw-outline",
  Família: "people-outline",
  Financeiro: "wallet-outline",
  Outros: "ellipsis-horizontal-outline",
};

export function getCategoryIconName(
  category: string
): IoniconName {
  return CATEGORY_ICON_NAMES[category] ?? DEFAULT_CATEGORY_ICON;
}
