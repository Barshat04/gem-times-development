import { createContext, useState, useEffect } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { getStorageData, storeData, removeData } from '@/asyncStorage'; // Assuming removeData exists or adding it

// Define how long credentials are valid (e.g., 24 hours in milliseconds)
const EXPIRY_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Create the context
export const UserContext = createContext({
  userData: null,
  isAuthenticated: false,
  isLoading: true, // Renamed from initial 'isLoading' to be more descriptive for auth loading
  setUserData: async () => { }, // Now internal, but exposed for clarity if needed
  setIsAuthenticated: () => { }, // Now internal
  login: async () => false,
  logout: () => { }, // Added logout to context value
});

export const UserProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserDataState] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Tracks if initial auth check is ongoing
  const [error, setError] = useState(null); // For context-level errors
  const { isConnected } = useNetInfo();

  // Helper function to update and store user data with expiry
  const updateAndStoreUserData = async (data) => {
    try {
      const dataToStore = {
        ...data,
        lastAuthTime: new Date().toISOString(), // Update last auth time
        expiry: Date.now() + EXPIRY_DURATION, // Set new expiry timestamp
      };
      setUserDataState(dataToStore);
      await storeData('userData', JSON.stringify(dataToStore)); // Store as string
      setIsAuthenticated(true);
      setError(null); // Clear any previous errors on successful update
      return dataToStore;
    } catch (err) {
      console.error('Error saving user data with expiry:', err);
      setError('Failed to save user data locally.');
      setIsAuthenticated(false);
      return null;
    }
  };

  // Load user data from async storage on mount and check for expiry
  const loadUserData = async () => {
    try {
      setIsLoading(true); // Start loading state
      const stored = await getStorageData('userData');

      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.expiry && Date.now() < parsed.expiry) {
          // Data is valid and not expired
          setUserDataState(parsed);
          setIsAuthenticated(true);
          console.log("User data loaded from storage and is valid.");
        } else {
          // Data is expired or malformed, clear it
          console.log("Stored user data expired or invalid. Logging out.");
          await logout(false); // Call internal logout without triggering network call or router redirect
          setError("Your session has expired. Please log in again.");
        }
      } else {
        console.log("No user data found in storage.");
        setIsAuthenticated(false);
        setUserDataState(null);
      }
    } catch (err) {
      console.error('Error loading user data from storage:', err);
      setError('Failed to load local session.');
      setIsAuthenticated(false);
      setUserDataState(null);
    } finally {
      setIsLoading(false); // End loading state
    }
  };

  // Real login using your backend API
  const login = async ({ siteID, userName, pin }) => {
    setError(null); // Clear any previous errors
    setIsLoading(true); // Start loading for login attempt

    try {
      if (!isConnected) {
        setError("No internet connection. Please connect to log in.");
        setIsLoading(false);
        return false;
      }

      const response = await fetch("https://gore-api.futureaccess.com.au/TSAPI/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteID, userName, pin }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || "Login failed. Please check your credentials.";
        console.error("Login failed:", response.status, errorMessage);
        setError(errorMessage);
        setIsAuthenticated(false);
        setIsLoading(false);
        return false;
      }

      const data = await response.json();

      const userFromDB = {
        siteID,
        userID: data.user.userID,
        userName: data.user.userName,
        displayName: data.user.displayName,
        // IMPORTANT: Storing PIN here is highly discouraged in production due to security risks.
        // Instead, the backend should return an authentication token (e.g., JWT) that you store.
        // For demonstration, leaving it as is, but seriously consider removing it.
        pin,
        timeEntryType: data.user.timeEntryType,
      };

      // Use the helper to store and update state with expiry
      const storedUser = await updateAndStoreUserData(userFromDB);
      setIsLoading(false);
      return storedUser; // Return the full user object including expiry
    } catch (err) {
      console.error("Login API error:", err);
      setError("An unexpected error occurred during login.");
      setIsAuthenticated(false);
      setIsLoading(false);
      return false;
    }
  };

  // Logout function
  // `clearStorage` parameter allows controlled clearing without always removing data (e.g., if session just expired)
  const logout = async (clearStorage = true) => {
    setIsAuthenticated(false);
    setUserDataState(null);
    if (clearStorage) {
      try {
        await removeData('userData');
        console.log("User data cleared from storage.");
      } catch (err) {
        console.error("Error removing user data from storage:", err);
      }
    }
    setError(null); // Clear any errors on logout
  };

  // Effect to load user data when the provider mounts
  useEffect(() => {
    loadUserData();
  }, []); // Empty dependency array ensures it runs only once on mount

  return (
    <UserContext.Provider value={{
      isAuthenticated,
      userData,
      isLoading, // isLoading now represents the overall auth check status
      error,
      login,
      logout,
      // `setUserData` and `setIsAuthenticated` are now managed internally by login/loadUserData
      // If you need to expose them for specific use cases (e.g., profile updates), do so carefully.
    }}>
      {children}
    </UserContext.Provider>
  );
};



/* ***SOURCE CODE VERSION BELOW*** */

/*
import { createContext, useState, useEffect, useContext } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { getStorageData, storeData } from '@/asyncStorage';
import { useRouter } from "expo-router";

// Create the context with a default value
export const UserContext = createContext({
  userData: null,
  isAuthenticated: false,
  isLoading: true,
  setUserData: async () => {},
  setIsAuthenticated: () => {},
  login: async () => false,
});

export const UserProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserDataState] = useState(null);
  const [isLoading, setIsLoading ] = useState(true);
  const [error, setError] = useState(null);
  const { isConnected } = useNetInfo();

  // Load user data from storage.
  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const userData = await getStorageData('userData');
      if (userData) {
        setUserDataState(JSON.parse(userData));
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error('Error loading user data:', error);
    }
  };

  // Login to the app via local check or by API auth.
  const login = async (credentials) => {
    try {
        // Check for stored data against credentials supplied.
            // if the stored match the creds supplied allow a login
        
        if(!userData || (credentials.pin !== userData?.pin)){
          // Call the API if pins dont match, no userData stored, or last auth time > 3 days ago
        }

        //TODO: remove this mock data and timer!
        await setUserData({
          siteID: "DevTeam2Neal",
          userID: "358158",
          userName: "cjones52",
          displayName: "Chris Jones",
          pin: "8191",
          lastLogin: new Date().toISOString(),
          lastAuthTime: new Date().toISOString(),
          timeEntryType: "C"
      });
        setIsAuthenticated(true);
        return true;
    } catch (err) {
        console.error(err);
        setIsAuthenticated(false);
        return false;
    }
  };

  const tryAuthTimer = async () => {
     // Implement a timer to run once per hour and call login in the background.
  };

  // Save user data to local storage and set the state.
  const setUserData = async (data) => {
    try {
      setUserDataState(data);
      await storeData('userData', data);
    } catch (error) {
      console.error('Error saving user data', error);
    }
  };

  // Log out the user
  const logout = () => {
    setIsAuthenticated(false);
  }

  // On render, try and load the user data.
  useEffect(() => {
    loadUserData();
  }, []);

  return (
    <UserContext.Provider value={{
      isAuthenticated,
      setIsAuthenticated,
      userData, 
      setUserData,
      isLoading,
      setIsLoading,
      error,
      setError,
      login,
      logout
    }}>
      {children}
    </UserContext.Provider>
  );
}

*/