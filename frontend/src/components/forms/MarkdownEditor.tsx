import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { TextArea, Text, Flex, Box, Card, Tabs } from "@radix-ui/themes";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  rows?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your description...",
  error = false,
  rows = 4,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  return (
    <Card className="overflow-hidden pt-1">
      {/* Tab Headers */}
      <Tabs.Root
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "write" | "preview")}
      >
        <Tabs.List>
          <Tabs.Trigger value="write">Write</Tabs.Trigger>
          <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="write">
          <Box className="pt-2">
            <TextArea
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={error ? "border-red-500" : ""}
              rows={rows}
              style={{ border: "none", boxShadow: "none" }}
            />
            <Text size="1" color="gray" className="mt-2 block">
              Supports Markdown: **bold**, *italic*, [link](url), ![image](url)
            </Text>
          </Box>
        </Tabs.Content>
        <Tabs.Content value="preview">
          <Box
            className="p-2 min-h-[120px] prose prose-sm max-w-none"
            style={{ minHeight: `${rows * 24 + 32}px` }}
          >
            {value ? (
              <ReactMarkdown
                components={{
                  img: ({ node, ...props }) => (
                    <img
                      className="my-4 w-full h-auto rounded-xl mx-auto"
                      {...props}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        target.insertAdjacentHTML(
                          "afterend",
                          '<span style="color: #ef4444; font-size: 12px;">⚠ Image failed to load</span>'
                        );
                      }}
                    />
                  ),
                  a: ({ node, ...props }) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#7c3aed" }}
                    />
                  ),
                }}
              >
                {value}
              </ReactMarkdown>
            ) : (
              <Text color="gray" size="2">
                Nothing to preview yet...
              </Text>
            )}
          </Box>
        </Tabs.Content>
      </Tabs.Root>
    </Card>
  );
}
