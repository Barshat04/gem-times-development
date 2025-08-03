import { useContext } from "react";
import { TaskContext } from "@/context/TaskContext";

// Custom hook for easy context usage
export const useTasks = () => {
  const context = useContext(TaskContext);

  if (context === undefined) {
    throw new Error("useTasks must be used within a TaskProvider");
  }

  return context;
};
