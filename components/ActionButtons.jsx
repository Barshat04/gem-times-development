import React, { useEffect, useState, useContext } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import {
  HStack,
  Button,
  Spinner,
  Text
} from "native-base";
import { UserContext } from "@/context/UserContext";
import { TaskContext } from "@/context/TaskContext";

function ActionButtons() {
  const { userData } = useContext(UserContext);
  const {
    activeTimesheet,
    activeTask,
    taskLoading,
    viewPastTimesheets,
    pastTimesheets,
    setViewPastTimesheets,
    isCurrentlyClockedOn
  } = useContext(TaskContext);

  const [manualEntry, setManualEntry] = useState(false);

  useEffect(() => {
    if (userData?.timeEntryType === "M") {
      setManualEntry(true);
    } else {
      setManualEntry(false);
    }
  }, [userData]);

  const getTodayDate = () => new Date().toISOString().split("T")[0];

  const hasSubmittedToday = () => {
    const today = getTodayDate();
    return pastTimesheets?.some((ts) => ts.forDate === today);
  };

  const handleClockOn = () => {
    if (hasSubmittedToday()) {
      Alert.alert(
        "Timesheet Already Submitted",
        "You have already submitted a timesheet for today. Here's your previous timesheets:",
        [{ text: "OK", onPress: () => setViewPastTimesheets(true) }]
      );
      return;
    }

    if (isCurrentlyClockedOn()) {
      Alert.alert("Already Clocked On", "You are currently clocked on. Please clock off to start a new session.");
      return;
    }

    router.push("/time-entry?mode=clock_on");
  };

  const handleClockOff = () => {
    router.push(`/time-entry?mode=clock_off`);
  };

  const handleManualEntry = () => {
    router.push("/time-entry?mode=manual");
  };

  const handleSubmit = () => {
    router.push("/submit-timesheet");
  };

  const handleDayOff = () => {
    router.push("/day-off");
  };

  if (!userData) {
    return (
      <HStack space={4} justifyContent="center" mb={5}>
        <Spinner size="lg" color="emerald.500" />
      </HStack>
    );
  }

  return (
    <HStack space={3} justifyContent="space-around" mb={5}>
      {manualEntry ? (
        <>
          <Button
            bg="emerald.500"
            _pressed={{ bg: "emerald.700" }}
            shadow={2}
            borderRadius={8}
            py={3}
            px={6}
            onPress={handleManualEntry}
          >
            <Text color="white" fontWeight="600">Add Time</Text>
          </Button>

          {activeTimesheet?.tasks?.length ? (
            <Button
              bg="emerald.600"
              _pressed={{ bg: "emerald.800" }}
              shadow={2}
              borderRadius={8}
              py={3}
              px={6}
              onPress={handleSubmit}
              isDisabled={!!taskLoading || !!viewPastTimesheets}
            >
              <Text color="white" fontWeight="600">Submit</Text>
            </Button>
          ) : (
            <Button
              bg="emerald.600"
              _pressed={{ bg: "emerald.800" }}
              shadow={2}
              borderRadius={8}
              py={3}
              px={6}
              isDisabled={!!activeTask || !!viewPastTimesheets}
              onPress={handleDayOff}
            >
              <Text color="white" fontWeight="600">Day Off</Text>
            </Button>
          )}
        </>
      ) : (
        <>
          <Button
            bg="emerald.500"
            _pressed={{ bg: "emerald.700" }}
            shadow={2}
            borderRadius={8}
            py={3}
            px={6}
            isDisabled={!!activeTask || !!viewPastTimesheets}
            onPress={handleClockOn}
          >
            <Text color="white" fontWeight="500">Clock on</Text>
          </Button>

          <Button
            bg="emerald.500"
            _pressed={{ bg: "emerald.700" }}
            shadow={2}
            borderRadius={8}
            py={3}
            px={6}
            isDisabled={!activeTask || !!viewPastTimesheets}
            onPress={handleClockOff}
          >
            <Text color="white" fontWeight="500">Clock off</Text>
          </Button>

          {activeTimesheet?.tasks?.length ? (
            <Button
              bg="emerald.600"
              _pressed={{ bg: "emerald.800" }}
              shadow={2}
              borderRadius={8}
              py={3}
              px={6}
              onPress={handleSubmit}
              isDisabled={!!taskLoading || !!viewPastTimesheets}
            >
              <Text color="white" fontWeight="600">Submit</Text>
            </Button>
          ) : (
            <Button
              bg="emerald.600"
              _pressed={{ bg: "emerald.800" }}
              shadow={2}
              borderRadius={8}
              py={3}
              px={6}
              isDisabled={!!activeTask || !!viewPastTimesheets}
              onPress={handleDayOff}
            >
              <Text color="white" fontWeight="600">Day Off</Text>
            </Button>
          )}
        </>
      )}
    </HStack>
  );
}

export default ActionButtons;
