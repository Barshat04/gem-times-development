import { observable } from "@legendapp/state";
import { configureSynced, synced } from "@legendapp/state/sync";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { observablePersistAsyncStorage } from "@legendapp/state/persist-plugins/async-storage";
import { getStorageData } from "@/asyncStorage";
import { syncedCrud } from '@legendapp/state/sync-plugins/crud'

// Setup a configured persist options
const mySynced = configureSynced(synced, {
  persist: {
    plugin: observablePersistAsyncStorage({
      AsyncStorage,
    }),
    retrySync: true,
  },
  retry: {
    infinite: true,
  },
});

// Create a global observable for the Todos
let nextTimeEntryId = 0;
const store$ = observable({
  timeEntries: mySynced({
    initial: [],
    persist: {
      name: "time-entries",
    },
  }),
  addTimeEntry: (data) => {
    const timeEntry = {
      id: nextTimeEntryId++,
      ...data,
    };

    store$.timeEntries.set((prev) => [...prev, timeEntry]);
  },
});

// const timeEntryStore$ = observable({
//   timeEntries: syncedCrud({
//     get: getProfile,
//     create: createProfile,
//     update: updateProfile,
//     delete: deleteProfile,
//     persist: {
//       plugin: observablePersistAsyncStorage({
//         AsyncStorage,
//       }),
//       name: "time-entries",
//       retrySync: true,
//     },
//     retry: {
//       infinite: true,
//     },
//   })
// });

const siteDetailsStore$ = observable({
  siteDetails: mySynced({
    initial: {},
    get: async () => {
      const userData = await getStorageData("userData");
      const parsedSiteID = JSON.parse(userData).siteID;

      const res = await fetch(
        `https://gemtimes-hddkabegcge5ckdc.centralus-01.azurewebsites.net/api/sites/${parsedSiteID}`
      );

      const data = await res.json();
      return data;
    },
    persist: {
      name: "site-details",
    },
  }),
});

const operatorsStore$ = observable({
  operators: mySynced({
    initial: [],
    get: async () => {
      const userData = await getStorageData("userData");
      const parsedSiteID = JSON.parse(userData).siteID;

      const res = await fetch(
        `https://gemtimes-hddkabegcge5ckdc.centralus-01.azurewebsites.net/api/sites/${parsedSiteID}/operators`
      );

      const data = await res.json();
      return data;
    },
    persist: {
      name: "operators",
    },
  }),
});

const questionsStore$ = observable({
  questions: mySynced({
    initial: [],
    get: async () => {
      const userData = await getStorageData("userData");
      const parsedSiteID = JSON.parse(userData).siteID;

      const res = await fetch(
        `https://gemtimes-hddkabegcge5ckdc.centralus-01.azurewebsites.net/api/questions/${parsedSiteID}`
      );

      const data = await res.json();
      return data;
    },
    persist: {
      name: "questions",
    },
  }),
});

export { store$, siteDetailsStore$, operatorsStore$, questionsStore$ };
