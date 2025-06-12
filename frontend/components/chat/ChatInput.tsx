"use client";
import React, { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip, Globe, Zap, ZapOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDropzone } from "react-dropzone";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onSendMessageStream: (message: string) => void;
  onFileUpload: (file: File) => void;
  onWebsiteAdd: (url: string) => void;
  disabled?: boolean;
  streamingEnabled?: boolean;
  onToggleStreaming?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onSendMessageStream,
  onFileUpload,
  onWebsiteAdd,
  disabled = false,
  streamingEnabled = true,
  onToggleStreaming,
}) => {
  const [message, setMessage] = useState("");
  const [showWebInput, setShowWebInput] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file && file.type === "application/pdf") {
        onFileUpload(file);
      }
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    disabled,
  });
  const handleSend = () => {
    if (message.trim() && !disabled) {
      if (streamingEnabled) {
        onSendMessageStream(message.trim());
      } else {
        onSendMessage(message.trim());
      }
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleWebsiteSubmit = () => {
    if (websiteUrl.trim() && !disabled) {
      onWebsiteAdd(websiteUrl.trim());
      setWebsiteUrl("");
      setShowWebInput(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  return (
    <div className="space-y-4">
      {/* Website URL Input */}
      {showWebInput && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex gap-2"
        >
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="Enter website URL..."
            className="flex-1 px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={disabled}
            onKeyPress={(e) => e.key === "Enter" && handleWebsiteSubmit()}
          />
          <button
            onClick={handleWebsiteSubmit}
            disabled={disabled || !websiteUrl.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
          <button
            onClick={() => setShowWebInput(false)}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80"
          >
            Cancel
          </button>
        </motion.div>
      )}

      {/* File Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-4 transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-center text-primary">Drop PDF file here...</p>
        ) : (
          <p className="text-center text-muted-foreground text-sm">
            Drag & drop a PDF file here, or click to select
          </p>
        )}
      </div>

      {/* Chat Input */}
      <div className="relative">        <div className="flex items-end gap-2 p-2 bg-secondary/50 rounded-lg border border-border">
          <div className="flex gap-1">
            <button
              onClick={() => setShowWebInput(!showWebInput)}
              disabled={disabled}
              className={cn(
                "p-2 rounded-md hover:bg-secondary transition-colors",
                showWebInput && "bg-primary text-primary-foreground",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              title="Add website"
            >
              <Globe className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => {
                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                input?.click();
              }}
              disabled={disabled}
              className={cn(
                "p-2 rounded-md hover:bg-secondary transition-colors",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              title="Upload PDF"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {onToggleStreaming && (
              <button
                onClick={onToggleStreaming}
                disabled={disabled}
                className={cn(
                  "p-2 rounded-md hover:bg-secondary transition-colors",
                  streamingEnabled && "bg-green-600 text-white",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                title={streamingEnabled ? "Disable streaming" : "Enable streaming"}
              >
                {streamingEnabled ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}
          </div>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your documents..."
            className="flex-1 min-h-[40px] max-h-[120px] px-3 py-2 bg-transparent border-none resize-none focus:outline-none placeholder:text-muted-foreground"
            disabled={disabled}
            rows={1}
          />

          <button
            onClick={handleSend}
            disabled={disabled || !message.trim()}
            className={cn(
              "p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/80 transition-colors",
              (disabled || !message.trim()) && "opacity-50 cursor-not-allowed"
            )}
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
