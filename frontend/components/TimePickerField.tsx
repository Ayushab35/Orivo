import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  FlatList,
  ListRenderItemInfo,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";

import { useTheme } from "../lib/themeContext";
import { fontFamily, radii } from "../lib/theme";

const TICK_POOL_SIZE = 4;

let tickPlayers: AudioPlayer[] = [];
let tickPlayerIndex = 0;
let tickPlayersInitialized = false;
let tickPlayersFailed = false;

function initializeTickPlayers() {
  if (tickPlayersInitialized || tickPlayersFailed) {
    return;
  }

  tickPlayersInitialized = true;

  try {
    for (let i = 0; i < TICK_POOL_SIZE; i++) {
      const player = createAudioPlayer(require("../assets/sounds/tick2.wav"));

      player.volume = 0.5;

      tickPlayers.push(player);
    }
  } catch (error) {
    console.log("Could not create tick audio players:", error);

    tickPlayersFailed = true;
    tickPlayers = [];
  }
}

function playTickSound() {
  if (!tickPlayersInitialized) {
    initializeTickPlayers();
  }

  if (tickPlayers.length === 0) {
    return;
  }

  /*
   * Rotate through the audio players.
   *
   * We deliberately do NOT call seekTo(0).
   * Each player gets a chance to finish its previous sound.
   */
  const player = tickPlayers[tickPlayerIndex];

  tickPlayerIndex = (tickPlayerIndex + 1) % tickPlayers.length;

  try {
    player.play();
  } catch {
    // Ignore transient audio errors.
  }
}

/* ============================================================
 * TYPES
 * ========================================================== */

type TimePickerFieldProps = {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  testID?: string;
};

/* ============================================================
 * CONSTANTS
 * ========================================================== */

const ITEM_HEIGHT = 48;

const VISIBLE_ITEMS = 5;

const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const CENTER_OFFSET = Math.floor(VISIBLE_ITEMS / 2);

const VIRTUAL_COUNT = 10000;

const MIDDLE_INDEX = Math.floor(VIRTUAL_COUNT / 2);

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const MINUTES = Array.from({ length: 60 }, (_, i) => i);

const VIRTUAL_INDICES = Array.from({ length: VIRTUAL_COUNT }, (_, i) => i);

/* ============================================================
 * TIME HELPERS
 * ========================================================== */

