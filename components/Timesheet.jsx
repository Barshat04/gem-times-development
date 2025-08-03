import React, { useContext } from "react";
import {
  Box,
  Text,
  FlatList,
  HStack,
  Center,
  Badge
} from "native-base";
import timeUtils from "@/utils/timeUtils";
import { TaskContext } from "@/context/TaskContext";

const TimeSheet = () => {
  const { activeTimesheet, activeTask } = useContext(TaskContext);
  
  let displayTasks = [...(activeTimesheet?.tasks || [])];

  if (activeTask && !activeTimesheet?.tasks.find(task => 
    task.startTime === activeTask.startTime && 
    task.timeFor === activeTask.timeFor &&
    task.jobNo === activeTask.jobNo)) {
    displayTasks.push(activeTask);
  }
  
  displayTasks = displayTasks.reverse();

  return (
    <Box bg="white" rounded="md">
      <HStack 
        bg="emerald.500"
        py={2}
        px={2}
      >
        <Text flex={1} color="white" fontWeight="bold" textAlign="center">Start</Text>
        <Text flex={1} color="white" fontWeight="bold" textAlign="center">Finish</Text>
        <Text flex={1} color="white" fontWeight="bold" textAlign="center">Time</Text>
        <Text flex={1} color="white" fontWeight="bold" textAlign="center">Job</Text>
        {activeTask && (
          <Text flex={1} color="white" fontWeight="bold" textAlign="center">Status</Text>
        )}
      </HStack>

      {!displayTasks || displayTasks.length === 0 ? (
        <Center py={3}>
          <Text>No tasks here...</Text>
        </Center>
      ) : (
        <FlatList
          data={displayTasks}
          keyExtractor={(item, index) => `task-${index}`}
          renderItem={({ item }) => {
            const isActiveTask = activeTask && item.startTime === activeTask.startTime && 
                                 item.timeFor === activeTask.timeFor && 
                                 item.jobNo === activeTask.jobNo && 
                                 item.finishTime === null;
            return (
              <HStack 
                bg={isActiveTask ? "emerald.50" : "white"}
                px={2}
                py={2}
                borderBottomWidth={1}
                borderBottomColor="gray.200"
              >
                <Text flex={1} textAlign="center">{item.startTime}</Text>
                <Text flex={1} textAlign="center">{item.finishTime || "--"}</Text>
                <Text flex={1} textAlign="center">
                  {timeUtils.calculateTimeDifference(
                    item.startTime,
                    item.finishTime
                  ) || "--"}
                </Text>
                <Text flex={1} textAlign="center">{item.jobNo || "--"}</Text>
                {activeTask && isActiveTask && (
                  <Box flex={1} alignItems="center" justifyContent="center">
                    <Badge bg="emerald.500" rounded="md">
                      <Text color="white" fontSize="xs">Active</Text>
                    </Badge>
                  </Box>
                )}
                {activeTask && !isActiveTask && (
                  <Box flex={1} alignItems="center" justifyContent="center">
                  <Badge bg="gray.500" rounded="md">
                    <Text color="white" fontSize="xs">Closed</Text>
                  </Badge>
                </Box>
                )}
              </HStack>
            );
          }}
          maxH={250}
        />
      )}

      <HStack 
        bg="gray.100" 
        py={2}
        borderTopWidth={1}
        borderTopColor="gray.300"
      >
        <Text flex={2} fontWeight="bold" textAlign="center">Total Time</Text>
        <Text flex={3} textAlign="center">
        {activeTimesheet?.tasks && activeTimesheet.tasks.length > 0 ? 
          timeUtils.calculateTimeDifference(
            activeTimesheet.tasks[0].startTime,
            activeTimesheet.tasks[activeTimesheet.tasks.length - 1].finishTime
          ) || "--" : 
          "--"
        }
        </Text>
      </HStack>
    </Box>
  );
};

export default TimeSheet;