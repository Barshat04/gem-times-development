import React, { useEffect } from "react";
import { Redirect } from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { operatorsStore$, questionsStore$, siteDetailsStore$, timeEntriesStore$ } from "@/observables";
import { syncState, when } from "@legendapp/state";
import { useNetInfo } from "@react-native-community/netinfo";
import { getStorageData } from "@/asyncStorage";

function Index() {
  return (
    <Redirect href="/login" />
  );
}

export default Index;
