export const PAYMENT_METHOD_VALUES = [
  "pix",
  "debit",
  "credit",
  "cash",
  "boleto",
  "transfer",
  "other",
] as const;

export type PaymentMethod =
  (typeof PAYMENT_METHOD_VALUES)[number];

export const PAYMENT_METHOD_OPTIONS: {
  value: PaymentMethod | null;
  label: string;
}[] = [
  {
    value: null,
    label: "Não informado",
  },
  {
    value: "pix",
    label: "Pix",
  },
  {
    value: "debit",
    label: "Débito",
  },
  {
    value: "credit",
    label: "Crédito",
  },
  {
    value: "cash",
    label: "Dinheiro",
  },
  {
    value: "boleto",
    label: "Boleto",
  },
  {
    value: "transfer",
    label: "Transferência",
  },
  {
    value: "other",
    label: "Outros",
  },
];

export function isPaymentMethod(
  value: unknown
): value is PaymentMethod {
  return (
    typeof value === "string" &&
    PAYMENT_METHOD_VALUES.includes(
      value as PaymentMethod
    )
  );
}

export function normalizePaymentMethod(
  value: unknown
): PaymentMethod | null {
  return isPaymentMethod(value)
    ? value
    : null;
}

export function getPaymentMethodLabel(
  value: PaymentMethod | null | undefined
) {
  return (
    PAYMENT_METHOD_OPTIONS.find(
      (option) => option.value === (value ?? null)
    )?.label ?? "Não informado"
  );
}
