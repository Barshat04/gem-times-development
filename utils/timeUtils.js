// timeUtils.js

import AsyncStorage from "@react-native-async-storage/async-storage";

const LOCAL_TIMESHEET_KEY = "localTimesheet";

export const saveLocalTimesheet = async (data) => {
  await AsyncStorage.setItem(LOCAL_TIMESHEET_KEY, JSON.stringify(data));
};

export const getLocalTimesheet = async () => {
  const stored = await AsyncStorage.getItem(LOCAL_TIMESHEET_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const clearLocalTimesheet = async () => {
  await AsyncStorage.removeItem(LOCAL_TIMESHEET_KEY);
};

const timeUtils = {
  getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  },

  convertTo24HourFormat(time) {
    if (!time) return [NaN, NaN];

    // Handle "HHMM" format (e.g., "0930" or "1730")
    if (/^\d{4}$/.test(time)) {
      const hours = parseInt(time.substring(0, 2), 10);
      const minutes = parseInt(time.substring(2, 4), 10);
      return [hours, minutes];
    }

    // Handle "HH:MM" 24-hour format
    if (!time.includes(" ")) {
      const [hours, minutes] = time.split(":").map(Number);
      return [hours, minutes];
    }

    // Handle 12-hour format with AM/PM
    const [timePart, period] = time.split(" ");
    const [hours, minutes] = timePart.split(":").map(Number);

    let adjustedHours = hours;
    if (period === "PM" && hours !== 12) adjustedHours += 12;
    if (period === "AM" && hours === 12) adjustedHours = 0;

    return [adjustedHours, minutes];
  },

  convertToDateTime(timeString) {
    const [hours, minutes] = timeString
      .split(":")
      .map((num) => parseInt(num, 10));

    // Create a new date in UTC
    const now = new Date();
    const utcDate = new Date(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      hours,
      minutes,
      0, // seconds
      0 // milliseconds
    );

    // Adjust to Australian Eastern Standard Time (AEST, UTC+10)
    const offsetInHours = 10; // Adjust for AEST
    utcDate.setHours(utcDate.getHours() + offsetInHours);

    return utcDate;
  },

  calculateTimeDifference(start, finish) {
    if (!start || !finish) return;

    try {
      const [startHours, startMinutes] = this.convertTo24HourFormat(start);
      const [finishHours, finishMinutes] = this.convertTo24HourFormat(finish);

      if (isNaN(startHours) || isNaN(finishHours)) {
        throw new Error("Invalid time format");
      }

      const startInMinutes = startHours * 60 + startMinutes;
      const finishInMinutes = finishHours * 60 + finishMinutes;

      let diffInMinutes = finishInMinutes - startInMinutes;
      if (diffInMinutes < 0) diffInMinutes += 24 * 60; // Handle overnight

      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;

      if (hours > 24 || hours < 0 || minutes > 60 || minutes < 0) {
        return "";
      }

      return `${hours}h ${minutes}m`;
    } catch (error) {
      console.error("Time calculation error:", error);
      return "Invalid Time";
    }
  },
};

export default timeUtils;
