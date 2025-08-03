import { CommentProvider } from "@/context/CommentContext";
import NetInfoProvider from "@/context/NetInfoProvider";
import { TaskProvider } from "@/context/TaskContext";
import { UserProvider } from "@/context/UserContext";
import { SiteProvider } from "@/context/SiteContext";


function ContextProviders({ children }) {
  return (
    <UserProvider>
      <SiteProvider>
        <TaskProvider>
        <NetInfoProvider>
          <CommentProvider>
            {children}
          </CommentProvider>
        </NetInfoProvider>
        </TaskProvider>
      </SiteProvider>
    </UserProvider>
  );
}

export default ContextProviders;
