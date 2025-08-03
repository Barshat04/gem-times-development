"use client"

import { useEffect, useContext, useState } from "react"
import { router, useLocalSearchParams } from "expo-router"
import { useForm, Controller } from "react-hook-form"
import { MaterialIcons } from "@expo/vector-icons"
import {
  Box,
  ScrollView,
  Text,
  Input,
  TextArea,
  FormControl,
  Select,
  Button,
  VStack,
  Spinner,
  IconButton,
  Icon,
  HStack,
  Alert,
  Badge,
} from "native-base"

import timeUtils from "@/utils/timeUtils"
import { UserContext } from "@/context/UserContext"
import { SiteContext } from "@/context/SiteContext"
import { TaskContext } from "@/context/TaskContext"

const TimeEntryScreen = () => {
  const { userData } = useContext(UserContext)
  const { site: siteData } = useContext(SiteContext)
  const {
    appendTaskToTimesheet,
    activeTask,
    storeActiveTask,
    clockOn,
    clockOff,
    isCurrentlyClockedOn,
    getCurrentClockSession,
    isConnected,
    isClockSyncing,
  } = useContext(TaskContext)

  const { mode } = useLocalSearchParams()
  const [totalTime, setTotalTime] = useState("HH:MM")
  const [manualEntry, setManualEntry] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showOfflineAlert, setShowOfflineAlert] = useState(false)

  // Default form values are dependant on mode!
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      timeFor: "",
      startTime: mode === "clock_on" ? timeUtils.getCurrentTime() : "",
      finishTime: mode === "clock_off" ? timeUtils.getCurrentTime() : "",
      jobNo: "",
      referenceNo1: "",
      referenceNo2: "",
      referenceNo3: "",
      workDone: "",
    },
  })

  const startTime = watch("startTime")
  const finishTime = watch("finishTime")
  const timeOptions = siteData?.timeForListCSV
    ? siteData.timeForListCSV.split(",").map((item) => ({
      label: item,
      value: item,
    }))
    : []

  // Show offline status
  useEffect(() => {
    if (!isConnected) {
      setShowOfflineAlert(true)
      const timer = setTimeout(() => setShowOfflineAlert(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [isConnected])

  // Helper to sanitise the form values using your timeUtils
  const cleanTime = (time) => {
    if (!time.includes(":")) {
      if (time.length <= 2) {
        return `${time}:00`
      } else {
        return `${time.slice(0, time.length - 2)}:${time.slice(-2)}`
      }
    }
    return time
  }

  // Format the time into HHMM format such as 1740 using your timeUtils logic
  const formatTime = (value) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 4)

    if (digitsOnly.length < 3) {
      return digitsOnly
    }

    let hours = digitsOnly.slice(0, 2)
    let minutes = digitsOnly.slice(2)

    if (Number.parseInt(hours, 10) > 23) hours = "23"
    if (Number.parseInt(minutes, 10) > 59) minutes = "59"

    return hours + minutes.padEnd(2, "0")
  }

  // Enhanced submit function with offline support
  const onSubmit = async (data) => {
    try {
      setIsLoading(true)

      const match = /^(([01]?[0-9]|2[0-3])(:([0-5][0-9]))?)|([01]?[0-9]|2[0-3])([0-5][0-9])$/

      if (!match.test(data.startTime)) {
        setError("startTime", {
          type: "pattern",
          message: "Please enter a valid 24-hour time format (hh:mm or hhmm)",
        })
        return
      }

      if (data.finishTime && !match.test(data.finishTime)) {
        setError("finishTime", {
          type: "pattern",
          message: "Please enter a valid 24-hour time format (hh:mm or hhmm)",
        })
        return
      }

      if (mode === "manual" && !data.finishTime) {
        setError("finishTime", {
          type: "validate",
          message: "Finish time is required",
        })
        return
      }

      const formattedStartTime = formatTime(data.startTime)
      const formattedFinishTime = data.finishTime ? formatTime(data.finishTime) : null

      if (formattedStartTime && formattedFinishTime && mode !== "clock_on") {
        if (formattedFinishTime < formattedStartTime) {
          setError("finishTime", {
            type: "validate",
            message: "Finish time must be after start time",
          })
          return
        }
      }

      const commonPayload = {
        ...data,
        startTime: formattedStartTime,
        finishTime: formattedFinishTime,
        siteID: siteData?.siteID,
        userID: userData?.userID,
        forDate: new Date().toISOString().split("T")[0],
      }

      let success = false

      if (mode === "clock_on") {
        success = await clockOn({
          ...commonPayload,
          finishTime: null,
        })
      } else if (mode === "clock_off") {
        success = await clockOff(commonPayload)
      } else {
        // Manual entry - clean the payload for database
        const cleanPayload = {
          startTime: commonPayload.startTime,
          finishTime: commonPayload.finishTime,
          timeFor: commonPayload.timeFor,
          jobNo: commonPayload.jobNo,
          referenceNo1: commonPayload.referenceNo1 || "",
          referenceNo2: commonPayload.referenceNo2 || "",
          referenceNo3: commonPayload.referenceNo3 || "",
          workDone: commonPayload.workDone || "",
        }
        await appendTaskToTimesheet(cleanPayload)
        await storeActiveTask(null)
        success = true
      }

      if (success) {
        router.back()
      } else {
        console.error("Failed to submit time entry")
      }
    } catch (error) {
      console.error("Time entry submission error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Check if we are manual or clock on/off entry time from DB.
  useEffect(() => {
    if (userData?.timeEntryType === "M") {
      setManualEntry(true)
    } else {
      setManualEntry(false)
    }
  }, [userData])

  // Load the stored activeTask from storage if in clock off mode.
  useEffect(() => {
    if (mode === "clock_off") {
      const currentSession = getCurrentClockSession()
      if (currentSession) {
        reset({
          timeFor: currentSession.timeFor || "",
          startTime: currentSession.startTime || "",
          finishTime: timeUtils.getCurrentTime(),
          jobNo: currentSession.jobNo || "",
          referenceNo1: currentSession.referenceNo1 || "",
          referenceNo2: currentSession.referenceNo2 || "",
          referenceNo3: currentSession.referenceNo3 || "",
          workDone: currentSession.workDone || "",
        })
      }
    }
  }, [mode, reset])

  // Whenever we get valid time values, determine the total time for the task using your timeUtils
  useEffect(() => {
    if (startTime && finishTime) {
      const timeDifference = timeUtils.calculateTimeDifference(cleanTime(startTime), cleanTime(finishTime))
      setTotalTime(timeDifference || "Invalid Time")
    }
  }, [startTime, finishTime])

  if (isLoading || !userData || !siteData) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Spinner size="lg" />
        {isClockSyncing && <Text mt={2}>Syncing clock data...</Text>}
      </Box>
    )
  }

  return (
    <ScrollView>
      <Box p={5} bg="coolGray.100" minHeight="100%">
        <IconButton
          icon={<Icon as={MaterialIcons} name="arrow-back" />}
          onPress={() => router.push("/mainscreen")}
          position="absolute"
          top={3}
          left={3}
          zIndex={1}
        />

        {/* Offline Alert */}
        {showOfflineAlert && (
          <Alert status="warning" mb={4} mt={10}>
            <Alert.Icon />
            <Text>You're offline. Time entries will sync when connection is restored.</Text>
          </Alert>
        )}

        {/* Connection Status Badge */}
        <HStack justifyContent="center" mb={2} mt={showOfflineAlert ? 2 : 10}>
          <Badge colorScheme={isConnected ? "success" : "warning"} variant="solid">
            {isConnected ? "Online" : "Offline"}
          </Badge>
          {isClockSyncing && (
            <Badge colorScheme="info" variant="solid" ml={2}>
              Syncing...
            </Badge>
          )}
        </HStack>

        <VStack space={3} alignItems="center" width="100%">
          <Text fontSize="xl" fontWeight="bold" textAlign="center" mb={2}>
            {mode === "clock_on" ? "Clock On" : mode === "clock_off" ? "Clock Off" : "Time Entry"}
            {!isConnected && " (Offline)"}
          </Text>

          {/* Show current clock status */}
          {isCurrentlyClockedOn() && mode !== "clock_off" && (
            <Alert status="info" mb={4}>
              <Alert.Icon />
              <Text>You are currently clocked on. Clock off to complete your session.</Text>
            </Alert>
          )}

          <FormControl isInvalid={!!errors.timeFor} mb={0}>
            {errors.timeFor && (
              <Box alignItems="center" justifyContent="center">
                <Text fontSize="md">* This field is required. *</Text>
              </Box>
            )}
            <Box
              bg="white"
              rounded="xl"
              shadow={2}
              p={4}
              borderWidth={errors.timeFor ? 2 : 0}
              borderColor="red.500"
              width="100%"
            >
              <HStack width="100%" alignItems="center" justifyContent="center">
                <FormControl.Label flex={1}>
                  <Text>Time For</Text>
                </FormControl.Label>

                <Controller
                  control={control}
                  name="timeFor"
                  rules={{ required: true }}
                  render={({ field: { onChange, value } }) => (
                    <Select
                      width="170px"
                      selectedValue={value}
                      placeholder="Select"
                      onValueChange={onChange}
                      isDisabled={mode === "clock_off"}
                    >
                      {timeOptions.map(({ label, value }) => (
                        <Select.Item key={value} label={label} value={value} />
                      ))}
                    </Select>
                  )}
                />
              </HStack>
            </Box>
          </FormControl>

          {mode !== "clock_off" && (
            <FormControl isInvalid={!!errors.startTime} mb={0}>
              {errors.startTime && (
                <Box alignItems="center" justifyContent="center">
                  <Text fontSize="md">* Start time is required. *</Text>
                </Box>
              )}
              <Box
                bg="white"
                rounded="xl"
                shadow={2}
                p={4}
                borderWidth={errors.startTime ? 2 : 0}
                borderColor="red.500"
                width="100%"
              >
                <HStack alignItems="center">
                  <FormControl.Label flex={1} pr={3}>
                    <Text>Start Time</Text>
                  </FormControl.Label>

                  <Controller
                    control={control}
                    name="startTime"
                    rules={{ required: true }}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        width="50%"
                        value={value}
                        onChangeText={(text) => {
                          const ft = formatTime(text)
                          onChange(ft)
                        }}
                        placeholder="HH:MM"
                        isReadOnly={mode === "clock_on" || mode === "clock_off"}
                      />
                    )}
                  />
                </HStack>
              </Box>
            </FormControl>
          )}

          {mode !== "clock_on" && (
            <FormControl isInvalid={!!errors.finishTime} mb={0}>
              {errors.finishTime && (
                <Box alignItems="center" justifyContent="center">
                  <Text fontSize="md">* {errors.finishTime.message || "Invalid finish time"} *</Text>
                </Box>
              )}
              <Box
                bg="white"
                rounded="xl"
                shadow={2}
                p={4}
                borderWidth={errors.finishTime ? 2 : 0}
                borderColor="red.500"
                width="100%"
              >
                <HStack alignItems="center">
                  <FormControl.Label flex={1} pr={3}>
                    <Text>Finish Time</Text>
                  </FormControl.Label>

                  <Controller
                    control={control}
                    name="finishTime"
                    rules={{ required: true }}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        width="50%"
                        value={value}
                        onChangeText={(text) => {
                          const ft = formatTime(text)
                          onChange(ft)
                        }}
                        placeholder="HH:MM"
                        isReadOnly={mode === "clock_off"}
                      />
                    )}
                  />
                </HStack>
              </Box>
            </FormControl>
          )}

          {mode !== "clock_on" && (
            <FormControl mb={0}>
              <Box bg="white" rounded="xl" shadow={2} p={4} width="100%">
                <HStack alignItems="center">
                  <FormControl.Label flex={1} pr={3}>
                    <Text>Total Time</Text>
                  </FormControl.Label>

                  <Input width="50%" value={totalTime} isReadOnly />
                </HStack>
              </Box>
            </FormControl>
          )}

          <FormControl isInvalid={!!errors.jobNo} mb={0}>
            {errors.jobNo && (
              <Box alignItems="center" justifyContent="center">
                <Text fontSize="md">* This field is required. *</Text>
              </Box>
            )}
            <Box
              bg="white"
              rounded="xl"
              shadow={2}
              p={4}
              borderWidth={errors.jobNo ? 2 : 0}
              borderColor="red.500"
              width="100%"
            >
              <HStack alignItems="center">
                <FormControl.Label flex={1} pr={3}>
                  <Text>Job No</Text>
                </FormControl.Label>

                <Controller
                  control={control}
                  name="jobNo"
                  rules={{ required: true }}
                  render={({ field: { onChange, value } }) => (
                    <Input
                      width="50%"
                      value={value}
                      onChangeText={onChange}
                      placeholder="Enter Job No"
                      isReadOnly={mode === "clock_off"}
                    />
                  )}
                />
              </HStack>
            </Box>
          </FormControl>

          {[1, 2, 3].map((num) => (
            <FormControl key={`ref${num}`} mb={0}>
              <Box bg="white" rounded="xl" shadow={2} p={4} width="100%">
                <HStack alignItems="center">
                  <FormControl.Label flex={1} pr={3}>
                    <Text>Reference No {num}</Text>
                  </FormControl.Label>

                  <Controller
                    control={control}
                    name={`referenceNo${num}`}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        width="50%"
                        value={value}
                        onChangeText={onChange}
                        placeholder={`Enter Ref ${num}`}
                        isReadOnly={mode === "clock_off"}
                      />
                    )}
                  />
                </HStack>
              </Box>
            </FormControl>
          ))}

          <FormControl mb={0}>
            <Box bg="white" rounded="xl" shadow={2} p={4} width="100%">
              <FormControl.Label>
                <Text mb={2}>Details of Work</Text>
              </FormControl.Label>

              <Controller
                control={control}
                name="workDone"
                render={({ field: { onChange, value } }) => (
                  <TextArea
                    value={value}
                    onChangeText={onChange}
                    placeholder="Describe work performed"
                    h={16}
                    width="100%"
                  />
                )}
              />
            </Box>
          </FormControl>

          <Button
            onPress={handleSubmit(onSubmit)}
            width="50%"
            size="lg"
            rounded="lg"
            bg="emerald.500"
            _pressed={{ bg: "emerald.600" }}
            mt={4}
            mb={6}
            isLoading={isLoading}
            isDisabled={isLoading || isClockSyncing}
          >
            {mode === "clock_on" ? "Clock On" : mode === "clock_off" ? "Clock Off" : "Submit"}
            {!isConnected && " (Offline)"}
          </Button>

          {!isConnected && (
            <Text fontSize="sm" color="gray.500" textAlign="center">
              Data will be synced automatically when connection is restored
            </Text>
          )}
        </VStack>
      </Box>
    </ScrollView>
  )
}

export default TimeEntryScreen
