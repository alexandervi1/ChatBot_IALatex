'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Toaster } from "@/components/ui/toaster";
import { UploadCloud } from 'lucide-react';
import dynamic from 'next/dynamic';

// Components
import { ChatHeader } from './chat-header';
import { ChatInput } from './chat-input';
import { ChatMessages } from './chat-messages';
import { DocumentList } from './document-list';
import { WelcomeScreen } from './welcome-screen';
import { UserManual } from './user-manual';
import { ApiKeyGuide } from './api-key-guide';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Custom hook for chat state management
import { useChatState } from '@/lib/hooks/use-chat-state';

// Dynamic import for CopilotEditor (heavy with Monaco)
const CopilotEditor = dynamic(
  () => import('@/components/copilot/copilot-editor').then(mod => mod.CopilotEditor),
  { ssr: false }
);

/**
 * Main layout component for the chat application.
 * Orchestrates the UI composition using extracted components and hooks.
 * 
 * Architecture:
 * - ChatHeader: Navigation, mode toggle, user actions
 * - DocumentList: Sidebar with document management
 * - ChatMessages/WelcomeScreen: Main chat area
 * - CopilotEditor: LaTeX editing mode
 * - useChatState: All business logic and state
 */
export function ChatLayout() {
  const { logout } = useAuth();
  const [mode, setMode] = useState<'chat' | 'copilot'>('chat');
  const [isManualOpen, setIsManualOpen] = useState(false);

  // All chat/document/copilot state and handlers from custom hook
  const {
    user,
    messages,
    input,
    setInput,
    isLoading,
    suggestedQuestions,
    copiedMessageIndex,
    documents,
    docSearchTerm,
    setDocSearchTerm,
    uploadStatus,
    deletingId,
    copilotText,
    setCopilotText,
    copilotInstruction,
    setCopilotInstruction,
    pdfFile,
    previewStatus,
    previewError,
    setPreviewError,
    isDragging,
    fileInputRef,
    messagesEndRef,
    fetchDocuments,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleClearChat,
    handleCopy,
    handleExportChat,
    handleUploadClick,
    handleDelete,
    handleDocSelectionChange,
    handleSubmit,
    handleCopilotSubmit,
    handlePdfPreview,
    handlePdfDownload,
    ALLOWED_FILE_TYPES,
  } = useChatState();

  return (
    <div
      className="flex h-screen flex-col bg-background text-foreground relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* API Key Setup Modal */}
      <ApiKeyGuide isOpen={!!user && !user.has_api_key} onOpenChange={() => { }} />

      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary p-12 text-primary-foreground">
            <UploadCloud className="h-16 w-16 mb-4" />
            <p className="text-xl font-semibold">Suelta tus archivos aquí</p>
          </div>
        </div>
      )}

      {/* User Manual Modal */}
      <UserManual open={isManualOpen} onOpenChange={setIsManualOpen} />

      {/* Toast Notifications */}
      <Toaster />

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={ALLOWED_FILE_TYPES.join(',')}
        style={{ display: 'none' }}
        multiple
      />

      {/* Header */}
      <ChatHeader
        user={user}
        mode={mode}
        setMode={setMode}
        onExportChat={handleExportChat}
        onClearChat={handleClearChat}
        onOpenManual={() => setIsManualOpen(true)}
        onLogout={logout}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Document List */}
        <DocumentList
          documents={documents}
          uploadStatus={uploadStatus}
          deletingId={deletingId}
          docSearchTerm={docSearchTerm}
          setDocSearchTerm={setDocSearchTerm}
          handleUploadClick={handleUploadClick}
          handleDocSelectionChange={handleDocSelectionChange}
          handleDelete={handleDelete}
          fetchDocuments={fetchDocuments}
        />

        {/* Main Area */}
        <main className="flex flex-1 flex-col bg-background/80 backdrop-blur-lg">
          {mode === 'copilot' ? (
            <ErrorBoundary>
              <CopilotEditor
                text={copilotText}
                setText={setCopilotText}
                instruction={copilotInstruction}
                setInstruction={setCopilotInstruction}
                handleSubmit={handleCopilotSubmit}
                handleDownload={handlePdfDownload}
                handlePreview={handlePdfPreview}
                pdfFile={pdfFile}
                previewStatus={previewStatus}
                previewError={previewError}
                setPreviewError={setPreviewError}
                isLoading={isLoading}
              />
            </ErrorBoundary>
          ) : (
            <ErrorBoundary>
              <>
                {messages.length === 1 && messages[0].role === 'ai' ? (
                  <WelcomeScreen
                    setInput={setInput}
                    suggestedQuestions={suggestedQuestions}
                  />
                ) : (
                  <ChatMessages
                    messages={messages}
                    messagesEndRef={messagesEndRef}
                    copiedMessageIndex={copiedMessageIndex}
                    handleCopy={handleCopy}
                  />
                )}
                <ChatInput
                  input={input}
                  setInput={setInput}
                  handleSubmit={handleSubmit}
                  isLoading={isLoading}
                />
              </>
            </ErrorBoundary>
          )}
        </main>
      </div>
    </div>
  );
}