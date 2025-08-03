import React, { useEffect, useState, useContext, useMemo } from "react";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Text, VStack, Divider } from "native-base";
import { useTasks } from "@/hooks/useTasks";
import { SiteContext } from "@/context/SiteContext";

function HomeDateTime() {
  const { activePastTSIndex, pastTSDates, viewPastTimeSheet } = useTasks();
  const { siteData } = useContext(SiteContext);
  const [currentTime, setCurrentTime] = useState("");

  // Create timezone config once when siteData changes
  const timeConfig = useMemo(() => {
    if (!siteData?.timezoneToUse) return null;
    
    try {
      // Convert UTC+10:00 format to Etc/GMT-10
      const offset = siteData.timezoneToUse.replace("UTC", "");
      const sign = offset.startsWith("+") ? "-" : "+"; // Invert sign for Etc/GMT format
      const hours = offset.replace(/[+\-:]00/g, "");
      
      return {
        timezone: `Etc/GMT${sign}${hours}`,
        format: siteData.defaultTimeFormat === 24 ? "HH:mm:ss" : "h:mm:ss a"
      };
    } catch {
      return null;
    }
  }, [siteData]);

  // Update time
  useEffect(() => {
    function updateTime() {
      const now = new Date();
      
      // Format with timezone if available, otherwise use local time.
      const formattedTime = timeConfig
        ? formatInTimeZone(now, timeConfig.timezone, timeConfig.format)
        : format(now, timeConfig?.format || "h:mm:ss a");
        
      setCurrentTime(formattedTime);
    }

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timeConfig]);

  // Get formatted date (past timesheet or current)
  const formattedDate = useMemo(() => {
    if (viewPastTimeSheet && pastTSDates[activePastTSIndex]?.date) {
      return format(new Date(pastTSDates[activePastTSIndex]?.date), "EEEE, MMM d, yyyy");
    }
    
    const now = new Date();
    return timeConfig
      ? formatInTimeZone(now, timeConfig.timezone, "EEEE, MMM d, yyyy")
      : format(now, "EEEE, MMM d, yyyy");
  }, [viewPastTimeSheet, pastTSDates, activePastTSIndex, timeConfig]);

  return (
    <VStack alignItems="center" space={1} mb={4}>
      <Text fontSize="lg" fontWeight="medium" color="coolGray.800">
        {formattedDate}
      </Text>

      {!viewPastTimeSheet && (
        <Text fontSize="md" color="coolGray.600">
          {currentTime}
        </Text>
      )}
      
    </VStack>
  );
}

export default HomeDateTime;