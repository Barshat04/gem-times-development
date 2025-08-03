import AsyncStorage from "@react-native-async-storage/async-storage";
import { addToQueue } from "./offlineQueue";

const PENDING_UPLOADS_KEY = "pendingUploads";

// Store a timesheet for offline upload
export const storePendingUpload = async (
  timesheetData,
  type = "SUBMIT_TIMESHEET"
) => {
  try {
    const existing = await AsyncStorage.getItem(PENDING_UPLOADS_KEY);
    const uploads = existing ? JSON.parse(existing) : [];

    const newUpload = {
      id: Date.now().toString(),
      type,
      timestamp: new Date().toISOString(),
      data: timesheetData,
      synced: false,
    };

    uploads.push(newUpload);
    await AsyncStorage.setItem(PENDING_UPLOADS_KEY, JSON.stringify(uploads));

    // Also add to main offline queue
    await addToQueue({
      type,
      payload: { timesheet: timesheetData },
      timestamp: newUpload.timestamp,
    });

    return newUpload;
  } catch (error) {
    console.error("Failed to store pending upload:", error);
    return null;
  }
};

// Get all pending uploads
export const getPendingUploads = async () => {
  try {
    const data = await AsyncStorage.getItem(PENDING_UPLOADS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get pending uploads:", error);
    return [];
  }
};

// Mark upload as synced
export const markUploadSynced = async (uploadId) => {
  try {
    const existing = await AsyncStorage.getItem(PENDING_UPLOADS_KEY);
    if (!existing) return;

    const uploads = JSON.parse(existing);
    const updatedUploads = uploads.map((upload) =>
      upload.id === uploadId ? { ...upload, synced: true } : upload
    );

    await AsyncStorage.setItem(
      PENDING_UPLOADS_KEY,
      JSON.stringify(updatedUploads)
    );
  } catch (error) {
    console.error("Failed to mark upload as synced:", error);
  }
};

// Clean up synced uploads
export const cleanupSyncedUploads = async () => {
  try {
    const existing = await AsyncStorage.getItem(PENDING_UPLOADS_KEY);
    if (!existing) return;

    const uploads = JSON.parse(existing);
    const unsyncedUploads = uploads.filter((upload) => !upload.synced);

    await AsyncStorage.setItem(
      PENDING_UPLOADS_KEY,
      JSON.stringify(unsyncedUploads)
    );
  } catch (error) {
    console.error("Failed to cleanup synced uploads:", error);
  }
};

// Create timesheet structure for clock actions
export const createClockTimesheetPayload = (clockData, isClockOff = false) => {
  return {
    siteID: clockData.siteID,
    userID: clockData.userID,
    forDate: clockData.forDate,
    submitTime: isClockOff ? new Date().toISOString() : null,
    uploadTime: new Date().toISOString(),
    dayOffReason: null,
    comments: `${isClockOff ? "Clock Off" : "Clock On"} - ${
      clockData.timestamp || new Date().toISOString()
    }`,
    tasks: [
      {
        startTime: clockData.startTime,
        finishTime: isClockOff ? clockData.finishTime : null,
        timeFor: clockData.timeFor,
        jobNo: clockData.jobNo,
        referenceNo1: clockData.referenceNo1,
        referenceNo2: clockData.referenceNo2,
        referenceNo3: clockData.referenceNo3,
        workDone: clockData.workDone,
      },
    ],
  };
};
