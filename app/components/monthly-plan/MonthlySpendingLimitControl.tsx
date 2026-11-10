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
  GOAL_EXPANSION_ZONE_RATIO,
  getGoalAmountFromPosition,
  getGoalProgress,
  getGoalStep,
  isGoalExpansionPosition,
  snapGoalAmount,
} from "./goalControlMath";
import { MONTHLY_PLAN_COLORS } from "./visualTokens";

type MonthlySpendingLimitControlProps = {
  value: number;
  maximum: number;
  formatMoney: (value: number) => string;
  onChange: (value: number) => void;
  onChangeComplete?: (value: number) => void;
  onRequestExpand?: () => void;
  readOnly?: boolean;
};

const THUMB_SIZE = 26;

export function MonthlySpendingLimitControl({
  value,
  maximum,
  formatMoney,
  onChange,
  onChangeComplete,
  onRequestExpand,
  readOnly = false,
}: MonthlySpendingLimitControlProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const gestureValueRef = useRef(value);
  const gesturePositionRef = useRef(0);
  const expansionRequestedInGestureRef =
    useRef(false);

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
      if (readOnly) {
        return;
      }

      const gesturePosition =
        event.nativeEvent.locationX;

      const nextValue =
        getGoalAmountFromPosition(
          gesturePosition,
          trackWidth,
          maximum
        );

      gesturePositionRef.current =
        gesturePosition;

      gestureValueRef.current = nextValue;
      onChange(nextValue);
    },
    [maximum, onChange, readOnly, trackWidth]
  );

  const handleResponderGrant = useCallback(
    (event: GestureResponderEvent) => {
      if (readOnly) {
        return;
      }

      expansionRequestedInGestureRef.current =
        false;

      updateFromEvent(event);
    },
    [
      readOnly,
      updateFromEvent,
    ]
  );

  const handleResponderRelease = useCallback(
    () => {
      if (readOnly) {
        return;
      }

      const completedValue =
        gestureValueRef.current;

      const shouldExpand =
        isGoalExpansionPosition(
          gesturePositionRef.current,
          trackWidth
        );

      if (
        shouldExpand &&
        !expansionRequestedInGestureRef.current
      ) {
        expansionRequestedInGestureRef.current =
          true;

        onRequestExpand?.();
      }

      onChangeComplete?.(
        completedValue
      );
    },
    [
      onChangeComplete,
      onRequestExpand,
      readOnly,
      trackWidth,
    ]
  );

  const handleResponderTerminate = useCallback(
    () => {
      expansionRequestedInGestureRef.current =
        false;
    },
    []
  );

  const handleAccessibilityAction = useCallback(
    (actionName: string) => {
      if (readOnly) {
        return;
      }

      const direction =
        actionName === "increment"
          ? 1
          : actionName === "decrement"
          ? -1
          : 0;

      if (direction === 0) {
        return;
      }

      const nextValue =
        snapGoalAmount(
          value + step * direction,
          maximum
        );

      gestureValueRef.current =
        nextValue;

      onChange(nextValue);
      onChangeComplete?.(
        nextValue
      );
    },
    [
      maximum,
      onChange,
      onChangeComplete,
      readOnly,
      step,
      value,
    ]
  );

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.interactionArea,
          readOnly && styles.interactionAreaReadOnly,
        ]}
        onLayout={handleLayout}
        onStartShouldSetResponder={() => !readOnly}
        onStartShouldSetResponderCapture={() => !readOnly}
        onMoveShouldSetResponder={() => !readOnly}
        onMoveShouldSetResponderCapture={() => !readOnly}
        onResponderTerminationRequest={() => false}
        onResponderGrant={handleResponderGrant}
        onResponderMove={updateFromEvent}
        onResponderRelease={handleResponderRelease}
        onResponderTerminate={
          handleResponderTerminate
        }
        accessibilityRole={
          readOnly ? "text" : "adjustable"
        }
        accessibilityLabel={
          readOnly
            ? "Limite global do mês, somente leitura"
            : "Limite global do mês"
        }
        accessibilityValue={{
          min: 0,
          max: maximum,
          now: value,
          text: formatMoney(value),
        }}
        accessibilityActions={
          readOnly
            ? []
            : [
                {
                  name: "increment",
                  label: "Aumentar limite mensal",
                },
                {
                  name: "decrement",
                  label: "Diminuir limite mensal",
                },
              ]
        }
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
          {!readOnly ? (
            <View
              style={[
                styles.expansionZone,
                {
                  width: `${
                    GOAL_EXPANSION_ZONE_RATIO *
                    100
                  }%`,
                },
              ]}
            >
              <View style={styles.expansionMark} />
              <View style={styles.expansionMark} />
              <View style={styles.expansionMark} />

              <Text style={styles.expansionPlus}>
                +
              </Text>
            </View>
          ) : null}

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
    gap: 2,
    userSelect: "none",
  },
  interactionArea: {
    minHeight: 44,
    justifyContent: "center",
    cursor: "pointer",
    userSelect: "none",
  },
  interactionAreaReadOnly: {
    cursor: "auto",
  },
  track: {
    height: 11,
    borderRadius: 999,
    backgroundColor: MONTHLY_PLAN_COLORS.track,
    borderWidth: 1,
    borderColor: MONTHLY_PLAN_COLORS.border,
    position: "relative",
  },
  expansionZone: {
    position: "absolute",
    top: -1,
    right: -1,
    bottom: -1,
    zIndex: 2,
    overflow: "hidden",
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
    borderLeftWidth: 1,
    borderLeftColor:
      MONTHLY_PLAN_COLORS.textMuted,
    backgroundColor:
      MONTHLY_PLAN_COLORS.trackDark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 3,
    paddingRight: 5,
    opacity: 0.9,
  },
  expansionMark: {
    width: 1,
    height: 5,
    borderRadius: 999,
    backgroundColor:
      MONTHLY_PLAN_COLORS.textMuted,
    opacity: 0.45,
  },
  expansionPlus: {
    color: MONTHLY_PLAN_COLORS.brand,
    fontSize: 13,
    lineHeight: 14,
    fontWeight: "900",
  },
  fill: {
    position: "absolute",
    zIndex: 1,
    top: -1,
    bottom: -1,
    left: -1,
    borderRadius: 999,
    backgroundColor: MONTHLY_PLAN_COLORS.brand,
  },
  thumb: {
    position: "absolute",
    zIndex: 3,
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
