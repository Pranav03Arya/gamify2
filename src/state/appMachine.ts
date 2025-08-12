// src/state/appMachine.ts
import { createMachine } from "xstate";
export const appMachine = createMachine({
  id: "sim",
  initial: "home",
  states: {
    home: {
      on: {
        START_GUIDED: "guided",
        START_EXPLORE: "explore",
      },
    },
    explore: {
      on: {
        OPEN_GUIDED: "guided",
        OPEN_DASHBOARD: "dashboard",
        GO_HOME: "home",
      },
    },
    guided: {
      on: {
        COMPLETE_GUIDED: "dashboard",
        EXIT_GUIDED: "explore",
      },
    },
    dashboard: {
      on: {
        ADJUST_FACTORS: "dashboard",
        TOGGLE_PREFERRED: "dashboard",
        RESTART: "home",
      },
    },
  },
});
