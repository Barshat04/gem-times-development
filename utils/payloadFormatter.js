// Utility to format timesheet payloads correctly for the /upload endpoint
export const formatTimesheetPayload = (timesheetData) => {
  // Ensure we have the required fields
  if (
    !timesheetData.siteID ||
    !timesheetData.userID ||
    !timesheetData.forDate
  ) {
    throw new Error(
      "Missing required timesheet fields: siteID, userID, or forDate"
    );
  }

  // Ensure tasks is an array
  if (!Array.isArray(timesheetData.tasks)) {
    throw new Error("Tasks must be an array");
  }

  // Clean and format the timesheet payload
  const cleanedPayload = {
    siteID: timesheetData.siteID,
    userID: timesheetData.userID,
    forDate: timesheetData.forDate,
    submitTime: timesheetData.submitTime || null,
    uploadTime: timesheetData.uploadTime || new Date().toISOString(),
    dayOffReason: timesheetData.dayOffReason || null,
    comments: timesheetData.comments || "",
    tasks: timesheetData.tasks.map((task) => ({
      startTime: task.startTime,
      finishTime: task.finishTime,
      timeFor: task.timeFor,
      jobNo: task.jobNo,
      referenceNo1: task.referenceNo1 || "",
      referenceNo2: task.referenceNo2 || "",
      referenceNo3: task.referenceNo3 || "",
      workDone: task.workDone || "",
    })),
  };

  return cleanedPayload;
};

// Validate timesheet payload before sending
export const validateTimesheetPayload = (payload) => {
  const errors = [];

  if (!payload.siteID) errors.push("siteID is required");
  if (!payload.userID) errors.push("userID is required");
  if (!payload.forDate) errors.push("forDate is required");
  if (!Array.isArray(payload.tasks)) errors.push("tasks must be an array");

  // Validate each task
  payload.tasks?.forEach((task, index) => {
    if (!task.timeFor) errors.push(`Task ${index + 1}: timeFor is required`);
    if (!task.jobNo) errors.push(`Task ${index + 1}: jobNo is required`);
    if (!task.startTime)
      errors.push(`Task ${index + 1}: startTime is required`);
    // finishTime can be null for active clock sessions
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Format clock action for upload
export const formatClockPayload = (clockData, isClockOff = false) => {
  const payload = {
    siteID: clockData.siteID,
    userID: clockData.userID,
    forDate: clockData.forDate,
    submitTime: isClockOff
      ? clockData.timestamp || new Date().toISOString()
      : null,
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
        referenceNo1: clockData.referenceNo1 || "",
        referenceNo2: clockData.referenceNo2 || "",
        referenceNo3: clockData.referenceNo3 || "",
        workDone: clockData.workDone || "",
      },
    ],
  };

  return formatTimesheetPayload(payload);
};
