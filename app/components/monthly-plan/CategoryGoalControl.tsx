import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getGoalAmountFromPosition,
  getGoalProgress,
  getGoalStep,
  snapGoalAmount,
} from "./goalControlMath";
import { MONTHLY_PLAN_COLORS } from "./visualTokens";

type CategoryGoalControlProps = {
  category: string;
  value: number;
  maximum: number;
  formatMoney: (value: number) => string;
  onChange: (value: number) => void;
  onRequestExpand?: () => void;
};

const THUMB_SIZE = 26;

export function CategoryGoalControl({
  category,
  value,
  maximum,
  formatMoney,
  onChange,
  onRequestExpand,
}: CategoryGoalControlProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const gestureValueRef = useRef(value);

  const progress = useMemo(
    () => getGoalProgress(value, maximum),
    [maximum, value]
  );

  const step = useMemo(
    () => getGoalStep(maximum),
    [maximum]
  );

  const thumbLeft =
    progress *
    Math.max(trackWidth - THUMB_SIZE, 0);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      setTrackWidth(
        event.nativeEvent.layout.width
      );
    },
    []
  );

  const updateFromEvent = useCallback(
    (event: GestureResponderEvent) => {
      const nextValue =
        getGoalAmountFromPosition(
          event.nativeEvent.locationX,
          trackWidth,
          maximum
        );

      gestureValueRef.current = nextValue;
      onChange(nextValue);
    },
    [maximum, onChange, trackWidth]
  );

  const handleResponderRelease = useCallback(
    () => {
      if (
        gestureValueRef.current >= maximum
      ) {
        onRequestExpand?.();
      }
    },
    [maximum, onRequestExpand]
  );

  const handleAccessibilityAction = useCallback(
    (actionName: string) => {
      const direction =
        actionName === "increment"
          ? 1
          : actionName === "decrement"
          ? -1
          : 0;

      if (direction === 0) {
        return;
      }

      onChange(
        snapGoalAmount(
          value + step * direction,
          maximum
        )
      );
    },
    [maximum, onChange, step, value]
  );

  return (
    <View style={styles.container}>
      <View style={styles.valueRow}>
        <View style={styles.valueTextContainer}>
          <Text style={styles.categoryName}>
            {category}
          </Text>

          <Text style={styles.valueHint}>
            Meta da categoria
          </Text>
        </View>

        <Text style={styles.currentValue}>
          {formatMoney(value)}
        </Text>
      </View>

      <View
        style={styles.interactionArea}
        onLayout={handleLayout}
        onStartShouldSetResponder={() => true}
        onStartShouldSetResponderCapture={() => true}
        onMoveShouldSetResponder={() => true}
        onMoveShouldSetResponderCapture={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={updateFromEvent}
        onResponderMove={updateFromEvent}
        onResponderRelease={handleResponderRelease}
        accessibilityRole="adjustable"
        accessibilityLabel={`Meta de ${category}`}
        accessibilityValue={{
          min: 0,
          max: maximum,
          now: value,
          text: formatMoney(value),
        }}
        accessibilityActions={[
          {
            name: "increment",
            label: "Aumentar meta",
          },
          {
            name: "decrement",
            label: "Diminuir meta",
          },
        ]}
        onAccessibilityAction={(event) =>
          handleAccessibilityAction(
            event.nativeEvent.actionName
          )
        }
      >
        <View
          style={styles.track}
          pointerEvents="none"
        >
          <View
            style={[
              styles.fill,
              {
                width: `${progress * 100}%`,
              },
            ]}
          />

          <View
            style={[
              styles.thumb,
              {
                left: thumbLeft,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.scaleRow}>
        <Text style={styles.scaleText}>
          {formatMoney(0)}
        </Text>

        <Text style={styles.scaleText}>
          Até {formatMoney(maximum)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: MONTHLY_PLAN_COLORS.border,
    padding: 14,
    backgroundColor: MONTHLY_PLAN_COLORS.surface,
    gap: 9,
    userSelect: "none",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  valueTextContainer: {
    flex: 1,
  },
  categoryName: {
    color: MONTHLY_PLAN_COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  valueHint: {
    color: MONTHLY_PLAN_COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  currentValue: {
    color: MONTHLY_PLAN_COLORS.brand,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "right",
  },
  interactionArea: {
    minHeight: 44,
    justifyContent: "center",
    cursor: "pointer",
    userSelect: "none",
  },
  track: {
    height: 11,
    borderRadius: 999,
    backgroundColor: MONTHLY_PLAN_COLORS.track,
    borderWidth: 1,
    borderColor: MONTHLY_PLAN_COLORS.border,
    position: "relative",
  },
  fill: {
    position: "absolute",
    top: -1,
    bottom: -1,
    left: -1,
    borderRadius: 999,
    backgroundColor: MONTHLY_PLAN_COLORS.brand,
  },
  thumb: {
    position: "absolute",
    top: "50%",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    marginTop: -(THUMB_SIZE / 2),
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: MONTHLY_PLAN_COLORS.surface,
    borderWidth: 4,
    borderColor: MONTHLY_PLAN_COLORS.brand,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 4,
  },
  scaleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  scaleText: {
    color: MONTHLY_PLAN_COLORS.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },
});
