import { CommentContext } from "@/context/CommentContext";
import { useContext } from "react";

// Custom hook for easy context usage
export const useComments = () => {
  const context = useContext(CommentContext);

  if (context === undefined) {
    throw new Error("useComments must be used within a TaskProvider");
  }

  return context;
};
