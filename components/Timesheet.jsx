import React, { useContext, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView, // Import ScrollView from react-native
} from "react-native";
import {
  Box,
  Text,
  FlatList,
  HStack,
  Center,
  Badge,
  Modal,
  Button,
  VStack,
  Input,
  FormControl
} from "native-base";
import timeUtils from "@/utils/timeUtils";
import { TaskContext } from "@/context/TaskContext";

const TimeSheet = () => {
  const { activeTimesheet, activeTask, updateTimesheetTask, storeActiveTask } = useContext(TaskContext);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editedFields, setEditedFields] = useState({});

  let displayTasks = [...(activeTimesheet?.tasks || [])];

  if (
    activeTask &&
    !activeTimesheet?.tasks.find(
      (task) =>
        task.startTime === activeTask.startTime &&
        task.timeFor === activeTask.timeFor &&
        task.jobNo === activeTask.jobNo
    )
  ) {
    displayTasks.push(activeTask);
  }

  displayTasks = displayTasks.reverse();

  const handleRowPress = (task) => {
    // Only allow editing for tasks that are not clocked off and are not the current active task.
    if (task.finishTime === null) {
      setSelectedTask(task);
      setEditedFields({
        jobNo: task.jobNo || "",
        referenceNo1: task.referenceNo1 || "",
        referenceNo2: task.referenceNo2 || "",
        referenceNo3: task.referenceNo3 || "",
        workDone: task.workDone || "",
      });
      setEditModalVisible(true);
    }
  };

  const handleSave = async () => {
    if (!selectedTask) return;

    const updatedTask = {
      ...selectedTask,
      jobNo: editedFields.jobNo?.trim() || "",
      referenceNo1: editedFields.referenceNo1?.trim() || "",
      referenceNo2: editedFields.referenceNo2?.trim() || "",
      referenceNo3: editedFields.referenceNo3?.trim() || "",
      workDone: editedFields.workDone?.trim() || "",
      originalJobNo: selectedTask.jobNo || "",
    };

    try {
      await updateTimesheetTask(updatedTask);

      if (
        activeTask &&
        activeTask.startTime === selectedTask.startTime &&
        activeTask.jobNo === selectedTask.jobNo
      ) {
        await storeActiveTask(updatedTask);
      }

      setEditModalVisible(false);
    } catch (err) {
      console.error("Failed to save task edits:", err);
    }
  };

  return (
    <Box bg="white" rounded="md">
      <HStack bg="emerald.500" py={2} px={2}>
        <Text flex={1} color="white" fontWeight="bold" textAlign="center">
          Start
        </Text>
        <Text flex={1} color="white" fontWeight="bold" textAlign="center">
          Finish
        </Text>
        <Text flex={1} color="white" fontWeight="bold" textAlign="center">
          Time
        </Text>
        <Text flex={1} color="white" fontWeight="bold" textAlign="center">
          Job
        </Text>
        {activeTask && (
          <Text flex={1} color="white" fontWeight="bold" textAlign="center">
            Status
          </Text>
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
            const isActiveTask =
              activeTask &&
              item.startTime === activeTask.startTime &&
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
                onTouchEnd={() => handleRowPress(item)}
              >
                <Text flex={1} textAlign="center">{item.startTime}</Text>
                <Text flex={1} textAlign="center">{item.finishTime || "--"}</Text>
                <Text flex={1} textAlign="center">
                  {timeUtils.calculateTimeDifference(item.startTime, item.finishTime) || "--"}
                </Text>
                <Text flex={1} textAlign="center">{item.jobNo || "--"}</Text>
                {activeTask && isActiveTask && (
                  <Box flex={1} alignItems="center" justifyContent="center">
                    <Badge bg="emerald.500" rounded="md">
                      <Text color="white" fontSize="xs">
                        Active
                      </Text>
                    </Badge>
                  </Box>
                )}
                {activeTask && !isActiveTask && (
                  <Box flex={1} alignItems="center" justifyContent="center">
                    <Badge bg="gray.500" rounded="md">
                      <Text color="white" fontSize="xs">
                        Closed
                      </Text>
                    </Badge>
                  </Box>
                )}
              </HStack>
            );
          }}
          maxH={250}
        />
      )}

      <HStack bg="gray.100" py={2} borderTopWidth={1} borderTopColor="gray.300">
        <Text flex={2} fontWeight="bold" textAlign="center">
          Total Time
        </Text>
        <Text flex={3} textAlign="center">
          {activeTimesheet?.tasks && activeTimesheet.tasks.length > 0
            ? timeUtils.calculateTimeDifference(
              activeTimesheet.tasks[0].startTime,
              activeTimesheet.tasks[activeTimesheet.tasks.length - 1].finishTime
            ) || "--"
            : "--"}
        </Text>
      </HStack>

      <Modal isOpen={editModalVisible} onClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: '100%' }}>
          {/* Changed maxWidth to a wider percentage. You can also remove it. */}
          <Modal.Content>
            <Modal.CloseButton />
            <Modal.Header>Edit Task</Modal.Header>
            <Modal.Body>
              {/* Ensure ScrollView is here to handle content overflow */}
              <ScrollView>
                <VStack space={3}>
                  <FormControl>
                    <FormControl.Label>Job No.</FormControl.Label>
                    <Input
                      value={editedFields.jobNo}
                      onChangeText={(text) => setEditedFields((prev) => ({ ...prev, jobNo: text }))}
                    />
                  </FormControl>
                  <FormControl>
                    <FormControl.Label>Reference No. 1</FormControl.Label>
                    <Input
                      value={editedFields.referenceNo1}
                      onChangeText={(text) => setEditedFields((prev) => ({ ...prev, referenceNo1: text }))}
                    />
                  </FormControl>
                  <FormControl>
                    <FormControl.Label>Reference No. 2</FormControl.Label>
                    <Input
                      value={editedFields.referenceNo2}
                      onChangeText={(text) => setEditedFields((prev) => ({ ...prev, referenceNo2: text }))}
                    />
                  </FormControl>
                  <FormControl>
                    <FormControl.Label>Reference No. 3</FormControl.Label>
                    <Input
                      value={editedFields.referenceNo3}
                      onChangeText={(text) => setEditedFields((prev) => ({ ...prev, referenceNo3: text }))}
                    />
                  </FormControl>
                  <FormControl>
                    <FormControl.Label>Comments / Work Done</FormControl.Label>
                    <Input
                      value={editedFields.workDone}
                      onChangeText={(text) => setEditedFields((prev) => ({ ...prev, workDone: text }))}
                      // Use multiline and a taller height for comments
                      multiline
                      height={100}
                      textAlignVertical="top" // Ensures text starts at the top
                    />
                  </FormControl>
                </VStack>
              </ScrollView>
            </Modal.Body>
            <Modal.Footer>
              <Button.Group space={2}>
                <Button onPress={() => setEditModalVisible(false)} variant="ghost">
                  Cancel
                </Button>
                <Button onPress={handleSave}>Save</Button>
              </Button.Group>
            </Modal.Footer>
          </Modal.Content>
        </KeyboardAvoidingView>
      </Modal>
    </Box>
  );
};

export default TimeSheet;