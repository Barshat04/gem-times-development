export const dummyTasks = [
    {
        startTime: "08:30", // 24-hour format
        finishTime: "10:30", // 24-hour format
        jobNo: "JOB-2024-001",
        plantNo: "PLT-123",
        totalTime: "1 hour 02 minutes"
    },
    {
        startTime: "10:45", // 24-hour format
        finishTime: "16:30", // 24-hour format
        jobNo: "JOB-2024-001",
        plantNo: "PLT-123",
        totalTime: "1 hour 30 minutes"
    },
    {
        startTime: "16:45", // 24-hour format
        finishTime: "", // 24-hour format
        jobNo: "JOB-2024-001",
        plantNo: "PLT-123",
        totalTime: ""
    },
];

export const dummyTimeEntry = {
    timeFor: "job",  // One of: "job", "smoko", "lunch", "travel"
    startTime: "08:30", // 24-hour format
    finishTime: "16:30", // 24-hour format
    jobNo: "JOB-2024-001",
    plantNo: "PLT-123",
    workDetails: "Performed routine maintenance on equipment including oil change, filter replacement, and general inspection. Completed safety checks and documentation.",
    smhStart: "1234.5", // Optional
    smhFinish: "1238.5", // Optional
    userID: 358158,
    siteID: "SITE-001",
    forDate: new Date().toISOString(),
    totalTime: "08:00" // Calculated automatically
};