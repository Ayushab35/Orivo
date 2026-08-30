import React, { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { useTheme } from "../lib/themeContext";
import { fontFamily, radii } from "../lib/theme";

type DatePickerFieldProps = {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  testID?: string;
  minimumDate?: Date;
  maximumDate?: Date;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDate = (value?: string) => {
  if (!value) {
    return new Date(1990, 0, 1);
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return new Date(1990, 0, 1);
  }

  const [, year, month, day] = match;

  return new Date(Number(year), Number(month) - 1, Number(day));
};

const formatDisplayDate = (value?: string) => {
  if (!value) {
    return "";
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return value;
  }

  const [, year, month, day] = match;

  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date: Date, amount: number) =>
  new Date(date.getFullYear(), date.getMonth() + amount, 1);

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isBeforeDay = (a: Date, b: Date) => {
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate());

  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate());

  return aa.getTime() < bb.getTime();
};

const isAfterDay = (a: Date, b: Date) => {
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate());

  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate());

  return aa.getTime() > bb.getTime();
};

const isDateDisabled = (date: Date, minimumDate?: Date, maximumDate?: Date) => {
  if (minimumDate && isBeforeDay(date, minimumDate)) {
    return true;
  }

  if (maximumDate && isAfterDay(date, maximumDate)) {
    return true;
  }

  return false;
};

const getCalendarDays = (monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: Array<Date | null> = [];

  // Always render 6 weeks.
  for (let index = 0; index < 42; index++) {
    const dayNumber = index - firstDay + 1;

    if (dayNumber < 1 || dayNumber > daysInMonth) {
      days.push(null);
    } else {
      days.push(new Date(year, month, dayNumber));
    }
  }

  return days;
};

type YearItem = {
  year: number;
};

