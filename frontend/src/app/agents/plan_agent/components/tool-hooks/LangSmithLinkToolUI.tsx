import { ExternalLink } from "lucide-react";
import { LangSmithSVG } from "../icons/langsmith";
import { TooltipIconButton } from "../ui/assistant-ui/tooltip-icon-button";
import { useAssistantToolUI } from "@assistant-ui/react";
import { useCallback, useMemo } from "react";

export const useLangSmithLinkToolUI = () => {
  const renderCallback = useCallback((input) => {
    if (!input || !input.args || !input.args.sharedRunURL) {
      return null;
    }
    
    // URL이 유효한지 확인
    const isValidURL = typeof input.args.sharedRunURL === 'string' && 
      (input.args.sharedRunURL.startsWith('https://smith.langchain.com/') ||
       input.args.sharedRunURL.startsWith('https://smith.langchain.com/public/'));
    
    if (!isValidURL) {
      console.warn('Invalid LangSmith URL:', input.args.sharedRunURL);
      return null;
    }
    
    return (
      <TooltipIconButton
        tooltip="View run in LangSmith"
        variant="ghost"
        className="transition-colors w-4 h-3 ml-3 mt-2 mb-[-8px]"
        delayduration={400}
        onClick={() => {
          try {
            window.open(input.args.sharedRunURL, "_blank");
          } catch (error) {
            console.error('Error opening LangSmith URL:', error);
          }
        }}
      >
        <span className="flex flex-row items-center gap-1 w-11 h-7">
          <ExternalLink />
          <LangSmithSVG className="text-[#CA632B] hover:text-[#CA632B]/95" />
        </span>
      </TooltipIconButton>
    );
  }, []);

  return useAssistantToolUI({
    toolName: "langsmith_tool_ui",
    render: renderCallback,
  });
};
