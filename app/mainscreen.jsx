import React, { useContext, useEffect } from "react";
import {
  BackHandler,
  Platform,
} from "react-native";
import {
  Box,
  Text,
  VStack,
} from "native-base";
import TimeSheet from "@/components/Timesheet";
import PastTimesheet from "@/components/PastTimesheet";
import HomeDateTime from "@/components/HomeDateTime";
import DropdownMenu from "@/components/DropdownMenu";
import ActionButtons from "@/components/ActionButtons";
import { UserContext } from "@/context/UserContext";
import { TaskContext } from "@/context/TaskContext";

const MainScreen = () => {
  const { userData } = useContext(UserContext);
  const { viewPastTimesheets } = useContext(TaskContext);

  // 🔒 Disable Android back button
  useEffect(() => {
    if (Platform.OS === "android") {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => true // Returning true disables default back behavior
      );

      return () => backHandler.remove(); // Cleanup on unmount
    }
  }, []);

  return (
    <Box
      flex={1}
      p={5}
      bg={viewPastTimesheets ? "coolGray.200" : "coolGray.50"}
      safeArea
    >
      <Box position="absolute" top={3} right={3} zIndex={10}>
        <DropdownMenu />
      </Box>

      <VStack space={4} mt={10}>
        <Text
          fontSize="xl"
          fontWeight="medium"
          textAlign="center"
          color="coolGray.800"
        >
          {userData?.siteName}
        </Text>
        <HomeDateTime />
        <ActionButtons />
        <Box
          bg="white"
          borderRadius="md"
          shadow={1}
          overflow="hidden"
        >
          {!viewPastTimesheets ? (
            <TimeSheet />
          ) : (
            <PastTimesheet />
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default MainScreen;
