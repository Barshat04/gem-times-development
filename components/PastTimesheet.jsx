import React, { useState, useContext, useEffect } from "react";
import {
  Box,
  Text,
  FlatList,
  HStack,
  VStack,
  Center,
  IconButton,
  Spinner,
  Button,
  Divider,
} from "native-base";
import { BackHandler } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import timeUtils from "@/utils/timeUtils";
import { TaskContext } from "@/context/TaskContext";
import { UserContext } from "@/context/UserContext";
import { SiteContext } from "@/context/SiteContext";

const PastTimesheet = () => {
  const { userData } = useContext(UserContext);
  const navigation = useNavigation();
  const { site } = useContext(SiteContext);
  const { pastTimesheets, pastTasks, pastSubmitQuestions } = useContext(TaskContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timesheetDates, setTimesheetDates] = useState([]);
  const [displayTasks, setDisplayTasks] = useState([]);
  const [currentTimesheet, setCurrentTimesheet] = useState(null);
  const [currentQuestions, setCurrentQuestions] = useState([]);

  const formatTimeForDisplay = (timeStr) => {
    if (!timeStr) {
      return "--";
    }

    if (timeStr.includes(':')) {
      return timeStr;
    }

    const paddedTime = timeStr.padStart(4, '0');

    return `${paddedTime.substring(0, 2)}:${paddedTime.substring(2, 4)}`;
  };

  // Format submit time to show only the time portion
  const formatSubmitTime = (submitTimeStr) => {
    if (!submitTimeStr) return "--";

    // If it includes a space (date and time format)
    if (submitTimeStr.includes(' ')) {
      const parts = submitTimeStr.split(' ');
      if (parts.length === 2) {
        return parts[1]; // Return just the time portion
      }
    }

    return submitTimeStr;
  };

  useEffect(() => {
    if (pastTimesheets && pastTimesheets.length > 0) {
      const sortedTimesheets = [...pastTimesheets].sort((a, b) =>
        new Date(b.forDate) - new Date(a.forDate)
      );

      setTimesheetDates(sortedTimesheets);
      const latest = sortedTimesheets[0];
      setCurrentTimesheet(latest);
      loadTasksForTimesheet(latest);
      loadQuestionsForTimesheet(latest);
    }
  }, [pastTimesheets, pastTasks, pastSubmitQuestions]);

  const loadTasksForTimesheet = (timesheet) => {
    if (!timesheet || !pastTasks || pastTasks.length === 0) return;

    const date = timesheet.forDate;

    // Only filter by date since the API only returns tasks for the current user
    const tasksForDate = pastTasks.filter(task => task.forDate === date);
    const sortedTasks = [...tasksForDate].sort((a, b) => {
      const timeA = parseInt(a.startTime);
      const timeB = parseInt(b.startTime);
      return timeA - timeB;
    });
    setDisplayTasks(sortedTasks);
  };

  const loadQuestionsForTimesheet = (timesheet) => {
    if (!timesheet || !pastSubmitQuestions || pastSubmitQuestions.length === 0) {
      return;
    }

    const date = timesheet.forDate;
    const questionsForDate = pastSubmitQuestions.filter(q => q.forDate === date);
    setCurrentQuestions(questionsForDate);
  };

  const navigateToPrevious = () => {
    if (currentIndex < timesheetDates.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      const selectedTimesheet = timesheetDates[newIndex];
      setCurrentTimesheet(selectedTimesheet);
      loadTasksForTimesheet(selectedTimesheet);
      loadQuestionsForTimesheet(selectedTimesheet);
    }
  };

  const navigateToNext = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      const selectedTimesheet = timesheetDates[newIndex];
      setCurrentTimesheet(selectedTimesheet);
      loadTasksForTimesheet(selectedTimesheet);
      loadQuestionsForTimesheet(selectedTimesheet);
    }
  };

  const getJobDisplay = (task) => {
    if (task.timeFor === "Job") {
      return task.jobNo || "--";
    } else {
      return task.timeFor || "--";
    }
  };
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        console.log("Back button pressed! Navigating to mainscreen.");
        // Navigate to main screen instead of exiting the app
        // Replace 'Main' with your actual route name if different
        navigation.navigate("mainscreen");
        return true; // prevent default behavior (app exit)
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () => {
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
      };
    }, [])
  );


  const renderContent = () => {
    if (!timesheetDates || timesheetDates.length === 0) {
      return (
        <Center h="250" bg="coolGray.100" rounded="md">
          <Text fontSize="md" color="coolGray.600">No past timesheets available</Text>
        </Center>
      );
    }

    return (
      <Box>
        <HStack
          bg="coolGray.200"
          p={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Button
            leftIcon={<MaterialIcons name="arrow-back" size={24} color="gray" />}
            onPress={navigateToPrevious}
            isDisabled={currentIndex >= timesheetDates.length - 1}
            variant="outline"
            borderWidth={1}
            borderColor="coolGray.300"
            borderRadius="md"
            bg="white"
            shadow={1}
            _disabled={{
              borderColor: "coolGray.300",
              bg: "white",
              opacity: 1
            }}
            _pressed={{ bg: "coolGray.200" }}
          />

          <VStack alignItems="center">
            <Text color="coolGray.700" fontWeight="medium">
              {currentTimesheet ? currentTimesheet.forDate : ""}
            </Text>
            {currentTimesheet?.submitTime && (
              <Text color="coolGray.500" fontSize="xs">
                Submitted: {formatSubmitTime(currentTimesheet.submitTime)}
              </Text>
            )}
          </VStack>

          <Button
            rightIcon={<MaterialIcons name="arrow-forward" size={24} color="gray" />}
            onPress={navigateToNext}
            isDisabled={currentIndex <= 0}
            variant="outline"
            borderWidth={1}
            borderColor="coolGray.300"
            borderRadius="md"
            bg="white"
            shadow={1}
            _disabled={{
              borderColor: "coolGray.300",
              bg: "white",
              opacity: 1
            }}
            _pressed={{ bg: "coolGray.200" }}
          />
        </HStack>

        <HStack
          bg="coolGray.200"
          py={2}
          px={2}
        >
          <Text flex={1} color="coolGray.700" fontWeight="bold" textAlign="center">Start</Text>
          <Text flex={1} color="coolGray.700" fontWeight="bold" textAlign="center">Finish</Text>
          <Text flex={1} color="coolGray.700" fontWeight="bold" textAlign="center">Time</Text>
          <Text flex={1} color="coolGray.700" fontWeight="bold" textAlign="center">Job</Text>
        </HStack>

        {currentTimesheet && currentTimesheet.dayOffReason ? (
          <Center py={4} bg="white">
            <Text fontSize="md" color="coolGray.600">Day Off - {currentTimesheet.dayOffReason}</Text>
            {currentTimesheet.comments && (
              <Text fontSize="sm" color="coolGray.500" mt={1}>{currentTimesheet.comments}</Text>
            )}
          </Center>
        ) : (
          !displayTasks || displayTasks.length === 0 ? (
            <Center py={3} bg="white">
              <Text>No tasks for this day</Text>
            </Center>
          ) : (
            <FlatList
              data={displayTasks}
              keyExtractor={(item, index) => `past-task-${index}`}
              renderItem={({ item }) => (
                <HStack
                  bg="white"
                  px={2}
                  py={2}
                  borderBottomWidth={1}
                  borderBottomColor="coolGray.200"
                >
                  <Text flex={1} textAlign="center">{formatTimeForDisplay(item.startTime)}</Text>
                  <Text flex={1} textAlign="center">{formatTimeForDisplay(item.finishTime)}</Text>
                  <Text flex={1} textAlign="center">
                    {timeUtils.calculateTimeDifference(
                      formatTimeForDisplay(item.startTime),
                      formatTimeForDisplay(item.finishTime)
                    ) || "--"}
                  </Text>
                  <Text flex={1} textAlign="center">{getJobDisplay(item)}</Text>
                </HStack>
              )}
              maxH={150}
            />
          )
        )}

        {/* Comments section - only show if there are comments and not a day off */}
        {currentTimesheet?.comments && !currentTimesheet.dayOffReason && (
          <Box bg="white" p={2} borderTopWidth={1} borderTopColor="coolGray.200">
            <Text fontSize="xs" color="coolGray.700" fontWeight="bold" >Comments:</Text>
            <Text fontSize="sm" color="coolGray.700">{currentTimesheet.comments}</Text>
          </Box>
        )}

        {/* Questions section - only show if there are questions */}
        {currentQuestions && currentQuestions.length > 0 && (
          <Box bg="white" p={2} borderTopWidth={1} borderTopColor="coolGray.200">
            <Text fontSize="xs" color="coolGray.700" fontWeight="bold" mb={1}>Submission Questions:</Text>
            {currentQuestions.map((question, index) => (
              <HStack key={`q-${index}`} space={2} mb={1}>
                <Text fontSize="sm" color="coolGray.600">{question.questionText}:</Text>
                <Text fontSize="sm" color="coolGray.700" fontWeight="bold">{question.responseText}</Text>
              </HStack>
            ))}
          </Box>
        )}

        <HStack
          bg="coolGray.200"
          py={2}
          borderTopWidth={1}
          borderTopColor="coolGray.300"
        >
          <Text flex={2} fontWeight="bold" textAlign="center">Total Time</Text>
          <Text flex={3} textAlign="center">
            {!currentTimesheet?.dayOffReason && displayTasks && displayTasks.length > 0 ?
              timeUtils.calculateTimeDifference(
                formatTimeForDisplay(displayTasks[0].startTime),
                formatTimeForDisplay(displayTasks[displayTasks.length - 1].finishTime)
              ) || "--" :
              "--"
            }
          </Text>
        </HStack>
      </Box>
    );
  };

  return (
    <Box
      borderWidth={3}
      borderColor="coolGray.400"
      borderRadius="md"
      overflow="hidden"
    >
      <Box bg="coolGray.500" p={3}>
        <Text color="white" textAlign="center">Past Timesheet</Text>
      </Box>
      {renderContent()}
    </Box>
  );
};

export default PastTimesheet;