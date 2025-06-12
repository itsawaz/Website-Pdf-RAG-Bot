"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
  isLatest?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLatest }) => {
  const isBot = message.sender === "bot";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-3 p-4 rounded-lg",
        isBot ? "bg-secondary/50" : "bg-primary/10",
        isLatest && "message-appear"
      )}
    >
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isBot ? "bg-primary" : "bg-secondary"
      )}>
        {isBot ? (
          <Bot className="w-4 h-4 text-primary-foreground" />
        ) : (
          <User className="w-4 h-4 text-secondary-foreground" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm text-muted-foreground mb-1">
          {isBot ? "Granite AI" : "You"}
          <span className="ml-2 text-xs">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>
          <div className="prose prose-invert max-w-none">
          {isBot ? (
            <ReactMarkdown
              components={{
                code({ children, className, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const isInline = !match;
                  
                  if (isInline) {
                    return (
                      <code className="bg-secondary px-1 py-0.5 rounded text-sm" {...props}>
                        {children}
                      </code>
                    );
                  }
                    return (
                    <SyntaxHighlighter
                      style={oneDark as any}
                      language={match[1]}
                      PreTag="div"
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <p className="text-foreground">{message.content}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const TypingIndicator: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex gap-3 p-4 rounded-lg bg-secondary/50"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
        <Bot className="w-4 h-4 text-primary-foreground" />
      </div>
      
      <div className="flex-1">
        <div className="text-sm text-muted-foreground mb-1">
          Granite AI
        </div>
        <div className="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </motion.div>
  );
};
