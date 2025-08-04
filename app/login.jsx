import React, { useState, useContext, useEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "expo-router";
import { UserContext } from "@/context/UserContext";
import { TaskContext } from "@/context/TaskContext";
import { SiteContext } from "@/context/SiteContext";
import {
  Box,
  Text,
  Input,
  VStack,
  HStack,
  Heading,
  Image,
  FormControl,
  Spinner,
  Icon,
  Button,
  Pressable,
  Modal,
  Divider
} from "native-base";

export default function LoginScreen() {
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
  } = useForm({
    defaultValues: {
      userName: "",
      pin: "",
      siteID: "",
      siteName: ""
    },
  });

  const { login, isAuthenticated, authLoading, user, retrieveUserData } = useContext(UserContext); // Added isAuthenticated, authLoading, user, retrieveUserData
  const { site, setSiteInfo } = useContext(SiteContext);
  const { activeTimesheet, setPastTaskInfo, setPastTimesheetInfo, setPastSubmitQuestionsInfo } = useContext(TaskContext);
  const [formError, setFormError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false); // Renamed for clarity, related to form submission
  const [siteModalVisible, setSiteModalVisible] = useState(false);
  const [siteIdMissing, setSiteIdMissing] = useState(false); // This state might need more robust handling

  const router = useRouter();

  // Watch for site ID changes
  const siteID = watch("siteID");

  // Set site ID from context if available
  useEffect(() => {
    if (site?.siteID) {
      setValue("siteID", site.siteID);
    }
  }, [site, setValue]);

  // New useEffect for handling initial authentication check and auto-navigation
  useEffect(() => {
    const checkAuthAndNavigate = async () => {
      if (!authLoading) { // Only proceed after auth check is complete
        if (isAuthenticated && user?.userID && user?.siteID) {
          console.log("User is authenticated from storage. Attempting auto-login setup.");
          // If a user is already authenticated from storage, update site info
          const result = await setSiteInfo(user.siteID);
          if (result) {
            const hasDayStart = await hasSubmittedDayStartToday(user.userID, user.siteID);
            if (hasDayStart) {
              router.replace("/mainscreen");
            } else {
              router.push("/day-start");
            }
          } else {
            console.error("Failed to re-fetch site data on auto-login.");
            // Optionally clear stored credentials if site data fails to load
            // await logout();
            setFormError("Could not load site data. Please log in again.");
          }
          /*
          // Not needed, siteID rarely requires a change, once set no need to re ask.
        } else if (!siteID && !site?.siteID) {
          // If no site ID is set from context or form, and no user is authenticated, prompt for site ID
          setSiteIdMissing(true);
          toggleSiteModal();
          */
        }

      }
    };
    checkAuthAndNavigate();
  }, [isAuthenticated, authLoading, user, site, siteID, setSiteInfo, router]); // Added dependencies

  const hasSubmittedDayStartToday = async (userID, siteID) => {
    try {
      const res = await fetch(`https://gore-api.futureaccess.com.au/TSAPI/download/daystartresponses/${userID}`);
      if (!res.ok) {
        console.error("Failed to fetch daystart responses:", res.status, res.statusText);
        return false;
      }

      const responses = await res.json();
      console.log("API Responses:", responses);

      const today = new Date().toISOString().slice(0, 10); // e.g., "2025-06-18"
      console.log("Today's Date String (YYYY-MM-DD):", today);

      return responses.some(r => {
        const responseDate = new Date(r.forDate).toISOString().slice(0, 10); // Extract YYYY-MM-DD from response
        console.log("Response Date String (YYYY-MM-DD):", responseDate);
        return (
          r.userID === userID &&
          r.siteID === siteID &&
          responseDate === today // Compare only the date parts
        );
      });
    } catch (err) {
      console.error("Error checking daystart status:", err);
      return false;
    }
  };


  // If active timesheet exists, and user has already loaded a site go to mainscreen.
  // If not, start the day.
  // This function might become less critical if auto-login handles initial routing
  const handleNavigation = async () => {
    if (site && activeTimesheet) {
      router.replace("/mainscreen");
    } else {
      router.push("/day-start");
    }
  };

  // Handle the login functionality from the form data.
  const handleLogin = async (data) => {
    setValue("pin", "");
    setLoginLoading(true);
    setFormError(null);

    try {
      if (!data.userName || !data.pin) {
        setFormError("Username and PIN are required.");
        setLoginLoading(false);
        return;
      }

      const site_id = site ? site.siteID : data.siteID;

      if (!site_id) {
        setFormError("Site ID has not been set");
        setSiteIdMissing(true);
        setLoginLoading(false);
        return;
      }

      const login_res = await login({
        userName: data.userName,
        pin: data.pin,
        siteID: site_id
      });

      if (!login_res) {
        setFormError("Login failed! Please check credentials.");
        setLoginLoading(false);
        return;
      }

      const result = await setSiteInfo(site_id);
      if (!result) {
        setFormError("Failed to fetch site data!");
        setLoginLoading(false);
        return;
      }

      const hasDayStart = await hasSubmittedDayStartToday(login_res.userID, site_id);

      if (hasDayStart) {
        router.replace("/mainscreen");
      } else {
        router.push("/day-start");
      }

    } catch (err) {
      console.error("Login error:", err);
      setFormError("Unexpected login error.");
    } finally {
      setLoginLoading(false);
    }
  };


  const toggleSiteModal = () => setSiteModalVisible((prev) => !prev);

  // Show a global loading spinner while authentication status is being checked
  if (authLoading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg="coolGray.50">
        <Spinner size="lg" color="emerald.500" />
        <Text mt={3} fontSize="md" color="coolGray.600">Checking session...</Text>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="coolGray.50" p={6} justifyContent="center" alignItems="center">
      <Pressable
        position="absolute"
        top="5"
        border="red"
        right="5"
        onPress={toggleSiteModal}
        _pressed={{
          opacity: 0.8
        }}
      >
        <HStack
          space={2}
          alignItems="center"
          bg="white"
          p={2}
          pl={3}
          pr={3}
          borderRadius="md"
          shadow={1}
          borderWidth={siteIdMissing ? "2" : "0"}
          borderColor="red.500"
        >
          <Text color="coolGray.500" fontSize="xs" fontWeight="medium">SITE ID:</Text>
          <Text color="emerald.600" fontWeight="semibold" fontSize="sm" maxW="120px" numberOfLines={1}>
            {getValues().siteID || site?.siteID || "Not Set"}
          </Text>
        </HStack>
      </Pressable>

      <VStack space={6} alignItems="center" w="100%">
        <Heading size="xl">GEM Times</Heading>

        {site?.loginImageFile && (
          <Image
            source={{ uri: site.loginImageFile }}
            w="200px"
            h="100px"
            resizeMode="contain"
            mb={4}
            alt="Company Logo"
          />
        )}

        {/* Site ID Status Indicator - only show if set */}
        {(site?.siteID || getValues().siteID) && (
          <Text color="coolGray.700" fontSize="md" fontWeight="medium">
            Site ID: {site?.siteID || getValues().siteID}
          </Text>
        )}

        {loginLoading ? (
          <Box flex={1} justifyContent="center" alignItems="center">
            <Spinner size="lg" color="emerald.500" />
          </Box>
        ) : (
          <VStack space={4} w="100%" maxW="300px">
            <FormControl>
              <Controller
                name="userName"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Input
                    placeholder="Enter Username"
                    value={value}
                    onChangeText={onChange}
                    size="lg"
                    textAlign="center"
                    fontSize="md"
                    isDisabled={loginLoading}
                    bg="white"
                  />
                )}
              />
            </FormControl>

            <FormControl>
              <Controller
                name="pin"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Input
                    placeholder="Enter 4-digit PIN"
                    value={value}
                    onChangeText={(text) => {
                      const numericText = text.replace(/[^0-9]/g, '');
                      onChange(numericText);
                    }}
                    keyboardType="numeric"
                    secureTextEntry
                    maxLength={4}
                    size="lg"
                    textAlign="center"
                    fontSize="md"
                    isDisabled={loginLoading}
                    bg="white"
                  />
                )}
              />
            </FormControl>

            <FormControl>
              <Button
                bg="emerald.400"
                _pressed={{ bg: "emerald.500" }}
                shadow={2}
                borderRadius={8}
                py={3}
                px={6}
                isDisabled={loginLoading}
                onPress={handleSubmit(handleLogin)}
              >
                <Text color="white" fontWeight="600">
                  Login
                </Text>
              </Button>
            </FormControl>

            {formError && (
              <HStack space={2} alignItems="center" bg="red.100" p={2} borderRadius="md">
                <Icon as={MaterialIcons} name="error-outline" color="red.600" size="sm" />
                <Text color="red.600" fontSize="sm">{formError}</Text>
              </HStack>
            )}
          </VStack>
        )}
      </VStack>

      <Modal isOpen={siteModalVisible} onClose={toggleSiteModal} size="md">
        <Modal.Content borderRadius="lg" bg="gray.50">
          <Modal.CloseButton _icon={{ color: "emerald.600" }} />
          <Modal.Header bg="gray.50" borderBottomWidth="0" alignItems="center" justifyContent="center">
            <Text color="emerald.600" fontWeight="bold">Enter Site ID</Text>
          </Modal.Header>
          <Divider bg="gray.200" />
          <Modal.Body p={4}>
            <VStack space={4}>
              <FormControl isRequired={!site} isInvalid={formError === "Site ID has not been set"}>
                <Controller
                  name="siteID"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <Input
                      placeholder="Enter Site ID"
                      value={value}
                      onChangeText={(text) => {
                        onChange(text);
                        // Clear siteIdMissing when user starts typing in the site ID field
                        if (siteIdMissing && text) {
                          setSiteIdMissing(false);
                        }
                      }}
                      size="md"
                      bg="white"
                    />
                  )}
                />
                <FormControl.HelperText>
                  Enter your organization's unique site identifier
                </FormControl.HelperText>
              </FormControl>

              <Button
                bg="emerald.400"
                _pressed={{ bg: "emerald.500" }}
                onPress={() => {
                  toggleSiteModal();
                  // If siteID is still empty after modal close, set siteIdMissing
                  if (!getValues("siteID") && !site?.siteID) {
                    setSiteIdMissing(true);
                    setFormError("Site ID is required.");
                  } else {
                    setSiteIdMissing(false); // Clear if user entered something
                    setFormError(null); // Clear form error related to site ID
                  }
                }}
                mt={2}
              >
                <Text color="white" fontWeight="600">
                  Save
                </Text>
              </Button>
            </VStack>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </Box>
  );
}