import React, { createContext, useContext, useState } from "react";

// Create the context
export const CommentContext = createContext();

// Create a provider
export const CommentProvider = ({ children }) => {
  const [comments, setComments] = useState("");

  const updateComments = (newComments) => {
    setComments(newComments);
  };

  return (
    <CommentContext.Provider value={{ comments, updateComments }}>
      {children}
    </CommentContext.Provider>
  );
};
