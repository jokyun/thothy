import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { ArtifactMarkdownV3 } from "@opencanvas/shared/types";
import "@blocknote/core/fonts/inter.css";
import {
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import { isArtifactMarkdownContent } from "@opencanvas/shared/utils/artifacts";
import { CopyText } from "./components/CopyText";
import { getArtifactContent } from "@opencanvas/shared/utils/artifacts";
import { useGraphContext } from "../../contexts/GraphContext";
import React from "react";
import { TooltipIconButton } from "../ui/assistant-ui/tooltip-icon-button";
import { Eye, EyeOff, LineChart as LineChartIcon, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { Textarea } from "../ui/textarea";
import { cn } from "../../lib/utils";
import { ChartRenderer } from "../charts/ChartRenderer";
import { useToast } from "../../hooks/use-toast";

const cleanText = (text: string) => {
  return text.replaceAll("\\\n", "\n");
};

function ViewRawText({
  isRawView,
  setIsRawView,
}: {
  isRawView: boolean;
  setIsRawView: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <TooltipIconButton
        tooltip={`View ${isRawView ? "rendered" : "raw"} markdown`}
        variant="outline"
        delayduration={400}
        onClick={() => setIsRawView((p) => !p)}
      >
        {isRawView ? (
          <EyeOff className="w-5 h-5 text-gray-600" />
        ) : (
          <Eye className="w-5 h-5 text-gray-600" />
        )}
      </TooltipIconButton>
    </motion.div>
  );
}

function CopyTextSimple({ text }: { text: string }) {
  const { toast } = useToast();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <TooltipIconButton
        tooltip="Copy"
        variant="outline"
        className="transition-colors"
        delayduration={400}
        onClick={() => {
          try {
            navigator.clipboard.writeText(text).then(() => {
              toast({
                title: "Copied to clipboard",
                description: "The content has been copied.",
                duration: 5000,
              });
            });
          } catch (_) {
            toast({
              title: "Copy error",
              description:
                "Failed to copy the content. Please try again.",
              duration: 5000,
            });
          }
        }}
      >
        <Copy className="w-5 h-5 text-gray-600" />
      </TooltipIconButton>
    </motion.div>
  );
}

export interface TextRendererProps {
  isEditing: boolean;
  isHovering: boolean;
  isInputVisible: boolean;
}

export function TextRendererComponent(props: TextRendererProps) {
  const editor = useCreateBlockNote({});
  const { graphData } = useGraphContext();
  const {
    artifact,
    isStreaming,
    updateRenderedArtifactRequired,
    firstTokenReceived,
    setArtifact,
    setSelectedBlocks,
    setUpdateRenderedArtifactRequired,
  } = graphData;

  const [rawMarkdown, setRawMarkdown] = useState("");
  const [isRawView, setIsRawView] = useState(false);
  const [isChartView, setIsChartView] = useState(false);
  const [manuallyUpdatingArtifact, setManuallyUpdatingArtifact] =
    useState(false);

  useEffect(() => {
    const selectedText = editor.getSelectedText();
    const selection = editor.getSelection();

    if (selectedText && selection) {
      if (!artifact) {
        console.error("Artifact not found");
        return;
      }

      const currentBlockIdx = artifact.currentIndex;
      const currentContent = artifact.contents.find(
        (c) => c.index === currentBlockIdx
      );
      if (!currentContent) {
        console.error("Current content not found");
        return;
      }
      if (!isArtifactMarkdownContent(currentContent)) {
        console.error("Current content is not markdown");
        return;
      }

      (async () => {
        const [markdownBlock, fullMarkdown] = await Promise.all([
          editor.blocksToMarkdownLossy(selection.blocks),
          editor.blocksToMarkdownLossy(editor.document),
        ]);
        setSelectedBlocks({
          fullMarkdown: cleanText(fullMarkdown),
          markdownBlock: cleanText(markdownBlock),
          selectedText: cleanText(selectedText),
        });
      })();
    }
  }, [editor.getSelectedText()]);

  useEffect(() => {
    if (!props.isInputVisible) {
      setSelectedBlocks(undefined);
    }
  }, [props.isInputVisible]);

  useEffect(() => {
    if (!artifact) {
      return;
    }
    if (
      !isStreaming &&
      !manuallyUpdatingArtifact &&
      !updateRenderedArtifactRequired
    ) {
      return;
    }

    try {
      const currentIndex = artifact.currentIndex;
      const currentContent = artifact.contents.find(
        (c) => c.index === currentIndex && c.type === "text"
      ) as ArtifactMarkdownV3 | undefined;
      if (!currentContent) return;

      // Blocks are not found in the artifact, so once streaming is done we should update the artifact state with the blocks
      (async () => {
        const markdownAsBlocks = await editor.tryParseMarkdownToBlocks(
          currentContent.fullMarkdown
        );
        editor.replaceBlocks(editor.document, markdownAsBlocks);
        setUpdateRenderedArtifactRequired(false);
        setManuallyUpdatingArtifact(false);
      })();
    } finally {
      setManuallyUpdatingArtifact(false);
      setUpdateRenderedArtifactRequired(false);
    }
  }, [artifact, updateRenderedArtifactRequired]);

  useEffect(() => {
    if (isRawView) {
      editor.blocksToMarkdownLossy(editor.document).then(setRawMarkdown);
    } else if (!isRawView && rawMarkdown) {
      try {
        (async () => {
          setManuallyUpdatingArtifact(true);
          const markdownAsBlocks =
            await editor.tryParseMarkdownToBlocks(rawMarkdown);
          editor.replaceBlocks(editor.document, markdownAsBlocks);
          setManuallyUpdatingArtifact(false);
        })();
      } catch (_) {
        setManuallyUpdatingArtifact(false);
      }
    }
  }, [isRawView, editor]);

  const isComposition = useRef(false);

  const onChange = async () => {
    if (
      isStreaming ||
      manuallyUpdatingArtifact ||
      updateRenderedArtifactRequired
    )
      return;

    const fullMarkdown = await editor.blocksToMarkdownLossy(editor.document);
    setArtifact((prev) => {
      if (!prev) {
        return {
          currentIndex: 1,
          contents: [
            {
              index: 1,
              fullMarkdown: fullMarkdown,
              title: "Untitled",
              type: "text",
            },
          ],
        };
      } else {
        return {
          ...prev,
          contents: prev.contents.map((c) => {
            if (c.index === prev.currentIndex) {
              return {
                ...c,
                fullMarkdown: fullMarkdown,
              };
            }
            return c;
          }),
        };
      }
    });
  };

  const onChangeRawMarkdown = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawMarkdown(e.target.value);
  };

  const currentContent = artifact?.contents.find(
    (c) => c.index === artifact.currentIndex && c.type === "text"
  ) as ArtifactMarkdownV3 | undefined;

  function ViewChartToggle({
    isChartView,
    setIsChartView,
  }: {
    isChartView: boolean;
    setIsChartView: Dispatch<SetStateAction<boolean>>;
  }) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="ml-2"
      >
        <TooltipIconButton
          tooltip={`${isChartView ? 'Hide' : 'Show'} charts`}
          variant="outline"
          delayduration={400}
          onClick={() => setIsChartView((p) => !p)}
        >
          <LineChartIcon className="w-5 h-5 text-gray-600" />
        </TooltipIconButton>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex justify-end space-x-2 mb-2">
        <ViewRawText isRawView={isRawView} setIsRawView={setIsRawView} />
        <ViewChartToggle isChartView={isChartView} setIsChartView={setIsChartView} />
        <CopyTextSimple
          text={
            rawMarkdown || (currentContent?.fullMarkdown || "")
          }
        />
      </div>
      
      {isChartView && currentContent && (
        <div className="mb-4 border-t pt-4">
          <h3 className="text-lg font-semibold mb-4">Slides & Visualizations</h3>
          <ChartRenderer markdown={currentContent.fullMarkdown} />
        </div>
      )}

      {isRawView ? (
        <Textarea
          className={cn(
            "bg-gray-900 text-gray-100 font-mono text-base whitespace-pre-wrap h-full min-h-[500px] p-4 resize-none",
            isChartView && "h-[50vh]"
          )}
          value={rawMarkdown}
          onChange={onChangeRawMarkdown}
        />
      ) : (
        <div 
          className={cn(
            "overflow-hidden border border-input rounded-md bg-background w-full overflow-y-auto",
            isChartView && "max-h-[50vh]"
          )}
        >
          <BlockNoteView
            editor={editor}
            onChange={onChange}
            theme="light"
            editable={!isStreaming || props.isEditing || !manuallyUpdatingArtifact}
          />
        </div>
      )}
    </div>
  );
}

export const TextRenderer = React.memo(TextRendererComponent);
