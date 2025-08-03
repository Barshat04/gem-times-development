import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { getStorageData, storeData, removeData } from '@/asyncStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SiteContext = createContext();
export const SiteProvider = ({ children }) => {
  const { isConnected } = useNetInfo();
  const [sitesLoading, setSitesLoading] = useState(false);
  const [site, setSite] = useState(null);
  const [siteQuestions, setSiteQuestions] = useState(null);
  const [submitQuestions, setSubmitQuestions] = useState(null);


  // Set the site info from selected site.
  const setSiteInfo = async (siteID) => {
    // Use API to get site data

    // TODO: remove this mock data!
    try {
      const res = await fetch(`https://gore-api.futureaccess.com.au/TSAPI/config/${siteID}`);
      if (!res.ok) throw new Error("Failed to fetch site data");
      const site = await res.json();
      await storeSite(site);


      //   const site =  {
      //       siteID: "DevTeam2",
      //       siteName: "NealTeam 2 Dev Area",
      //       defaultTimeFormat: 12,
      //       timezoneToUse: "UTC+10:00",
      //       pinSize: 4,
      //       tsExpiryDays: 7,
      //       offlineMaxDays: 7,
      //       retainTSDays: 30,
      //       loginImageFile: "empty",
      //       dayStartImageFile: "images/StopForSafety.PNG",
      //       dayStartMessage: "Optional text message that will show on the Day Start screen",
      //       timeForListCSV: "Job,Smoko,Lunch,Travel",
      //       submitTSText: "Finished for the day. Please complete the questionnaire",
      //       dayOffText: "Please select a reason for this day off and add a comment",
      //       dayOffReasonsCSV: "Weekend,Personal Leave,RDO,Unpaid Leave,Annual Leave"
      //   };

      //   await storeSite(site);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Save the fetched or loaded site to storage.
  // Update the required states.
  const storeSite = async (site) => {
    try {
      setSite(site);
      await storeData('site', site);
    } catch (error) {
      console.error('Error storing site:', error);
    }
  }


  // Set the questions from selected site for day start.
  const setSiteQuestionsInfo = async (siteID) => {

    // Await return all site data here from API based on siteID.
    const res = await fetch(`https://gore-api.futureaccess.com.au/TSAPI/daystartquestions/${siteID}`);
    if (!res.ok) throw new Error("Failed to fetch day start questions");
    const questions = await res.json();



    // TODO: remove this mock data!
    // const questions = [
    //   {
    //     sequenceNo: 1,
    //     questionText: "Have you completed a SWMS form for today's work?",
    //     dropdownValues: ["Yes", "N/A"],
    //     defaultValue: "",
    //     mandatory: false
    //   },
    //   {
    //     sequenceNo: 2,
    //     questionText: "Have you completed a Prestart form for today's work?",
    //     dropdownValues: ["Yes", "N/A"],
    //     defaultValue: "",
    //     mandatory: false
    //   },
    //   {
    //     sequenceNo: 3,
    //     questionText: "Have you completed a JSA form for today's work?",
    //     dropdownValues: ["Yes", "N/A"],
    //     defaultValue: "",
    //     mandatory: false
    //   },
    //   {
    //     sequenceNo: 4,
    //     questionText: "Have you completed an AIN form for today's work?",
    //     dropdownValues: ["Yes", "N/A"],
    //     defaultValue: "",
    //     mandatory: false
    //   },
    //   {
    //     sequenceNo: 5,
    //     questionText: "Have you completed a JMP form for today's work?",
    //     dropdownValues: ["Yes", "N/A"],
    //     defaultValue: "",
    //     mandatory: false
    //   }
    // ]
    setSiteQuestions(questions);
    setSitesLoading(false);
  };

  // Get questions from selected site for timesheet submission


  const setTimesheetQuestionsInfo = async (siteID) => {
    try {
      const res = await fetch(`https://gore-api.futureaccess.com.au/TSAPI/timesheetquestions/${siteID}`);
      if (!res.ok) throw new Error("Failed to fetch submit questions");

      const questions = await res.json();
      console.log("Fetched Questions: ", questions);  // Debug log here
      setSubmitQuestions(questions); // Set in context
      await AsyncStorage.setItem('cachedSubmitQuestions', JSON.stringify(questions)); // ✅ Cache locally for offline use
    } catch (error) {
      console.error("Error fetching submit questions:", error);
    }
  };



  // Load site data from storage when the component mounts.
  useEffect(() => {
    const loadSiteFromStorage = async () => {
      //await removeData('site');
      try {
        setSitesLoading(true);
        const saved_site = await getStorageData('site');
        if (saved_site) {
          setSite(JSON.parse(saved_site));
          setSitesLoading(false);
        }
      } catch (error) {
        console.error('Error loading site from storage:', error);
        setSitesLoading(false);
      }
    };

    loadSiteFromStorage();
  }, []);

  return (
    <SiteContext.Provider
      value={{
        sitesLoading,
        setSitesLoading,
        setSiteInfo,
        setTimesheetQuestionsInfo,
        setSiteQuestionsInfo,
        siteQuestions,
        submitQuestions,
        setSubmitQuestions,
        site,
        setSite,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
};
