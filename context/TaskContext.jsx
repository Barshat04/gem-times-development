"use client"

import { useState, createContext, useEffect, useContext } from "react"
import { useNetInfo } from "@react-native-community/netinfo"
import { getStorageData, storeData, removeData } from "@/asyncStorage"
import { SiteContext } from "@/context/SiteContext"
import { UserContext } from "@/context/UserContext"
import {
  storeActiveClock,
  getActiveClock,
  clearActiveClock,
  storeOfflineClockAction,
} from "@/utils/offlineClockManager"
import { syncQueue } from "@/utils/syncManager"

export const TaskContext = createContext()

export function TaskProvider({ children }) {
  const [activeTimesheet, setActiveTimesheet] = useState(null)
  const [pastTimesheets, setPastTimesheets] = useState([])
  const [pastTasks, setPastTasks] = useState([])
  const [viewPastTimesheets, setViewPastTimesheets] = useState(false)
  const [activeTask, setActiveTask] = useState(null)
  const [pastSubmitQuestions, setPastSubmitQuestions] = useState([])
  const [activeClock, setActiveClock] = useState(null)
  const [isClockSyncing, setIsClockSyncing] = useState(false)

  const { site } = useContext(SiteContext)
  const { userData } = useContext(UserContext)
  const { isConnected } = useNetInfo()

  const getTodayDate = () => new Date().toISOString().split("T")[0]

  const clockOn = async (taskData) => {
    try {
      const clockData = {
        ...taskData,
        siteID: site.siteID,
        userID: userData.userID,
        forDate: getTodayDate(),
        startTime: taskData.startTime,
        clockedOn: true,
        type: "CLOCK_ON",
        timestamp: new Date().toISOString(),
      }

      await storeActiveClock(clockData)
      setActiveClock(clockData)
      await storeActiveTask(clockData)

      // Queue it for later sync — no immediate upload
      await storeOfflineClockAction(clockData)

      return true
    } catch (error) {
      console.error("Clock on failed:", error)
      return false
    }
  }

  const updateActiveClock = async (updatedClock) => {
    await storeActiveClock(updatedClock);
    setActiveClock(updatedClock);
  };

  const clockOff = async (taskData) => {
    try {
      const currentClock = activeClock || (await getActiveClock())
      if (!currentClock) throw new Error("No active clock session found")

      const clockOffData = {
        ...currentClock,
        ...taskData,
        finishTime: taskData.finishTime,
        clockedOff: true,
        type: "CLOCK_OFF",
        timestamp: new Date().toISOString(),
      }

      await clearActiveClock()
      setActiveClock(null)

      // Queue for sync
      await storeOfflineClockAction(clockOffData)

      // Append task to local timesheet
      await appendTaskToTimesheet({
        startTime: clockOffData.startTime,
        finishTime: clockOffData.finishTime,
        timeFor: clockOffData.timeFor,
        jobNo: clockOffData.jobNo,
        referenceNo1: clockOffData.referenceNo1 || "",
        referenceNo2: clockOffData.referenceNo2 || "",
        referenceNo3: clockOffData.referenceNo3 || "",
        workDone: clockOffData.workDone || "",
      })

      return true
    } catch (error) {
      console.error("Clock off failed:", error)
      return false
    }
  }

  const isCurrentlyClockedOn = () => activeClock?.clockedOn && !activeClock.clockedOff

  const getCurrentClockSession = () => activeClock

  const createTimesheet = async () => {
    try {
      const newTS = {
        siteID: site.siteID,
        userID: userData.userID,
        forDate: getTodayDate(),
        submitTime: null,
        uploadTime: null,
        dayOffReason: null,
        comments: "",
        tasks: [],
      }
      await storeData("activeTimesheet", newTS)
      setActiveTimesheet(newTS)
      return newTS
    } catch (err) {
      console.error("Error creating timesheet:", err)
      return null
    }
  }

  const getActiveTimesheet = async () => {
    try {
      const stored = await getStorageData("activeTimesheet")
      return stored ? JSON.parse(stored) : null
    } catch (err) {
      console.error("Error getting active timesheet:", err)
      return null
    }
  }

  const saveTimesheet = async (timesheet) => {
    try {
      const stored = await getStoredTimesheets()
      const newList = [timesheet, ...stored]
      await storeData("timesheets", newList)
      await clearActiveTimesheet()
    } catch (err) {
      console.error("Error saving timesheet:", err)
    }
  }

  const getStoredTimesheets = async () => {
    try {
      const stored = await getStorageData("timesheets")
      return stored ? JSON.parse(stored) : []
    } catch (err) {
      console.error("Error retrieving stored timesheets:", err)
      return []
    }
  }

  const loadPastTimesheets = async () => {
    try {
      if (!isConnected) return

      const [tsRes, qRes] = await Promise.all([
        fetch(`https://gore-api.futureaccess.com.au/TSAPI/download?siteID=${site.siteID}&userID=${userData.userID}`),
        fetch(`https://gore-api.futureaccess.com.au/TSAPI/download/timesheetquestionresponses/${userData.userID}`),
      ])

      if (!tsRes.ok || !qRes.ok) throw new Error("Failed to fetch past timesheet data")

      const tsData = await tsRes.json()
      const qData = await qRes.json()

      setPastTimesheets(tsData.timesheets || [])

      const allTasks = (tsData.timesheets || []).flatMap((ts) =>
        ts.tasks.map((task) => ({ ...task, forDate: ts.forDate }))
      )
      setPastTasks(allTasks)
      setPastSubmitQuestions(qData || [])
    } catch (err) {
      console.error("Error loading past timesheets:", err)
      setPastTimesheets([])
      setPastTasks([])
      setPastSubmitQuestions([])
    }
  }

  // const discardTimesheet = async () => {
  //   await clearActiveTask()
  //   await clearActiveTimesheet()
  // }

  const discardTimesheet = async () => {
    try {
      await clearActiveTask()
      await clearActiveTimesheet()
      await clearActiveClock()
      setActiveClock(null)

      // Also remove any offline clock actions related to this session
      const queue = await getStorageData("offlineClockQueue")
      if (queue) {
        const parsedQueue = JSON.parse(queue)

        // Filter out actions related to the discarded clock session
        const updatedQueue = parsedQueue.filter(
          (item) =>
            item.userID !== userData.userID ||
            item.siteID !== site.siteID ||
            item.forDate !== getTodayDate()
        )

        await storeData("offlineClockQueue", updatedQueue)
      }
    } catch (err) {
      console.error("Failed to fully discard timesheet:", err)
    }
  }

  const clearActiveTimesheet = async () => {
    await removeData("activeTimesheet")
    setActiveTimesheet(null)
  }

  const appendTaskToTimesheet = async (task) => {
    let ts = activeTimesheet || (await getActiveTimesheet())
    if (!ts) ts = await createTimesheet()

    const updated = { ...ts, tasks: [...ts.tasks, task] }
    await storeData("activeTimesheet", updated)
    setActiveTimesheet(updated)
    await clearActiveTask()
  }

  const getTasks = (ts) => (Array.isArray(ts?.tasks) ? ts.tasks : [])

  const storeActiveTask = async (task) => {
    setActiveTask(task)
    await storeData("activeTask", task)
  }

  const getActiveTask = async () => {
    try {
      const stored = await getStorageData("activeTask")
      return stored ? JSON.parse(stored) : null
    } catch (err) {
      console.error("Error retrieving active task:", err)
      return null
    }
  }

  const clearActiveTask = async () => {
    setActiveTask(null)
    await removeData("activeTask")
  }

  const submitDayStartResponses = async (payload) => {
    try {
      if (!isConnected) {
        const local = await getStoredDayStartQuestions()
        await storeData("dayStartQuestions", [payload, ...local])
        return true
      }

      const res = await fetch("https://gore-api.futureaccess.com.au/TSAPI/daystartresponses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(await res.text())

      const local = await getStoredDayStartQuestions()
      await storeData("dayStartQuestions", [payload, ...local])
      return true
    } catch (err) {
      console.error("Error saving day start questions:", err)
      return false
    }
  }

  const getStoredDayStartQuestions = async () => {
    try {
      const stored = await getStorageData("dayStartQuestions")
      return stored ? JSON.parse(stored) : []
    } catch (err) {
      console.error("Error retrieving stored day start questions:", err)
      return []
    }
  }

  const saveSubmitQuestions = async (questions) => {
    try {
      const local = await getStoredSubmitQuestions()
      await storeData("submitQuestions", [questions, ...local])
    } catch (err) {
      console.error("Error saving submit questions:", err)
    }
  }

  const getStoredSubmitQuestions = async () => {
    try {
      const stored = await getStorageData("submitQuestions")
      return stored ? JSON.parse(stored) : []
    } catch (err) {
      console.error("Error retrieving submit questions:", err)
      return []
    }
  }

  // Load active clock on mount
  useEffect(() => {
    const loadActiveClock = async () => {
      try {
        const clock = await getActiveClock()
        if (clock) setActiveClock(clock)
      } catch (error) {
        console.error("Failed to load active clock:", error)
      }
    }

    loadActiveClock()
  }, [])

  // Auto-sync when back online
  useEffect(() => {
    if (isConnected && !isClockSyncing) {
      syncQueue().catch((error) => {
        console.error("Auto-sync failed:", error)
      })
    }
  }, [isConnected])

  useEffect(() => {
    const tryLoad = async () => {
      if (!site?.siteID || !userData?.userID) return

      const task = await getActiveTask()
      if (task) setActiveTask(task)

      const ts = await getActiveTimesheet()
      if (ts) setActiveTimesheet(ts)

      await loadPastTimesheets()
    }

    tryLoad()
  }, [site, userData])

  const updateTimesheetTask = async (updatedTask) => {
    let ts = activeTimesheet || (await getActiveTimesheet());
    if (!ts) return;

    const updatedTasks = ts.tasks.map((task) => {
      const isSameTask =
        task.startTime === updatedTask.startTime &&
        task.timeFor === updatedTask.timeFor &&
        task.jobNo === updatedTask.originalJobNo;

      return isSameTask ? { ...task, ...updatedTask } : task;
    });

    const updatedTimesheet = { ...ts, tasks: updatedTasks };
    await storeData("activeTimesheet", updatedTimesheet);
    setActiveTimesheet(updatedTimesheet);
  };



  return (
    <TaskContext.Provider
      value={{
        activeTimesheet,
        activeTask,
        pastTasks,
        pastTimesheets,
        pastSubmitQuestions,
        viewPastTimesheets,
        setViewPastTimesheets,
        createTimesheet,
        getActiveTimesheet,
        appendTaskToTimesheet,
        discardTimesheet,
        clearActiveTask,
        clearActiveTimesheet,
        getStoredTimesheets,
        saveTimesheet,
        getTasks,
        storeActiveTask,
        getActiveTask,
        submitDayStartResponses,
        getStoredDayStartQuestions,
        saveSubmitQuestions,
        getStoredSubmitQuestions,
        activeClock,
        isClockSyncing,
        clockOn,
        updateActiveClock,
        clockOff,
        isCurrentlyClockedOn,
        getCurrentClockSession,
        isConnected,
        updateTimesheetTask,

      }}
    >
      {children}
    </TaskContext.Provider>
  )
}
