"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Globe, Database, Trash2, Eye, EyeOff, CheckSquare, Square, X, Brain, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentItem, chatAPI } from "@/lib/api";

interface KnowledgeManagerProps {
  onKnowledgeDeleted: () => void;
  onClose: () => void;
}

export const KnowledgeManager: React.FC<KnowledgeManagerProps> = ({
  onKnowledgeDeleted,
  onClose,
}) => {  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [groupedDocuments, setGroupedDocuments] = useState<Record<string, DocumentItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grouped" | "list">("grouped");

  useEffect(() => {
    loadKnowledge();
  }, []);

  const loadKnowledge = async () => {    try {
      setLoading(true);
      setError(null);
      const response = await chatAPI.getDocuments();
      setDocuments(response.documents);
      setGroupedDocuments(response.grouped_documents);
      
      // Auto-expand sources that have documents
      const sourcesWithDocs = Object.keys(response.grouped_documents);
      setExpandedSources(new Set(sourcesWithDocs.slice(0, 3))); // Expand first 3 sources
    } catch (err) {
      setError("Failed to load knowledge base");
      console.error("Load knowledge error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => 
    searchTerm === "" || 
    doc.content_preview.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroupedDocuments = Object.entries(groupedDocuments).reduce((acc, [source, docs]) => {
    const filtered = docs.filter(doc => 
      searchTerm === "" || 
      doc.content_preview.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.source.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[source] = filtered;
    }
    return acc;
  }, {} as Record<string, DocumentItem[]>);

  const handleSelectDocument = (documentId: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId);
    } else {
      newSelected.add(documentId);
    }
    setSelectedDocuments(newSelected);
  };
  const handleSelectAllInSource = (source: string) => {
    const sourceDocuments = (viewMode === "grouped" ? filteredGroupedDocuments[source] : filteredDocuments.filter(doc => doc.source === source)) || [];
    const sourceDocIds = sourceDocuments.map(doc => doc.id);
    const newSelected = new Set(selectedDocuments);
    
    const allSelected = sourceDocIds.every(id => newSelected.has(id));
    
    if (allSelected) {
      // Deselect all in this source
      sourceDocIds.forEach(id => newSelected.delete(id));
    } else {
      // Select all in this source
      sourceDocIds.forEach(id => newSelected.add(id));
    }
    
    setSelectedDocuments(newSelected);
  };
  const handleDeleteSelected = async () => {
    if (selectedDocuments.size === 0) return;
    
    try {
      setDeleting(true);
      setError(null);
      
      const documentIds = Array.from(selectedDocuments);
      await chatAPI.deleteDocumentsBatch(documentIds);
      
      setSelectedDocuments(new Set());
      await loadKnowledge();
      onKnowledgeDeleted();
    } catch (err) {
      setError("Failed to delete selected knowledge");
      console.error("Delete knowledge error:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSingle = async (documentId: string) => {
    try {
      setDeleting(true);
      setError(null);
      
      await chatAPI.deleteDocument(documentId);
      
      setSelectedDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
      
      await loadKnowledge();
      onKnowledgeDeleted();
    } catch (err) {
      setError("Failed to delete knowledge");
      console.error("Delete knowledge error:", err);
    } finally {
      setDeleting(false);
    }
  };

  const toggleSourceExpanded = (source: string) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(source)) {
      newExpanded.delete(source);
    } else {
      newExpanded.add(source);
    }
    setExpandedSources(newExpanded);
  };

  const getSourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return <FileText className="w-4 h-4" />;
      case "website":
        return <Globe className="w-4 h-4" />;
      default:
        return <Database className="w-4 h-4" />;
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Brain className="w-8 h-8 mx-auto mb-2 animate-pulse text-primary" />
          <p className="text-sm text-muted-foreground">Loading knowledge base...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Knowledge Manager</h2>
          <span className="text-sm text-muted-foreground">
            ({viewMode === "grouped" ? Object.values(filteredGroupedDocuments).flat().length : filteredDocuments.length})
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search and View Controls */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search knowledge content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("grouped")}
            className={cn(
              "px-3 py-1 text-xs rounded transition-colors",
              viewMode === "grouped" 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary hover:bg-secondary/80"
            )}
          >
            By Source
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "px-3 py-1 text-xs rounded transition-colors",
              viewMode === "list" 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary hover:bg-secondary/80"
            )}
          >
            All Knowledge
          </button>
        </div>
      </div>      {/* Actions */}
      {selectedDocuments.size > 0 && (
        <div className="p-4 bg-secondary/30 border-b border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedDocuments.size} knowledge piece{selectedDocuments.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="px-3 py-1 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
            >
              <Trash2 className="w-3 h-3" />
              {deleting ? "Deleting..." : "Delete Selected"}
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Knowledge List */}
      <div className="flex-1 overflow-y-auto p-4">
        {(viewMode === "grouped" ? Object.values(filteredGroupedDocuments).flat().length : filteredDocuments.length) === 0 ? (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">
              {searchTerm ? "No knowledge found matching your search" : "No knowledge found"}
            </p>
          </div>
        ) : viewMode === "grouped" ? (
          <div className="space-y-4">
            {Object.entries(filteredGroupedDocuments).map(([source, docs]) => {
              const isExpanded = expandedSources.has(source);
              const sourceDocIds = docs.map(doc => doc.id);
              const selectedInSource = sourceDocIds.filter(id => selectedDocuments.has(id)).length;
              const allSelectedInSource = selectedInSource === sourceDocIds.length && sourceDocIds.length > 0;
              const someSelectedInSource = selectedInSource > 0 && selectedInSource < sourceDocIds.length;

              return (
                <div key={source} className="border border-border rounded-lg overflow-hidden">
                  {/* Source Header */}
                  <div className="p-3 bg-secondary/30 border-b border-border">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => toggleSourceExpanded(source)}
                        className="flex items-center gap-2 flex-1 text-left hover:text-primary transition-colors"
                      >
                        {getSourceIcon(docs[0]?.type || '')}
                        <span className="font-medium truncate">{source}</span>
                        <span className="text-sm text-muted-foreground">({docs.length})</span>
                        {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={() => handleSelectAllInSource(source)}
                        className="p-1 hover:bg-secondary rounded transition-colors"
                        title={allSelectedInSource ? "Deselect all" : "Select all"}
                      >
                        {allSelectedInSource ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : someSelectedInSource ? (
                          <Square className="w-4 h-4 text-primary opacity-50" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Documents */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1 p-2">
                          {docs.map((doc, index) => (
                            <div
                              key={doc.id}
                              className={cn(
                                "p-3 rounded-lg border transition-colors",
                                selectedDocuments.has(doc.id)
                                  ? "bg-primary/10 border-primary/30"
                                  : "bg-secondary/20 border-border hover:bg-secondary/40"
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <button
                                  onClick={() => handleSelectDocument(doc.id)}
                                  className="mt-1"
                                >
                                  {selectedDocuments.has(doc.id) ? (
                                    <CheckSquare className="w-4 h-4 text-primary" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                </button>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-muted-foreground">
                                      Chunk {doc.chunk_index + 1}
                                    </span>
                                    <button
                                      onClick={() => handleDeleteSingle(doc.id)}
                                      disabled={deleting}
                                      className="p-1 hover:bg-destructive/20 rounded transition-colors disabled:opacity-50"
                                      title="Delete this chunk"
                                    >
                                      <Trash2 className="w-3 h-3 text-destructive" />
                                    </button>
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {doc.content_preview}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>                </div>
              );
            })}
          </div>
        ) : (
          // List view - all knowledge pieces in a flat list
          <div className="space-y-2">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className={cn(
                  "p-4 rounded-lg border transition-colors",
                  selectedDocuments.has(doc.id)
                    ? "bg-primary/10 border-primary/30"
                    : "bg-secondary/20 border-border hover:bg-secondary/40"
                )}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleSelectDocument(doc.id)}
                    className="mt-1"
                  >
                    {selectedDocuments.has(doc.id) ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getSourceIcon(doc.type)}
                        <span className="text-sm font-medium text-muted-foreground">
                          {doc.source} - Chunk {doc.chunk_index + 1}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteSingle(doc.id)}
                        disabled={deleting}
                        className="p-1 hover:bg-destructive/20 rounded transition-colors disabled:opacity-50"
                        title="Delete this knowledge piece"
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </button>
                    </div>
                    <p className="text-sm text-foreground mb-1 line-clamp-3">
                      {doc.content_preview}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Type: {doc.type.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