export function DatePickerField({
  label = "Date of birth",
  value,
  onChange,
  placeholder = "Select your date of birth",
  testID,
  minimumDate = new Date(1900, 0, 1),
  maximumDate = new Date(),
}: DatePickerFieldProps) {
  const { c } = useTheme();

  const [visible, setVisible] = useState(false);

  const [selectionMode, setSelectionMode] = useState<"calendar" | "year">(
    "calendar",
  );

  const initialDate = useMemo(() => parseDate(value), [value]);

  const [selectedDate, setSelectedDate] = useState(initialDate);

  const [displayMonth, setDisplayMonth] = useState(() =>
    startOfMonth(initialDate),
  );

  const today = useMemo(() => new Date(), []);

  const yearListRef = useRef<FlatList<YearItem>>(null);

  const minimumYear = minimumDate.getFullYear();

  const maximumYear = maximumDate.getFullYear();

  const years = useMemo(() => {
    const result: number[] = [];

    for (let year = maximumYear; year >= minimumYear; year--) {
      result.push(year);
    }

    return result;
  }, [minimumYear, maximumYear]);

  const yearItems = useMemo<YearItem[]>(
    () =>
      years.map((year) => ({
        year,
      })),
    [years],
  );

  const selectedYear = displayMonth.getFullYear();

  const selectedYearIndex = Math.max(0, years.indexOf(selectedYear));

  /*
   * Scroll the selected year into a comfortable
   * position when opening the year selector.
   */
  useEffect(() => {
    if (selectionMode !== "year" || !visible || years.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      try {
        yearListRef.current?.scrollToIndex({
          index: selectedYearIndex,
          animated: false,
          viewPosition: 0.25,
        });
      } catch {
        // FlatList may not have calculated layout yet.
      }
    }, 80);

    return () => clearTimeout(timer);
  }, [selectionMode, visible, selectedYearIndex, years.length]);

  const openPicker = () => {
    const date = parseDate(value);

    setSelectedDate(date);
    setDisplayMonth(startOfMonth(date));
    setSelectionMode("calendar");
    setVisible(true);
  };

  const closePicker = () => {
    setVisible(false);
    setSelectionMode("calendar");
  };

  const confirmDate = () => {
    onChange(formatDate(selectedDate));
    closePicker();
  };

  const goToPreviousMonth = () => {
    const previousMonth = addMonths(displayMonth, -1);

    const minMonth = new Date(minimumYear, minimumDate.getMonth(), 1);

    if (previousMonth.getTime() < minMonth.getTime()) {
      return;
    }

    setDisplayMonth(previousMonth);
  };

  const goToNextMonth = () => {
    const nextMonth = addMonths(displayMonth, 1);

    const maxMonth = new Date(maximumYear, maximumDate.getMonth(), 1);

    if (nextMonth.getTime() > maxMonth.getTime()) {
      return;
    }

    setDisplayMonth(nextMonth);
  };

  const selectYear = (year: number) => {
    let month = displayMonth.getMonth();

    if (year === maximumYear && month > maximumDate.getMonth()) {
      month = maximumDate.getMonth();
    }

    if (year === minimumYear && month < minimumDate.getMonth()) {
      month = minimumDate.getMonth();
    }

    const newMonth = new Date(year, month, 1);

    setDisplayMonth(newMonth);

    const daysInNewMonth = new Date(year, month + 1, 0).getDate();

    const newDay = Math.min(selectedDate.getDate(), daysInNewMonth);

    let newDate = new Date(year, month, newDay);

    /*
     * Ensure the selected date is still inside
     * the allowed range.
     */
    if (isDateDisabled(newDate, minimumDate, maximumDate)) {
      if (minimumDate && isBeforeDay(newDate, minimumDate)) {
        newDate = new Date(minimumDate);
      }

      if (maximumDate && isAfterDay(newDate, maximumDate)) {
        newDate = new Date(maximumDate);
      }
    }

    setSelectedDate(newDate);
    setSelectionMode("calendar");
  };

  const goToPreviousYear = () => {
    const currentYear = displayMonth.getFullYear();

    if (currentYear <= minimumYear) {
      return;
    }

    selectYear(currentYear - 1);
  };

  const goToNextYear = () => {
    const currentYear = displayMonth.getFullYear();

    if (currentYear >= maximumYear) {
      return;
    }

    selectYear(currentYear + 1);
  };

  const calendarDays = useMemo(
    () => getCalendarDays(displayMonth),
    [displayMonth],
  );

  const hasValue = Boolean(value);

  return (
    <>
      {/* ================================================== */}
      {/* FIELD                                              */}
      {/* ================================================== */}

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
              {hasValue ? formatDisplayDate(value) : placeholder}
            </Text>

            {hasValue && (
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 10,
                  marginTop: 3,
                }}
              >
                {value}
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
              ▣
            </Text>
          </View>
        </Pressable>
      </View>

      {/* ================================================== */}
      {/* MODAL                                              */}
      {/* ================================================== */}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={closePicker}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.50)",
            justifyContent: "flex-end",
          }}
        >
          {/* Dismiss area */}
          <Pressable
            style={{
              flex: 1,
            }}
            onPress={closePicker}
          />

          {/* ================================================== */}
          {/* SHEET                                               */}
          {/* ================================================== */}

          <View
            style={{
              backgroundColor: c.surface,
              borderTopLeftRadius: 26,
              borderTopRightRadius: 26,
              paddingTop: 20,
              paddingBottom: 30,
              borderWidth: 1,
              borderColor: c.border,
              height: 700,
            }}
          >
            {/* ================================================== */}
            {/* HEADER                                               */}
            {/* ================================================== */}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                marginBottom: 20,
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
                    fontSize: 21,
                    fontWeight: "600",
                    marginTop: 4,
                  }}
                >
                  Date of birth
                </Text>
              </View>

              <Pressable
                onPress={closePicker}
                hitSlop={8}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: c.bg,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              >
                <Text
                  style={{
                    color: c.textSecondary,
                    fontSize: 19,
                    lineHeight: 20,
                  }}
                >
                  ×
                </Text>
              </Pressable>
            </View>

            {/* ================================================== */}
            {/* SELECTED DATE                                      */}
            {/* ================================================== */}

            <View
              style={{
                marginHorizontal: 20,
                marginBottom: 20,
                padding: 16,
                borderRadius: radii.md,
                backgroundColor: c.bg,
                borderWidth: 1,
                borderColor: c.border,
              }}
            >
              <Text
                style={{
                  color: c.textSecondary,
                  fontSize: 10,
                  letterSpacing: 1.3,
                  textTransform: "uppercase",
                  fontWeight: "600",
                  marginBottom: 5,
                }}
              >
                Selected date
              </Text>

              <Text
                style={{
                  color: c.gold,
                  fontFamily: fontFamily.display,
                  fontSize: 24,
                  fontWeight: "600",
                }}
              >
                {selectedDate.toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </View>

            {/* ================================================== */}
            {/* YEAR SELECTOR                                      */}
            {/* ================================================== */}

            {selectionMode === "year" ? (
              <View
                style={{
                  flex: 1,
                  minHeight: 0,
                }}
              >
                {/* ============================================== */}
                {/* YEAR HEADER                                      */}
                {/* ============================================== */}

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 20,
                    marginBottom: 12,
                  }}
                >
                  <Pressable
                    onPress={goToPreviousYear}
                    disabled={selectedYear <= minimumYear}
                    style={({ pressed }) => ({
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: c.bg,
                      borderWidth: 1,
                      borderColor: c.border,
                      opacity:
                        selectedYear <= minimumYear ? 0.3 : pressed ? 0.7 : 1,
                    })}
                  >
                    <Text
                      style={{
                        color: c.textPrimary,
                        fontSize: 23,
                        lineHeight: 25,
                      }}
                    >
                      ‹
                    </Text>
                  </Pressable>

                  <View
                    style={{
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: c.textPrimary,
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      Select year
                    </Text>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 5,
                      }}
                    >
                      <View
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 3,
                          backgroundColor: c.gold,
                          marginRight: 6,
                        }}
                      />

                      <Text
                        style={{
                          color: c.textSecondary,
                          fontSize: 10,
                          letterSpacing: 0.5,
                        }}
                      >
                        {selectedYear}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={goToNextYear}
                    disabled={selectedYear >= maximumYear}
                    style={({ pressed }) => ({
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: c.bg,
                      borderWidth: 1,
                      borderColor: c.border,
                      opacity:
                        selectedYear >= maximumYear ? 0.3 : pressed ? 0.7 : 1,
                    })}
                  >
                    <Text
                      style={{
                        color: c.textPrimary,
                        fontSize: 23,
                        lineHeight: 25,
                      }}
                    >
                      ›
                    </Text>
                  </Pressable>
                </View>

                {/* ============================================== */}
                {/* YEAR GRID                                       */}
                {/* ============================================== */}

                <View
                  style={{
                    flex: 1,
                    minHeight: 0,
                    marginHorizontal: 14,
                    marginTop: 2,
                    borderRadius: radii.lg,
                    backgroundColor: c.bg,
                    borderWidth: 1,
                    borderColor: c.border,
                    overflow: "hidden",
                  }}
                >
                  <FlatList
                    ref={yearListRef}
                    data={yearItems}
                    keyExtractor={(item) => String(item.year)}
                    numColumns={3}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                      paddingHorizontal: 10,
                      paddingTop: 14,
                      paddingBottom: 18,
                    }}
                    columnWrapperStyle={{
                      justifyContent: "space-between",
                    }}
                    initialNumToRender={24}
                    maxToRenderPerBatch={30}
                    windowSize={7}
                    getItemLayout={(_data, index) => ({
                      length: 58,
                      offset: 58 * index,
                      index,
                    })}
                    onScrollToIndexFailed={(info) => {
                      setTimeout(() => {
                        yearListRef.current?.scrollToOffset({
                          offset: Math.max(
                            0,
                            info.averageItemLength * info.index,
                          ),
                          animated: false,
                        });
                      }, 50);
                    }}
                    renderItem={({ item }) => {
                      const year = item.year;

                      const selected = year === selectedYear;

                      const current = year === today.getFullYear();

                      return (
                        <Pressable
                          onPress={() => selectYear(year)}
                          style={({ pressed }) => ({
                            width: "31.8%",
                            height: 48,
                            marginBottom: 10,
                            borderRadius: radii.md,
                            alignItems: "center",
                            justifyContent: "center",

                            backgroundColor: selected
                              ? c.overlay
                              : pressed
                                ? c.surfaceMuted
                                : "transparent",

                            borderWidth: selected || current ? 1 : 0,

                            borderColor: selected
                              ? c.gold
                              : current
                                ? c.borderStrong
                                : "transparent",

                            transform: [
                              {
                                scale: pressed ? 0.97 : 1,
                              },
                            ],
                          })}
                        >
                          <Text
                            style={{
                              color: selected ? c.gold : c.textPrimary,
                              fontSize: 15,
                              fontWeight: selected ? "700" : "500",
                              letterSpacing: 0.1,
                            }}
                          >
                            {year}
                          </Text>

                          {current && (
                            <View
                              style={{
                                position: "absolute",
                                bottom: 5,
                                width: 3,
                                height: 3,
                                borderRadius: 2,
                                backgroundColor: c.gold,
                              }}
                            />
                          )}
                        </Pressable>
                      );
                    }}
                  />
                </View>

                {/* ============================================== */}
                {/* FOOTER                                           */}
                {/* ============================================== */}

                <View
                  style={{
                    alignItems: "center",
                    paddingTop: 12,
                    paddingBottom: 2,
                  }}
                >
                  <Pressable
                    onPress={() => setSelectionMode("calendar")}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 18,
                      paddingVertical: 9,
                      borderRadius: radii.pill,
                      backgroundColor: pressed ? c.surfaceAlt : c.surface,
                      borderWidth: 1,
                      borderColor: c.border,
                    })}
                  >
                    <Text
                      style={{
                        color: c.textSecondary,
                        fontSize: 14,
                        marginRight: 7,
                      }}
                    >
                      ‹
                    </Text>

                    <Text
                      style={{
                        color: c.gold,
                        fontSize: 12,
                        fontWeight: "600",
                        letterSpacing: 0.2,
                      }}
                    >
                      Back to calendar
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                {/* ================================================== */}
                {/* MONTH NAVIGATION                                   */}
                {/* ================================================== */}

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 20,
                    marginBottom: 15,
                  }}
                >
                  <Pressable
                    onPress={goToPreviousMonth}
                    style={({ pressed }) => ({
                      width: 38,
                      height: 38,
                      borderRadius: 19,
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
                        color: c.textPrimary,
                        fontSize: 20,
                      }}
                    >
                      ‹
                    </Text>
                  </Pressable>

                  {/* CLICKABLE MONTH / YEAR */}

                  <Pressable
                    onPress={() => setSelectionMode("year")}
                    style={({ pressed }) => ({
                      alignItems: "center",
                      paddingHorizontal: 20,
                      paddingVertical: 5,
                      borderRadius: radii.md,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text
                      style={{
                        color: c.textPrimary,
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      {MONTHS[displayMonth.getMonth()]}
                    </Text>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 3,
                      }}
                    >
                      <Text
                        style={{
                          color: c.gold,
                          fontSize: 11,
                          fontWeight: "600",
                        }}
                      >
                        {displayMonth.getFullYear()}
                      </Text>

                      <Text
                        style={{
                          color: c.textSecondary,
                          fontSize: 10,
                          marginLeft: 5,
                        }}
                      >
                        Tap to change
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={goToNextMonth}
                    style={({ pressed }) => ({
                      width: 38,
                      height: 38,
                      borderRadius: 19,
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
                        color: c.textPrimary,
                        fontSize: 20,
                      }}
                    >
                      ›
                    </Text>
                  </Pressable>
                </View>

                {/* ================================================== */}
                {/* WEEKDAYS                                            */}
                {/* ================================================== */}

                <View
                  style={{
                    flexDirection: "row",
                    paddingHorizontal: 20,
                    marginBottom: 6,
                  }}
                >
                  {WEEKDAYS.map((day, index) => (
                    <View
                      key={`${day}-${index}`}
                      style={{
                        width: "14.2857%",
                        alignItems: "center",
                        justifyContent: "center",
                        height: 30,
                      }}
                    >
                      <Text
                        style={{
                          color: c.textSecondary,
                          fontSize: 10,
                          fontWeight: "600",
                        }}
                      >
                        {day}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* ================================================== */}
                {/* CALENDAR                                             */}
                {/* ================================================== */}

                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    paddingHorizontal: 20,
                    height: 276,
                  }}
                >
                  {calendarDays.map((date, index) => {
                    if (!date) {
                      return (
                        <View
                          key={`empty-${index}`}
                          style={{
                            width: "14.2857%",
                            height: 46,
                          }}
                        />
                      );
                    }

                    const selected = isSameDay(date, selectedDate);

                    const todayDate = isSameDay(date, today);

                    const disabled = isDateDisabled(
                      date,
                      minimumDate,
                      maximumDate,
                    );

                    return (
                      <View
                        key={formatDate(date)}
                        style={{
                          width: "14.2857%",
                          height: 46,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Pressable
                          disabled={disabled}
                          onPress={() => setSelectedDate(date)}
                          style={({ pressed }) => ({
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: selected
                              ? c.gold
                              : pressed
                                ? c.bg
                                : "transparent",
                            opacity: disabled ? 0.25 : 1,
                          })}
                        >
                          <Text
                            style={{
                              color: selected ? c.primaryInk : c.textPrimary,
                              fontSize: 13,
                              fontWeight: selected ? "700" : "400",
                            }}
                          >
                            {date.getDate()}
                          </Text>

                          {todayDate && !selected && (
                            <View
                              style={{
                                position: "absolute",
                                bottom: 3,
                                width: 4,
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: c.gold,
                              }}
                            />
                          )}
                        </Pressable>
                      </View>
                    );
                  })}
                </View>

                {/* ================================================== */}
                {/* TODAY                                                */}
                {/* ================================================== */}

                <Pressable
                  onPress={() => {
                    if (!isDateDisabled(today, minimumDate, maximumDate)) {
                      setSelectedDate(today);
                      setDisplayMonth(startOfMonth(today));
                    }
                  }}
                  style={{
                    alignSelf: "center",
                    marginTop: 10,
                    marginBottom: 18,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: radii.pill,
                    backgroundColor: c.bg,
                    borderWidth: 1,
                    borderColor: c.border,
                  }}
                >
                  <Text
                    style={{
                      color: c.gold,
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    today
                  </Text>
                </Pressable>

                {/* ================================================== */}
                {/* CONFIRM                                              */}
                {/* ================================================== */}

                <Pressable
                  onPress={confirmDate}
                  style={({ pressed }) => ({
                    marginHorizontal: 20,
                    height: 52,
                    borderRadius: radii.md,
                    backgroundColor: c.gold,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text
                    style={{
                      color: c.primaryInk,
                      fontSize: 14,
                      fontWeight: "700",
                    }}
                  >
                    Confirm date
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

export default DatePickerField;