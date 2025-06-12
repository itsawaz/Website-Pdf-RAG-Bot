"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Spotlight } from "@/components/ui/spotlight";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { ChatMessage, TypingIndicator } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { chatAPI, type StatsResponse } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Brain, AlertTriangle, FileText, Globe } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    checkConnection();
    loadStats();
  }, []);
  const checkConnection = async () => {
    try {
      const health = await chatAPI.healthCheck();
      setIsConnected(health.chatbot_ready);
      setError(null);
      
      // If connected, load initial stats
      if (health.chatbot_ready) {
        loadStats();
      }
    } catch (err) {
      setIsConnected(false);
      setError("Failed to connect to the chatbot backend. Make sure the Python backend is running on port 8000.");
      console.error("Connection error:", err);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const statsData = await chatAPI.getStats();
      setStats(statsData);
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleSendMessage = async (messageContent: string) => {
    if (!isConnected) {
      setError("Not connected to backend. Please check the connection.");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setError(null);

    try {
      const response = await chatAPI.sendMessage(messageContent);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setError("Failed to get response from the chatbot. Please try again.");
      console.error("Chat error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessageStream = async (messageContent: string) => {
    if (!isConnected) {
      setError("Not connected to backend. Please check the connection.");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setError(null);

    const botMessageId = (Date.now() + 1).toString();
    let accumulatedContent = "";

    try {
      // Create initial bot message
      const botMessage: Message = {
        id: botMessageId,
        content: "",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);

      // Stream the response
      for await (const chunk of chatAPI.sendMessageStream(messageContent)) {
        accumulatedContent += chunk;
        setMessages((prev) => 
          prev.map(msg => 
            msg.id === botMessageId 
              ? { ...msg, content: accumulatedContent }
              : msg
          )
        );
      }
    } catch (err) {
      setError("Failed to get streaming response from the chatbot. Please try again.");
      console.error("Streaming chat error:", err);
      setIsTyping(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!isConnected) {
      setError("Not connected to backend. Please check the connection.");
      return;
    }

    setError(null);
    
    try {
      const response = await chatAPI.uploadPDF(file);
      
      // Add system message about successful upload
      const systemMessage: Message = {
        id: Date.now().toString(),
        content: `✅ ${response.message}`,
        sender: "bot",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, systemMessage]);
      loadStats(); // Refresh stats
    } catch (err) {
      setError("Failed to upload PDF. Please try again.");
      console.error("Upload error:", err);
    }
  };
  const handleWebsiteAdd = async (url: string) => {
    if (!isConnected) {
      setError("Not connected to backend. Please check the connection.");
      return;
    }

    setError(null);
    
    try {
      const response = await chatAPI.addWebsite(url, 5);
      
      // Add system message about successful website addition
      const systemMessage: Message = {
        id: Date.now().toString(),
        content: `🌐 ${response.message}`,
        sender: "bot",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, systemMessage]);
      loadStats(); // Refresh stats
    } catch (err) {
      setError("Failed to add website. Please check the URL and try again.");
      console.error("Website error:", err);
    }
  };

  const handleClearKnowledgeBase = async () => {
    if (!isConnected) {
      setError("Not connected to backend. Please check the connection.");
      return;
    }

    setError(null);
    
    try {
      const response = await chatAPI.clearKnowledgeBase();
      
      // Add system message about successful deletion
      const systemMessage: Message = {
        id: Date.now().toString(),
        content: `🗑️ ${response.message}`,
        sender: "bot",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, systemMessage]);
      loadStats(); // Refresh stats
    } catch (err) {
      setError("Failed to clear knowledge base. Please try again.");
      console.error("Clear knowledge base error:", err);
    }
  };

  const handleDeleteBySource = async (sourceType: string) => {
    if (!isConnected) {
      setError("Not connected to backend. Please check the connection.");
      return;
    }

    setError(null);
    
    try {
      const response = await chatAPI.deleteBySource(sourceType);
      
      // Add system message about successful deletion
      const systemMessage: Message = {
        id: Date.now().toString(),
        content: `🗑️ ${response.message}`,
        sender: "bot",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, systemMessage]);
      loadStats(); // Refresh stats
    } catch (err) {
      setError(`Failed to delete ${sourceType} documents. Please try again.`);
      console.error("Delete by source error:", err);
    }
  };

  const handleToggleStreaming = () => {
    setStreamingEnabled(!streamingEnabled);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <Spotlight className="top-40 left-0 md:left-60 md:-top-20" fill="blue" />
      <BackgroundBeams className="opacity-30" />
      
      <div className="relative z-10 flex h-screen">        {/* Sidebar */}
        <Sidebar 
          stats={stats} 
          onRefreshStats={loadStats}
          onClearKnowledgeBase={handleClearKnowledgeBase}
          onDeleteBySource={handleDeleteBySource}
          loading={loading}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b border-border bg-card/50 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">PDF & wEBSITE RAG Chatbot</h1>
                  <p className="text-sm text-muted-foreground">
                    Powered by GEMINI Model
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-green-500" : "bg-red-500"
                )} />
                <span className="text-sm text-muted-foreground">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-4 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </motion.div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">            {messages.length === 0 && !error && isConnected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <Brain className="w-16 h-16 mx-auto mb-4 text-primary/50" />
                <h2 className="text-xl font-semibold mb-2">Welcome to Granite RAG</h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Upload PDFs or add websites to build your knowledge base, then start asking questions!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm">
                  <div className="bg-secondary/30 p-4 rounded-lg">
                    <FileText className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="font-medium">Upload PDFs</p>
                    <p className="text-muted-foreground text-xs">Drag & drop PDF files</p>
                  </div>
                  <div className="bg-secondary/30 p-4 rounded-lg">
                    <Globe className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="font-medium">Add Websites</p>
                    <p className="text-muted-foreground text-xs">Click the globe icon</p>
                  </div>
                  <div className="bg-secondary/30 p-4 rounded-lg">
                    <Brain className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="font-medium">Ask Questions</p>
                    <p className="text-muted-foreground text-xs">Chat about your content</p>
                  </div>
                </div>
              </motion.div>
            )}

            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isLatest={message.id === messages[messages.length - 1]?.id}
              />
            ))}

            <AnimatePresence>
              {isTyping && <TypingIndicator />}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>          {/* Input */}
          <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
            <ChatInput
              onSendMessage={handleSendMessage}
              onSendMessageStream={handleSendMessageStream}
              onFileUpload={handleFileUpload}
              onWebsiteAdd={handleWebsiteAdd}
              streamingEnabled={streamingEnabled}
              onToggleStreaming={handleToggleStreaming}
              disabled={!isConnected}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
