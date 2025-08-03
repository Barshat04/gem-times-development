import React, { useEffect, useState, useContext } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo'; // To check for network connectivity
import {
  Box, VStack, HStack, Image, Text, ScrollView, Button,
  FormControl, Select, CheckIcon, Spinner, Icon
} from 'native-base';
import { MaterialIcons } from "@expo/vector-icons";
import { UserContext } from "@/context/UserContext";
import { SiteContext } from "@/context/SiteContext";
import { TaskContext } from "@/context/TaskContext";
import { syncQueue } from "@/utils/syncManager"; // Import utils
import { addToQueue } from "@/utils/offlineQueue"; // Import utils

export default function DayStartScreen() {
  const { userData } = useContext(UserContext);
  const { site } = useContext(SiteContext);
  const { createTimesheet, submitDayStartResponses } = useContext(TaskContext);
  const { control, handleSubmit, formState: { errors } } = useForm();

  const [siteQuestions, setSiteQuestions] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const baseUrl = "https://gore-api.futureaccess.com.au/TSAPI";

  // Fetch past responses
  const fetchPastDayStartResponses = async (userID) => {
    try {
      const res = await axios.get(`${baseUrl}/download/daystartresponses/${userID}`);
      return res.data || [];
    } catch (error) {
      console.error("Error fetching day start responses:", error);
      return [];
    }
  };

  // Fetch questions
  const fetchDayStartQuestions = async (siteID) => {
    try {
      const res = await axios.get(`${baseUrl}/daystartquestions/${siteID}`);
      if (res.data) {
        // Store questions in AsyncStorage
        await AsyncStorage.setItem(`siteQuestions-${siteID}`, JSON.stringify(res.data));
        setSiteQuestions(res.data);
        console.log("Questions loaded:", res.data);
      }
    } catch (error) {
      console.error("Error fetching site questions:", error);
      // Fetch from AsyncStorage if no network
      const cachedQuestions = await AsyncStorage.getItem(`siteQuestions-${siteID}`);
      if (cachedQuestions) {
        setSiteQuestions(JSON.parse(cachedQuestions));
      } else {
        setSiteQuestions([]);
      }
    }
  };

  // Submit form data
  const onSubmit = async (formData) => {
    setSubmitLoading(true);

    const missed = siteQuestions
      .filter(q => q.mandatory && !formData[q.sequenceNo])
      .map(q => q.sequenceNo);

    if (missed.length > 0) {
      setSubmitLoading(false);
      setSubmitError("Please answer all mandatory questions.");
      return;
    }

    const responseList = siteQuestions.map(q => ({
      sequenceNo: q.sequenceNo,
      questionText: q.questionText,
      response: formData[q.sequenceNo] || ""
    }));

    const payload = {
      siteID: site?.siteID,
      userID: userData?.userID,
      forDate: new Date().toISOString().slice(0, 10),
      responses: responseList
    };

    // Check if the device is online or offline
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      // If offline, add to offlineQueue and proceed to the main screen
      await addToQueue({
        type: "SUBMIT_DAYSTART_RESPONSES",
        payload,
      });

      setSubmitLoading(false); // Stop loading spinner
      router.push("/mainscreen"); // Navigate to the main screen
      return;
    }

    // If online, try submitting to the backend
    try {
      const result = await submitDayStartResponses(payload);

      if (!result) {
        setSubmitError("Failed to submit day start responses.");
        setSubmitLoading(false);
        return;
      }

      setSubmitLoading(false);
      router.push("/mainscreen"); // Navigate to the main screen
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitError("Unexpected error during submission.");
      setSubmitLoading(false);
    }
  };


  useEffect(() => {
    const initDayStart = async () => {
      try {
        if (!userData?.userID || !site?.siteID) return;
        setSitesLoading(true);

        const responses = await fetchPastDayStartResponses(userData.userID);
        const today = new Date().toISOString().slice(0, 10);

        const alreadySubmitted = responses.some(res =>
          res.userID === userData.userID &&
          res.siteID === site.siteID &&
          res.forDate === today
        );

        if (alreadySubmitted) {
          console.log("Already submitted, skipping to main screen.");
          await createTimesheet(userData.userID, site.siteID);
          router.replace("/mainscreen");
          return;
        }

        await fetchDayStartQuestions(site.siteID);  // This will handle both fetching from network and from AsyncStorage
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setSitesLoading(false);
      }
    };

    initDayStart();
  }, [userData, site]);

  // Sync offline queue when back online
  useEffect(() => {
    const checkAndSyncQueue = async () => {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        console.log("Device is online, syncing offline queue.");
        await syncQueue();  // Sync queued actions if online
      }
    };

    checkAndSyncQueue();
  }, []);  // Run once on component mount to check for any offline actions

  return (
    sitesLoading ? (
      <Box flex={1} justifyContent="center" alignItems="center" bg="coolGray.100">
        <Spinner size="lg" color="emerald.500" />
      </Box>
    ) : (
      <ScrollView>
        <Box p={5} bg="coolGray.100" minHeight="100%">
          <VStack space={4} alignItems="center" width="100%">
            <Image
              source={require('../assets/images/safety.png')}
              alt="Safety Logo"
              size="xl"
              resizeMode="contain"
            />

            <Text fontSize="lg" fontWeight="medium" textAlign="center" mb={1}>
              Please answer the following questions before starting your day.
            </Text>

            {submitLoading && <Spinner size="sm" color="emerald.500" />}
            {submitError && (
              <HStack space={2} alignItems="center" bg="red.100" p={2} borderRadius="md" mb={2} w="100%">
                <Icon as={MaterialIcons} name="error-outline" color="red.600" size="sm" />
                <Text color="red.600" fontSize="sm">{submitError}</Text>
              </HStack>
            )}

            {Array.isArray(siteQuestions) && siteQuestions.map(question => {
              return (
                <FormControl
                  key={question.sequenceNo}
                  isInvalid={errors && errors[`${question.sequenceNo}`]}
                  mb={0}
                >
                  {errors && errors[`${question.sequenceNo}`] && (
                    <Box alignItems="center" justifyContent="center">
                      <Text fontSize="md" color="red.600">
                        * This question is mandatory. *</Text>
                    </Box>
                  )}
                  <Box
                    bg="white"
                    rounded="xl"
                    shadow={2}
                    p={4}
                    borderWidth={errors && errors[`${question.sequenceNo}`] ? 2 : 0}
                    borderColor="red.500"
                  >
                    <HStack alignItems="center">
                      <FormControl.Label flex={1} pr={3}>
                        <Text>{question.questionText}</Text>
                      </FormControl.Label>

                      <Controller
                        control={control}
                        name={`${question.sequenceNo}`}
                        defaultValue={question.defaultValue}
                        rules={{ required: question.mandatory === -1 }}
                        render={({ field: { onChange, value } }) => (
                          <Select
                            isReadOnly={true}
                            width="120px"
                            selectedValue={typeof value === "string" ? value : undefined}
                            placeholder="Select"
                            onValueChange={onChange}
                            _selectedItem={{
                              bg: "teal.100",
                              endIcon: <CheckIcon size="5" />
                            }}
                          >
                            {Array.isArray(question.responseCSV)
                              ? question.responseCSV.map(option => (
                                <Select.Item key={option} label={option} value={option} />
                              ))
                              : String(question.responseCSV)
                                .split(",")
                                .map(option => (
                                  <Select.Item key={option.trim()} label={option.trim()} value={option.trim()} />
                                ))}
                          </Select>
                        )}
                      />

                    </HStack>
                  </Box>
                </FormControl>
              );
            })}

            <Button onPress={handleSubmit(onSubmit)} colorScheme="teal">
              Submit
            </Button>
          </VStack>
        </Box>
      </ScrollView>
    )
  );
}
