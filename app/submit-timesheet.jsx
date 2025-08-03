import NetInfo from '@react-native-community/netinfo';
import { addToQueue } from '@/utils/offlineQueue';

import React, { useContext, useState, useRef, useEffect } from "react";
import { useForm, Controller } from 'react-hook-form';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import axios from 'axios';
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
import { TaskContext } from "@/context/TaskContext";
import { SiteContext } from "@/context/SiteContext";
import { UserContext } from "@/context/UserContext";

const API_BASE_URL = "https://gore-api.futureaccess.com.au/TSAPI";

const SubmitTimesheetScreen = () => {
  const { activeTimesheet, clearActiveTimesheet } = useContext(TaskContext);
  const { logout, userData } = useContext(UserContext);
  const { submitQuestions, setSubmitQuestions, site, setTimesheetQuestionsInfo } = useContext(SiteContext);
  const { control, handleSubmit, setValue, formState: { errors } } = useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const cancelRef = useRef(null);

  // Fetch submit questions if they aren't loaded
  useEffect(() => {
    const loadQuestions = async () => {
      if (!site?.siteID || submitQuestions) return;

      try {
        const netState = await NetInfo.fetch();

        if (netState.isConnected) {
          await setTimesheetQuestionsInfo(site.siteID); // fetch + cache
        } else {
          const cached = await AsyncStorage.getItem('cachedSubmitQuestions');
          if (cached) {
            const parsed = JSON.parse(cached);
            setSubmitQuestions(parsed); // load from cache
          } else {
            console.warn("Offline and no cached questions found.");
            setSubmitQuestions([]); // <- THIS is important

          }
        }
      } catch (err) {
        console.error("Failed to load submit questions:", err);
      }
    };

    loadQuestions();
  }, [site?.siteID, submitQuestions]);









  /* new on submit with async storage */

  const onSubmit = async (data) => {
    setSubmitLoading(true);
    setSubmitError(null);

    const missed = submitQuestions
      ?.filter(q => q.mandatory && (!data.answers || !data.answers?.[q.sequenceNo]))
      .map(q => q.sequenceNo);

    if (missed && missed.length > 0) {
      setSubmitLoading(false);
      setSubmitError("Please answer all mandatory questions.");
      return;
    }

    const australiaTimeZone = 'Australia/Sydney';
    const now = new Date(); // UTC date
    const options = {
      timeZone: australiaTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };

    // Format the date using Intl.DateTimeFormat for MySQL-compatible format (YYYY-MM-DD HH:mm:ss)
    const formattedDate = new Intl.DateTimeFormat('en-GB', options).format(now);
    const [day, month, year, hour, minute, second] = formattedDate.split(/[\s,/:]+/);
    const mySQLFormattedDate = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    console.log(formattedDate); // e.g., '2025-07-16 13:45:00' (in AET)



    const timesheetData = {
      siteID: site.siteID,
      userID: userData.userID,
      forDate: activeTimesheet.forDate,
      submitTime: mySQLFormattedDate, //AU standard time, accounts for daylght savings  
      uploadTime: mySQLFormattedDate,
      dayOffReason: activeTimesheet.dayOffReason || null,
      comments: data.comments || "",
      tasks: activeTimesheet.tasks || []
    };

    const submitResponsesData = [];
    for (const sequenceNo in data.answers) {
      if (data.answers.hasOwnProperty(sequenceNo)) {
        const question = submitQuestions.find(q => q.sequenceNo.toString() === sequenceNo.toString());
        if (question) {
          submitResponsesData.push({
            sequenceNo: parseInt(sequenceNo),
            questionText: question.questionText,
            response: data.answers[sequenceNo]
          });
        }
      }
    }

    try {
      const netState = await NetInfo.fetch();

      if (!netState.isConnected) {
        console.log('Offline — saving timesheet submission locally.');
        await addToQueue({
          type: 'SUBMIT_TIMESHEET',
          payload: {
            timesheet: timesheetData,
            responses: submitResponsesData
          }
        });

        await clearActiveTimesheet();
        setSubmitLoading(false);
        setShowSuccessDialog(true);
        return;
      }

      // ONLINE — call the APIs
      await axios.post(`${API_BASE_URL}/upload`, timesheetData);
      if (submitResponsesData.length > 0) {
        await axios.post(`${API_BASE_URL}/timesheetquestionresponse`, {
          siteID: site.siteID,
          userID: userData.userID,
          forDate: activeTimesheet.forDate,
          responses: submitResponsesData
        });
      }

      await clearActiveTimesheet();
      setSubmitLoading(false);
      setShowSuccessDialog(true);

    } catch (apiError) {
      console.error('Error during submission:', apiError);
      setSubmitLoading(false);
      setSubmitError(apiError.message || "An unexpected error occurred during submission.");
    }
  };

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    logout();
    router.push("/login");
  };

  if (!submitQuestions) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg="coolGray.100">
        <Spinner size="lg" color="emerald.500" />
        <Text mt={2}>Loading submit questions...</Text>
      </Box>
    );
  }

  return (
    submitLoading ? (
      <Box flex={1} justifyContent="center" alignItems="center" bg="coolGray.100">
        <Spinner size="lg" color="emerald.500" />
      </Box>
    ) : (
      <>
        <ScrollView>
          <Box p={5} bg="coolGray.100" minHeight="100%">
            <VStack space={4} alignItems="center" width="100%">
              <Heading size="lg" color="coolGray.800" textAlign="center">
                Submit Timesheet
              </Heading>
              <Text fontSize="lg" fontWeight="medium" textAlign="center" mb={1}>
                Please complete the questions below and add any necessary comments before submitting.
              </Text>

              {submitError && (
                <Box width="100%" bg="red.100" p={3} rounded="md" alignItems="center" mb={4}>
                  <Text color="red.700" fontWeight="medium">
                    {submitError}
                  </Text>
                </Box>
              )}

              {submitQuestions.map((question, index) => (
                <FormControl
                  key={`question-${question.sequenceNo}-${index}`}
                  isInvalid={errors && errors[`answers.${question.sequenceNo}`]}
                  mb={0}
                >
                  {errors && errors[`answers.${question.sequenceNo}`] && (
                    <Box alignItems="center" justifyContent="center">
                      <Text fontSize="md" color="red.500">
                        * This question is mandatory. *
                      </Text>
                    </Box>
                  )}
                  <Box
                    bg="white"
                    rounded="xl"
                    shadow={2}
                    p={4}
                    borderWidth={errors && errors[`answers.${question.sequenceNo}`] ? 2 : 0}
                    borderColor="red.500"
                  >
                    <HStack alignItems="center">
                      <FormControl.Label flex={1} pr={3}>
                        <Text>{question.questionText}</Text>
                      </FormControl.Label>
                      <Controller
                        control={control}
                        name={`answers.${question.sequenceNo}`}
                        defaultValue={question.defaultValue || ""}
                        rules={{ required: question.mandatory }}
                        render={({ field: { onChange, value } }) => (
                          <Select
                            width="120px"
                            selectedValue={value}
                            placeholder="Select"
                            onValueChange={onChange}
                            _selectedItem={{
                              bg: "emerald.100",
                              endIcon: <CheckIcon size="5" />
                            }}
                          >
                            {(Array.isArray(question.responseCSV)
                              ? question.responseCSV
                              : question.responseCSV?.split(","))?.map((option, optIndex) => (
                                <Select.Item
                                  key={`option-${option.trim()}-${optIndex}`}
                                  label={option.trim()}
                                  value={option.trim()}
                                />
                              ))}
                          </Select>
                        )}
                      />
                    </HStack>
                  </Box>
                </FormControl>
              ))}

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
                      placeholder="Add any additional notes here..."
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
                  Today's timesheet has been submitted successfully!
                </Text>
              </VStack>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button
                colorScheme="emerald"
                onPress={handleCloseSuccessDialog}
                size="md"
                width="100%"
              >
                Exit
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog>
      </>
    )
  );
};

export default SubmitTimesheetScreen;