const formatTime = (hours: number, minutes: number) => {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}`;
};

const parseTime = (value?: string) => {
  if (!value) {
    return {
      hours: 12,
      minutes: 0,
    };
  }

  const match = value.match(/^(\d{2}):(\d{2})$/);

  if (!match) {
    return {
      hours: 12,
      minutes: 0,
    };
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return {
      hours: 12,
      minutes: 0,
    };
  }

  return {
    hours,
    minutes,
  };
};

const formatDisplayTime = (value?: string) => {
  if (!value) {
    return "";
  }

  const match = value.match(/^(\d{2}):(\d{2})$/);

  if (!match) {
    return value;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/* ============================================================
 * WHEEL ROW
 * ========================================================== */

type WheelRowProps = {
  index: number;
  displayValue: number;
  scrollY: Animated.Value;
  textColor: string;
  onPress: (index: number) => void;
};

const WheelRow = React.memo(function WheelRow({
  index,
  displayValue,
  scrollY,
  textColor,
  onPress,
}: WheelRowProps) {
  const inputRange = [
    (index - 2) * ITEM_HEIGHT,
    (index - 1) * ITEM_HEIGHT,
    index * ITEM_HEIGHT,
    (index + 1) * ITEM_HEIGHT,
    (index + 2) * ITEM_HEIGHT,
  ];

  const scale = scrollY.interpolate({
    inputRange,
    outputRange: [0.88, 0.94, 1, 0.94, 0.88],
    extrapolate: "clamp",
  });

  const opacity = scrollY.interpolate({
    inputRange,
    outputRange: [0.22, 0.55, 1, 0.55, 0.22],
    extrapolate: "clamp",
  });

  return (
    <Pressable
      onPress={() => onPress(index)}
      style={{
        height: ITEM_HEIGHT,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.Text
        style={{
          color: textColor,
          fontFamily: fontFamily.body,
          fontSize: 19,
          fontWeight: "600",
          opacity,
          transform: [{ scale }],
        }}
      >
        {String(displayValue).padStart(2, "0")}
      </Animated.Text>
    </Pressable>
  );
});

/* ============================================================
 * WHEEL
 * ========================================================== */

type WheelProps = {
  values: number[];
  selectedValue: number;
  onChange: (value: number) => void;
  textColor: string;
  gold: string;
};

const AnimatedFlatList =
  Animated.FlatList as unknown as new () => FlatList<number>;

function Wheel({
  values,
  selectedValue,
  onChange,
  textColor,
  gold,
}: WheelProps) {
  const listRef = useRef<FlatList<number>>(null);

  const valueCount = values.length;

  /* ----------------------------------------------------------
   * Starting position
   * -------------------------------------------------------- */

  const startingIndex = useMemo(() => {
    const base = MIDDLE_INDEX - (MIDDLE_INDEX % valueCount);

    return base + selectedValue;
  }, [selectedValue, valueCount]);

  /* ----------------------------------------------------------
   * Native-driven scroll value
   * -------------------------------------------------------- */

  const scrollY = useRef(
    new Animated.Value(startingIndex * ITEM_HEIGHT),
  ).current;

  /* ----------------------------------------------------------
   * Last externally applied value
   * -------------------------------------------------------- */

  const lastAppliedValue = useRef(selectedValue);

  /* ----------------------------------------------------------
   * Last row that produced a tick
   * -------------------------------------------------------- */

  const lastTickedIndex = useRef(startingIndex);

  /* ----------------------------------------------------------
   * Audio initialization
   *
   * Initialize lazily so opening the picker doesn't introduce
   * unnecessary work before the user actually scrolls.
   * -------------------------------------------------------- */

  const ensureAudioReady = useCallback(() => {
    if (!tickPlayersInitialized && !tickPlayersFailed) {
      initializeTickPlayers();
    }
  }, []);

  /* ----------------------------------------------------------
   * TICK
   *
   * IMPORTANT:
   *
   * There is NO 32ms throttle anymore.
   *
   * Every row transition gets a tick.
   *
   * The sound itself is handled by the audio pool, so starting
   * another tick does not cut off the previous one.
   * -------------------------------------------------------- */

  const triggerTick = useCallback(() => {
    /*
     * Haptic for every row.
     */
    Haptics.selectionAsync().catch(() => {});

    /*
     * Audio.
     */
    ensureAudioReady();

    playTickSound();
  }, [ensureAudioReady]);

  /* ----------------------------------------------------------
   * Convert virtual index -> actual value
   * -------------------------------------------------------- */

  const getValueFromIndex = useCallback(
    (index: number) => {
      const normalized = ((index % valueCount) + valueCount) % valueCount;

      return values[normalized];
    },
    [values, valueCount],
  );

  /* ----------------------------------------------------------
   * Sync external selected value
   * -------------------------------------------------------- */

  useEffect(() => {
    if (selectedValue === lastAppliedValue.current) {
      return;
    }

    lastAppliedValue.current = selectedValue;

    const base = MIDDLE_INDEX - (MIDDLE_INDEX % valueCount);

    const newIndex = base + selectedValue;

    const offset = newIndex * ITEM_HEIGHT;

    scrollY.setValue(offset);

    lastTickedIndex.current = newIndex;

    listRef.current?.scrollToOffset({
      offset,
      animated: false,
    });
  }, [selectedValue, valueCount, scrollY]);

  /* ----------------------------------------------------------
   * Scroll tick detection
   *
   * This is intentionally based on the actual centered row.
   *
   * If the scroll goes:
   *
   * 100 -> 101 -> 102 -> 103
   *
   * we produce:
   *
   * tick tick tick
   *
   * even when the movement becomes extremely slow.
   * -------------------------------------------------------- */

  const handleScrollTick = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;

      const currentIndex = Math.round(offsetY / ITEM_HEIGHT);

      const previousIndex = lastTickedIndex.current;

      /*
       * Nothing changed.
       */
      if (currentIndex === previousIndex) {
        return;
      }

      /*
       * The wheel can move more than one row between two
       * JS scroll events when moving very quickly.
       *
       * We therefore catch up every crossed row.
       *
       * Example:
       *
       * 100 -> 103
       *
       * produces:
       *
       * tick
       * tick
       * tick
       *
       * rather than only one tick.
       */
      const direction = currentIndex > previousIndex ? 1 : -1;

      const distance = Math.abs(currentIndex - previousIndex);

      /*
       * Protect against pathological jumps.
       */
      const steps = Math.min(distance, 20);

      for (let i = 1; i <= steps; i++) {
        triggerTick();
      }

      lastTickedIndex.current = currentIndex;
    },
    [triggerTick],
  );

  /* ----------------------------------------------------------
   * Momentum end
   * -------------------------------------------------------- */

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;

      const index = Math.round(offsetY / ITEM_HEIGHT);

      const safeIndex = Math.max(0, Math.min(index, VIRTUAL_COUNT - 1));

      const value = getValueFromIndex(safeIndex);

      if (value !== undefined) {
        lastAppliedValue.current = value;

        onChange(value);
      }
    },
    [getValueFromIndex, onChange],
  );

  /* ----------------------------------------------------------
   * Row press
   * -------------------------------------------------------- */

  const handleItemPress = useCallback((index: number) => {
    /*
     * Do not play a tick immediately here.
     *
     * The actual scroll movement will cross the row and
     * handleScrollTick will generate the tick.
     *
     * This prevents double ticks.
     */
    listRef.current?.scrollToOffset({
      offset: index * ITEM_HEIGHT,
      animated: true,
    });
  }, []);

  /* ----------------------------------------------------------
   * Render item
   * -------------------------------------------------------- */

  const renderItem = useCallback(
    ({ item: index }: ListRenderItemInfo<number>) => {
      return (
        <WheelRow
          index={index}
          displayValue={getValueFromIndex(index)}
          scrollY={scrollY}
          textColor={textColor}
          onPress={handleItemPress}
        />
      );
    },
    [getValueFromIndex, scrollY, textColor, handleItemPress],
  );

  /* ----------------------------------------------------------
   * Fixed item layout
   * -------------------------------------------------------- */

  const getItemLayout = useCallback(
    (_data: ArrayLike<number> | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  const keyExtractor = useCallback((item: number) => String(item), []);

  /* ----------------------------------------------------------
   * WHEEL
   * -------------------------------------------------------- */

  return (
    <View
      style={{
        width: 88,
        height: WHEEL_HEIGHT,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ----------------------------------------------------
       * SELECTED ROW
       * -------------------------------------------------- */}

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: CENTER_OFFSET * ITEM_HEIGHT,
          height: ITEM_HEIGHT,
          borderRadius: 12,
          backgroundColor: `${gold}18`,
          borderWidth: 1,
          borderColor: `${gold}55`,
          zIndex: 10,
        }}
      />

      {/* ----------------------------------------------------
       * WHEEL
       * -------------------------------------------------- */}

      <AnimatedFlatList
        ref={listRef}
        data={VIRTUAL_INDICES}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        initialScrollIndex={startingIndex}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        /*
         * Fast, natural wheel physics.
         */
        decelerationRate={Platform.OS === "ios" ? 0.998 : 0.985}
        /*
         * Allow the wheel to carry momentum through many
         * values.
         */
        disableIntervalMomentum={false}
        /*
         * Disable elastic edges.
         */
        bounces={false}
        overScrollMode="never"
        nestedScrollEnabled
        /*
         * Native scroll events every frame.
         */
        scrollEventThrottle={16}
        /*
         * Rendering configuration.
         */
        initialNumToRender={9}
        maxToRenderPerBatch={12}
        windowSize={9}
        updateCellsBatchingPeriod={16}
        removeClippedSubviews={false}
        /*
         * Allow the first/last virtual rows to reach the center.
         */
        contentContainerStyle={{
          paddingTop: CENTER_OFFSET * ITEM_HEIGHT,

          paddingBottom: CENTER_OFFSET * ITEM_HEIGHT,
        }}
        /*
         * IMPORTANT:
         *
         * The visual animation is 100% native driven.
         *
         * JS is only listening for row transitions to trigger
         * sound/haptics.
         */
        onScroll={Animated.event(
          [
            {
              nativeEvent: {
                contentOffset: {
                  y: scrollY,
                },
              },
            },
          ],
          {
            useNativeDriver: true,
            listener: handleScrollTick,
          },
        )}
        /*
         * React state is updated only after momentum finishes.
         */
        onMomentumScrollEnd={handleMomentumEnd}
      />
    </View>
  );
}

/* ============================================================
 * MAIN COMPONENT
 * ========================================================== */

export function TimePickerField({
  label = "Time of birth",
  value,
  onChange,
  placeholder = "Select your time of birth",
  testID,
}: TimePickerFieldProps) {
  const { c } = useTheme();

  const [visible, setVisible] = useState(false);

  const [selectedHour, setSelectedHour] = useState(
    () => parseTime(value).hours,
  );

  const [selectedMinute, setSelectedMinute] = useState(
    () => parseTime(value).minutes,
  );

  /* ----------------------------------------------------------
   * OPEN
   * -------------------------------------------------------- */

  const openPicker = () => {
    const current = parseTime(value);

    setSelectedHour(current.hours);
    setSelectedMinute(current.minutes);

    setVisible(true);
  };

  /* ----------------------------------------------------------
   * CLOSE
   * -------------------------------------------------------- */

  const closePicker = () => {
    setVisible(false);
  };

  /* ----------------------------------------------------------
   * CONFIRM
   * -------------------------------------------------------- */

  const confirmTime = () => {
    const formatted = formatTime(selectedHour, selectedMinute);

    onChange(formatted);

    setVisible(false);
  };

  const selectedTime = formatTime(selectedHour, selectedMinute);

  const displaySelectedTime = formatDisplayTime(selectedTime);

  const hasValue = Boolean(value);

  return (
    <>
      {/* =====================================================
       * FIELD
       * =================================================== */}

      <View
        style={{
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            color: c.textSecondary,
            fontSize: 11,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            fontWeight: "600",
            marginBottom: 9,
          }}
        >
          {label}
        </Text>

        <Pressable
          testID={testID}
          onPress={openPicker}
          style={({ pressed }) => ({
            minHeight: 54,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: hasValue ? c.gold : c.border,
            backgroundColor: c.bg,
            paddingHorizontal: 15,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: pressed ? 0.78 : 1,
          })}
        >
          <View
            style={{
              flex: 1,
            }}
          >
            <Text
              style={{
                color: hasValue ? c.textPrimary : c.textSecondary,
                fontSize: 14,
                fontFamily: hasValue ? fontFamily.body : undefined,
              }}
            >
              {hasValue ? formatDisplayTime(value) : placeholder}
            </Text>

            {hasValue && (
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 10,
                  marginTop: 3,
                }}
              >
                {value} · 24-hour format
              </Text>
            )}
          </View>

          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: c.surface,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            <Text
              style={{
                color: c.gold,
                fontSize: 16,
              }}
            >
              ◷
            </Text>
          </View>
        </Pressable>
      </View>

      {/* =====================================================
       * MODAL
       * =================================================== */}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={closePicker}
        statusBarTranslucent
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.48)",
            justifyContent: "flex-end",
          }}
        >
          {/* -------------------------------------------------
           * BACKDROP
           * ----------------------------------------------- */}

          <Pressable
            onPress={closePicker}
            style={{
              flex: 1,
            }}
          />

          {/* -------------------------------------------------
           * SHEET
           * ----------------------------------------------- */}

          <View
            style={{
              backgroundColor: c.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 18,
              paddingBottom: Platform.OS === "ios" ? 28 : 24,
              borderWidth: 1,
              borderColor: c.border,
              elevation: 16,
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: -4,
              },
              shadowOpacity: 0.14,
              shadowRadius: 14,
            }}
          >
            {/* =================================================
             * HEADER
             * =============================================== */}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
              }}
            >
              <View>
                <Text
                  style={{
                    color: c.gold,
                    fontSize: 10,
                    letterSpacing: 1.8,
                    fontWeight: "600",
                  }}
                >
                  ORIVO
                </Text>

                <Text
                  style={{
                    color: c.textPrimary,
                    fontFamily: fontFamily.display,
                    fontSize: 20,
                    fontWeight: "600",
                    marginTop: 3,
                  }}
                >
                  Time of birth
                </Text>
              </View>

              <Pressable
                onPress={closePicker}
                hitSlop={10}
                style={({ pressed }) => ({
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: c.bg,
                  borderWidth: 1,
                  borderColor: c.border,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    color: c.textSecondary,
                    fontSize: 18,
                    lineHeight: 20,
                  }}
                >
                  ×
                </Text>
              </Pressable>
            </View>

            {/* =================================================
             * SELECTED TIME
             * =============================================== */}

            <View
              style={{
                alignItems: "center",
                marginTop: 16,
              }}
            >
              <Text
                style={{
                  color: c.gold,
                  fontFamily: fontFamily.display,
                  fontSize: 30,
                  fontWeight: "600",
                  letterSpacing: 0.5,
                }}
              >
                {displaySelectedTime}
              </Text>

              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 10,
                  marginTop: 3,
                  letterSpacing: 0.4,
                }}
              >
                24-hour format
              </Text>
            </View>

            {/* =================================================
             * WHEELS
             * =============================================== */}

            <View
              style={{
                height: WHEEL_HEIGHT,
                marginTop: 14,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Wheel
                values={HOURS}
                selectedValue={selectedHour}
                onChange={setSelectedHour}
                textColor={c.textPrimary}
                gold={c.gold}
              />

              {/* Colon */}

              <View
                style={{
                  width: 28,
                  height: WHEEL_HEIGHT,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: c.gold,
                    fontSize: 25,
                    fontWeight: "700",
                  }}
                >
                  :
                </Text>
              </View>

              <Wheel
                values={MINUTES}
                selectedValue={selectedMinute}
                onChange={setSelectedMinute}
                textColor={c.textPrimary}
                gold={c.gold}
              />
            </View>

            {/* =================================================
             * LABELS
             * =============================================== */}

            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginTop: 4,
                marginBottom: 14,
              }}
            >
              <View
                style={{
                  width: 88,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: c.textSecondary,
                    fontSize: 9,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                  }}
                >
                  Hour
                </Text>
              </View>

              <View
                style={{
                  width: 28,
                }}
              />

              <View
                style={{
                  width: 88,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: c.textSecondary,
                    fontSize: 9,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                  }}
                >
                  Minute
                </Text>
              </View>
            </View>

            {/* =================================================
             * ACTIONS
             * =============================================== */}

            <View
              style={{
                flexDirection: "row",
                gap: 10,
                marginHorizontal: 20,
              }}
            >
              <Pressable
                onPress={closePicker}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 52,
                  borderRadius: radii.md,
                  backgroundColor: c.bg,
                  borderWidth: 1,
                  borderColor: c.border,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Text
                  style={{
                    color: c.textSecondary,
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={confirmTime}
                style={({ pressed }) => ({
                  flex: 1.5,
                  height: 52,
                  borderRadius: radii.md,
                  backgroundColor: c.gold,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.82 : 1,
                })}
              >
                <Text
                  style={{
                    color: c.primaryInk,
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  Confirm time
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default TimePickerField;
