import {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Platform } from "react-native";

export type AndroidCustomPeriodResult = {
  startDate: string;
  endDate: string;
};

function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateLocal(
  dateString: string | null | undefined,
  fallback: Date
): Date {
  if (!dateString) {
    return fallback;
  }

  const [year, month, day] = dateString.split("-").map(Number);

  if (!year || !month || !day) {
    return fallback;
  }

  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return fallback;
  }

  return parsedDate;
}

function openAndroidDatePicker(initialDate: Date): Promise<Date | null> {
  return new Promise((resolve) => {
    DateTimePickerAndroid.open({
      value: initialDate,
      mode: "date",
      onChange: (
        event: DateTimePickerEvent,
        selectedDate?: Date
      ) => {
        if (event.type !== "set" || !selectedDate) {
          resolve(null);
          return;
        }

        resolve(selectedDate);
      },
    });
  });
}

export async function openAndroidSingleDate(
  currentDate?: string | null
): Promise<string | null> {
  if (Platform.OS !== "android") {
    return null;
  }

  const initialDate = parseDateLocal(
    currentDate,
    new Date()
  );

  const selectedDate = await openAndroidDatePicker(
    initialDate
  );

  if (!selectedDate) {
    return null;
  }

  return formatDateLocal(selectedDate);
}

export async function openAndroidCustomPeriod(
  currentStartDate?: string | null,
  currentEndDate?: string | null
): Promise<AndroidCustomPeriodResult | null> {
  if (Platform.OS !== "android") {
    return null;
  }

  const today = new Date();

  const initialStartDate = parseDateLocal(
    currentStartDate,
    today
  );

  const selectedStartDate = await openAndroidDatePicker(
    initialStartDate
  );

  if (!selectedStartDate) {
    return null;
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, 350);
  });

  const initialEndDate = parseDateLocal(
    currentEndDate,
    selectedStartDate
  );

  const selectedEndDate = await openAndroidDatePicker(
    initialEndDate
  );

  if (!selectedEndDate) {
    return null;
  }

  return {
    startDate: formatDateLocal(selectedStartDate),
    endDate: formatDateLocal(selectedEndDate),
  };
}
