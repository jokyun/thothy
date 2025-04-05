import React from "react";
import { useQueryParams } from "./hooks/use-query-params";
import { INBOX_PARAM, VIEW_STATE_THREAD_QUERY_PARAM } from "./constants";
import { ThreadStatusWithAll } from "./types";
import { AgentInboxView } from "./inbox-view";
import { ThreadView } from "./thread-view";
import ErrorBoundary from "@/components/error-boundary";

export function AgentInbox<
  ThreadValues extends Record<string, any> = Record<string, any>,
>() {
  const { searchParams, updateQueryParams, getSearchParam } = useQueryParams();
  const [selectedInbox, setSelectedInbox] =
    React.useState<ThreadStatusWithAll>("interrupted");
  const [isStateViewOpen, setIsStateViewOpen] = React.useState(false);
  const [selectedThreadIdParam, setSelectedThreadIdParam] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Update state from URL parameters
    const threadIdParam = searchParams.get(VIEW_STATE_THREAD_QUERY_PARAM);
    setSelectedThreadIdParam(threadIdParam);
    setIsStateViewOpen(!!threadIdParam);
  }, [searchParams]);

  React.useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const currentInbox = getSearchParam(INBOX_PARAM) as
        | ThreadStatusWithAll
        | undefined;
      if (!currentInbox) {
        // Set default inbox if none selected
        updateQueryParams(INBOX_PARAM, selectedInbox);
      } else {
        setSelectedInbox(currentInbox);
      }
    } catch (e) {
      console.error("Error updating query params & setting inbox", e);
    }
  }, [searchParams, getSearchParam, updateQueryParams, selectedInbox]);

  // Render appropriate component based on state
  return (
    <ErrorBoundary>
      {isStateViewOpen && selectedThreadIdParam ? (
        <ThreadView threadId={selectedThreadIdParam} />
      ) : (
        <AgentInboxView<ThreadValues> />
      )}
    </ErrorBoundary>
  );
}
