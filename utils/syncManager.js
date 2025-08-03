import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// Add an action to the offline queue
export const addToQueue = async (action) => {
  try {
    const stored = await AsyncStorage.getItem("offlineQueue");
    const queue = stored ? JSON.parse(stored) : [];
    // Assign a unique ID to the action before adding it
    const actionWithId = {
      ...action,
      id: Date.now() + Math.random().toString(36).substring(2, 9),
    };
    queue.push(actionWithId); // Add the new action to the queue
    await AsyncStorage.setItem("offlineQueue", JSON.stringify(queue));
    console.log(
      "[addToQueue] Action added to queue. Current queue size:",
      queue.length
    );
  } catch (err) {
    console.error("[addToQueue] Error storing action:", err);
  }
};

// Sync the queue - called when device is back online
// Sync the queue - called when device is back online
export const syncQueue = async () => {
  try {
    const stored = await AsyncStorage.getItem("offlineQueue");
    let queue = stored ? JSON.parse(stored) : []; // Use 'let' so we can modify it

    if (!Array.isArray(queue) || queue.length === 0) {
      console.log("[syncQueue] No items to sync");
      return;
    }

    // Process actions one by one
    const newQueue = [];
    console.log(`[syncQueue] Starting sync for ${queue.length} items.`);

    for (const action of queue) {
      try {
        if (action.type === "SUBMIT_DAYSTART_RESPONSES") {
          console.log(
            "[syncQueue] Processing SUBMIT_DAYSTART_RESPONSES action:",
            action.id
          );
          await submitDayStartResponses(action.payload);
          console.log("[syncQueue] Successfully synced action:", action.id);
        } else if (action.type === "SUBMIT_TIMESHEET") {
          // Processing timesheet submission
          console.log(
            "[syncQueue] Processing SUBMIT_TIMESHEET action:",
            action.id
          );
          await submitTimesheet(action.payload);
          console.log(
            "[syncQueue] Successfully synced timesheet action:",
            action.id
          );
        }
        // Add other action types here if needed
      } catch (innerErr) {
        console.error(
          `[syncQueue] Error processing action ID: ${action.id}:`,
          innerErr
        );
        // If an error occurs, put the action back into the queue for a future retry
        newQueue.push(action);
      }
    }

    // Update AsyncStorage with the remaining (unsynced) items
    await AsyncStorage.setItem("offlineQueue", JSON.stringify(newQueue));
    console.log(
      `[syncQueue] Sync complete. Remaining items: ${newQueue.length}`
    );
  } catch (err) {
    console.error("[syncQueue] Outer error syncing offline queue:", err);
  }
};

const submitDayStartResponses = async (dayStartData) => {
  try {
    const response = await axios.post(
      "https://gore-api.futureaccess.com.au/TSAPI/daystartresponses",
      dayStartData
    );
    return response.data; // Assuming it returns a success message or data.
  } catch (error) {
    console.error(
      "[submitDayStartResponses] Error submitting day start responses:",
      error.response ? error.response.data : error.message || error
    );
    throw error; // Rethrow to be caught in the syncQueue if needed
  }
};

// Helper function to submit timesheet data
const submitTimesheet = async (timesheetData) => {
  try {
    await axios.post(
      "https://gore-api.futureaccess.com.au/TSAPI/upload",
      timesheetData.timesheet
    );
    if (timesheetData.responses && timesheetData.responses.length > 0) {
      // Added null/undefined check for responses
      try {
        await axios.post(
          "https://gore-api.futureaccess.com.au/TSAPI/timesheetquestionresponse",
          {
            responses: timesheetData.responses,
            siteID: timesheetData.timesheet.siteID,
            userID: timesheetData.timesheet.userID,
            forDate: timesheetData.timesheet.forDate,
          }
        );
      } catch (err) {
        console.error(
          "[submitTimesheet] Error submitting timesheet question responses:",
          err.response ? err.response.data : err.message || err
        );
        // Important: Re-throw the error so syncQueue knows it failed
        throw err;
      }
    }
  } catch (err) {
    console.error(
      "[submitTimesheet] Error submitting timesheet (upload or initial error):",
      err.response ? err.response.data : err.message || err
    );
    // Important: Re-throw the error so syncQueue knows it failed
    throw err;
  }
};
