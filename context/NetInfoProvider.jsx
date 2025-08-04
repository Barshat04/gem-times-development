


// NetInfoProvider.jsx
import React, { useEffect, useState, useContext, createContext, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncQueue } from '@/utils/syncManager';

const NetInfoContext = createContext();

export const useNetInfo = () => useContext(NetInfoContext);

const NetInfoProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const isInitialLoad = useRef(true);
  const lastKnownState = useRef(null);
  const isSyncing = useRef(false); // Prevent concurrent syncs

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      console.log("[NetInfo] Network State Changed:", state);

      const wasConnected = lastKnownState.current?.isConnected;
      const isCurrentlyConnected = state.isConnected;

      setIsConnected(isCurrentlyConnected);

      // Trigger sync only if conditions are met AND a sync is not already in progress
      if (isCurrentlyConnected && (!wasConnected || isInitialLoad.current)) {
        if (!isSyncing.current) {
          isSyncing.current = true; // Mark sync as in progress
          try {
            if (isCurrentlyConnected && !wasConnected) {
              console.log("[NetInfo] Device just came online. Syncing queued items...");
            } else if (isInitialLoad.current && isCurrentlyConnected) {
              console.log("[NetInfo] Initial app load & device is online. Syncing queued items...");
            }
            await syncQueue(); // AWAIT the syncQueue call
          } catch (error) {
            console.error("[NetInfoProvider] Error during sync:", error);
          } finally {
            isSyncing.current = false; // Mark sync as complete (whether success or fail)
          }
        } else {
          console.log("[NetInfo] Sync already in progress, ignoring new trigger.");
        }
      }

      lastKnownState.current = state;
      isInitialLoad.current = false;
    });

    // Initial check and sync on component mount
    const initialCheck = async () => {
      try {
        const state = await NetInfo.fetch();
        if (state.isConnected && !isSyncing.current) {
          console.log("[NetInfo] Initial connection check: Online. Syncing queued items...");
          isSyncing.current = true;
          try {
            await syncQueue();
          } catch (error) {
            console.error("[NetInfoProvider] Error during initial sync:", error);
          } finally {
            isSyncing.current = false;
          }
        }
      } catch (error) {
        console.error("[NetInfoProvider] Error during initial network check:", error);
      }
    };
    
    initialCheck();

    return () => {
      console.log("[NetInfo] Unsubscribing from network state changes.");
      unsubscribe();
    };
  }, []);

  return (
    <NetInfoContext.Provider value={{ isConnected }}>
      {children}
    </NetInfoContext.Provider>
  );
};

export default NetInfoProvider;



/*
import { createContext, useState, useEffect } from "react";
import NetInfo from '@react-native-community/netinfo';

export const NetInfoContext = createContext({
  isConnected: false,
});

function NetInfoProvider({ children }) {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {

    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected);
    });

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <NetInfoContext.Provider
      value={{
        isConnected,
      }}
    >
      {children}
    </NetInfoContext.Provider>
  );
}

export default NetInfoProvider;

*/