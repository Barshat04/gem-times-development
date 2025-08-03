import React, { useState, useContext, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { router } from "expo-router";
import {
  Box,
  Text,
  TextArea,
  Button,
  ScrollView,
  VStack,
  HStack,
  FormControl,
  Select,
  CheckIcon,
  Heading,
  Spinner,
  AlertDialog
} from "native-base";
import { UserContext } from "@/context/UserContext";
import { TaskContext } from "@/context/TaskContext";
import { SiteContext } from "@/context/SiteContext";
import axios from "axios";

const API_BASE_URL = "https://gore-api.futureaccess.com.au/TSAPI"; // Make sure this is the correct API URL

const DayOffScreen = () => {
  const { userData, logout } = useContext(UserContext);
  const { activeTimesheet, saveTimesheet } = useContext(TaskContext);
  const { site } = useContext(SiteContext);
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      dayOffReason: "",
      comments: ""
    }
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const cancelRef = useRef(null);

  const onSubmit = async (data) => {
    setSubmitLoading(true);

    if (!data.dayOffReason) {
      setSubmitLoading(false);
      return;
    }

    // Construct the timesheet data to be sent to the API
    const timesheetData = {
      siteID: site.siteID,
      userID: userData.userID,
      forDate: new Date().toISOString(), // Assuming you have a `forDate` for the timesheet
      submitTime: new Date().toISOString(),
      uploadTime: new Date().toISOString(),
      dayOffReason: data.dayOffReason,
      comments: data.comments || "",
      tasks: []  //[passing empty array for day off]
    };

    try {
      // Send the data to the backend API to upload the timesheet and day off info
      const response = await axios.post(`${API_BASE_URL}/upload`, timesheetData);
      console.log('Timesheet uploaded successfully:', response.data);

      // Handle success
      setSubmitLoading(false);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Error uploading timesheet:', error.response?.data || error.message);

      // Handle failure
      setSubmitLoading(false);
      setSubmitError("Failed to save timesheet!");
    }
  };

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    logout();
    router.push("/login");
  };

  return (
    <>
      <ScrollView>
        <Box p={5} bg="coolGray.100" minHeight="100%">
          <VStack space={4} alignItems="center" width="100%">
            <Heading size="lg" color="coolGray.800" textAlign="center">
              Submit Day Off Request
            </Heading>

            {submitLoading ? (
              <Spinner size="sm" color="emerald.500" />
            ) : (
              <>
                <Text fontSize="lg" fontWeight="medium" textAlign="center" mb={1}>
                  If you are taking a day off, please complete the details below.
                </Text>

                {submitError && (
                  <Box
                    width="100%"
                    bg="red.100"
                    p={3}
                    rounded="md"
                    alignItems="center"
                    mb={4}
                  >
                    <Text color="red.700" fontWeight="medium">
                      {submitError}
                    </Text>
                  </Box>
                )}

                <Box
                  bg="white"
                  rounded="xl"
                  shadow={2}
                  p={4}
                  width="100%"
                >
                  <HStack space={2} alignItems="center">
                    <Text fontWeight="medium" color="coolGray.700">
                      Date:
                    </Text>
                    <Text>
                      {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Text>
                  </HStack>
                </Box>

                <FormControl
                  isInvalid={errors && errors.dayOffReason}
                  mb={0}
                  width="100%"
                >
                  {errors && errors.dayOffReason && (
                    <Box alignItems="center" justifyContent="center">
                      <Text fontSize="md" color="red.500">
                        * Reason for day off is required. *
                      </Text>
                    </Box>
                  )}
                  <Box
                    bg="white"
                    rounded="xl"
                    shadow={2}
                    p={4}
                    borderWidth={errors && errors.dayOffReason ? 2 : 0}
                    borderColor="red.500"
                    width="100%"
                  >
                    <HStack alignItems="center" justifyContent="space-between">
                      <FormControl.Label flex={1} pr={3}>
                        <Text>
                          Reason for Day Off:
                        </Text>
                      </FormControl.Label>

                      <Controller
                        control={control}
                        name="dayOffReason"
                        rules={{ required: true }}
                        render={({ field: { onChange, value } }) => (
                          <Select
                            width="180px"
                            selectedValue={value}
                            placeholder="Select reason"
                            onValueChange={onChange}
                            _selectedItem={{
                              bg: "emerald.100",
                              endIcon: <CheckIcon size="5" />
                            }}
                          >
                            {site?.dayOffReasonsCSV?.split(",").map((reason, index) => (
                              <Select.Item
                                key={`reason-${reason.trim()}-${index}`}
                                label={reason.trim()}
                                value={reason.trim()}
                              />
                            ))}
                          </Select>
                        )}
                      />
                    </HStack>
                  </Box>
                </FormControl>

                <Box bg="white" rounded="xl" shadow={2} p={4} width="100%">
                  <Heading size="sm" color="coolGray.700" mb={4}>
                    Comments
                  </Heading>
                  <Controller
                    control={control}
                    name="comments"
                    defaultValue=""
                    render={({ field: { onChange, value } }) => (
                      <TextArea
                        value={value}
                        onChangeText={onChange}
                        placeholder="Add any additional details here..."
                        h={100}
                        autoCompleteType={undefined}
                        _focus={{
                          borderColor: "emerald.500",
                          bg: "white"
                        }}
                      />
                    )}
                  />
                </Box>

                <HStack justifyContent="center" space={4} width="100%">
                  <Button
                    variant="outline"
                    colorScheme="coolGray"
                    onPress={() => router.push("/mainscreen")}
                    flex={1}
                    size="lg"
                    rounded="lg"
                    mt={4}
                  >
                    Cancel
                  </Button>
                  <Button
                    onPress={handleSubmit(onSubmit)}
                    flex={1}
                    size="lg"
                    rounded="lg"
                    bg="emerald.500"
                    _pressed={{ bg: "emerald.600" }}
                    mt={4}
                  >
                    Submit
                  </Button>
                </HStack>
              </>
            )}
          </VStack>
        </Box>
      </ScrollView>

      <AlertDialog
        leastDestructiveRef={cancelRef}
        isOpen={showSuccessDialog}
        onClose={handleCloseSuccessDialog}
      >
        <AlertDialog.Content>
          <AlertDialog.Body>
            <VStack space={3} py={2}>
              <Text fontSize="md" textAlign="center">
                Day off request has been submitted successfully!
              </Text>
              <Text textAlign="center" fontSize="sm">
                You will be logged out.
              </Text>
            </VStack>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" colorScheme="coolGray" ref={cancelRef} onPress={handleCloseSuccessDialog}>
                Close
              </Button>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </>
  );
};

export default DayOffScreen;
