/*
  * Action buttons
  * Checks if a user is of type clock on/off or manual entry.
  * handleClokcON() opens time-entry screen in "clock on" mode.
  * handleClockOff() opens time-entry screen in "clock off" mode.
  * handleManualEntry() opens time-entry screen in "manual" mode.
  * handleSubmit will route a user to either "submit timesheet" or "day off" depending on the no of current tasks.
*/

import React, { useEffect, useState, useContext } from "react";
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
  const { activeTimesheet, activeTask, taskLoading, viewPastTimesheets } = useContext(TaskContext);
  const [manualEntry, setManualEntry] = useState(false);

  // Whenever we get userData from the UserContext, set the timesheet type (clock or manual mode).
  useEffect(() => {
    if (userData?.timeEntryType === "M") {
      setManualEntry(true);
    } else {
      setManualEntry(false);
    }
  }, [userData]);

  // Open the time-entry screen in "clock-on" mode.
  const handleClockOn = () => {
    router.push("/time-entry?mode=clock_on");
  };

  // Open the time-entry screen in "clock off" mode.
  const handleClockOff = () => {
    router.push(`/time-entry?mode=clock_off`);
  };

  // Open the time-entry screen in "manual" mode.
  const handleManualEntry = () => {
    router.push("/time-entry?mode=manual");
  };

  // Go to submit timesheet.
  const handleSubmit = () => {
    router.push("/submit-timesheet");
  };

  // Go to day off.
  const handleDayOff = () => {
    router.push("/day-off");
  }

  // Spinner if userData still loading.
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
            <Text color="white" fontWeight="600">
              Add Time
            </Text>
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
              <Text color="white" fontWeight="600">
                Submit
              </Text>
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
              <Text color="white" fontWeight="600">
                Day Off
              </Text>
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
            <Text color="white" fontWeight="500">
              Clock on
            </Text>
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
            <Text color="white" fontWeight="500">
              Clock off
            </Text>
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
              <Text color="white" fontWeight="600">
                Submit
              </Text>
            </Button>
          ): (
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
              <Text color="white" fontWeight="600">
                Day Off
              </Text>
            </Button>
          )}
        </>
      )}
    </HStack>
  );
}

export default ActionButtons;