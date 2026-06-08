import re

with open('frontend/src/pages/AdminInterface.jsx', 'r') as f:
    content = f.read()

# Replace imports
import_str = """import React, { useState, useEffect, useRef } from 'react';
import TerminalOutput from '../components/TerminalOutput';
const AdminInterface = ({ toggleTheme, isDark }) => {"""

new_import_str = """import React, { useState, useEffect, useRef } from 'react';
import Step1Upload from './admin/Step1Upload';
import Step2SystemIdentity from './admin/Step2SystemIdentity';
import Step3PipelineConfig from './admin/Step3PipelineConfig';
import Step4RunPipeline from './admin/Step4RunPipeline';

const AdminInterface = ({ toggleTheme, isDark }) => {"""

content = content.replace(import_str, new_import_str)

# Replace max-w-4xl
content = content.replace('className="max-w-4xl mx-auto p-8"', 'className="w-full px-4 md:px-12 py-8 mx-auto"')

# Replace the giant JSX block
# We find the start of {/* Upload Section - Step 1 */}
start_marker = "{/* Upload Section - Step 1 */}"
end_marker = "{/* Navigation Controls */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_components = """{currentStep === 1 && (
            <Step1Upload 
              files={files}
              fileInputRef={fileInputRef}
              handleFileChange={handleFileChange}
              handleUpload={handleUpload}
              uploadStatus={uploadStatus}
              documents={documents}
              setPreviewDoc={setPreviewDoc}
              handleDeleteDoc={handleDeleteDoc}
              agentPrompt={agentPrompt}
              setAgentPrompt={setAgentPrompt}
              agentStatus={agentStatus}
              handleRunAgent={handleRunAgent}
              handleResetAgent={handleResetAgent}
              agentLogs={agentLogs}
            />
          )}

          {currentStep === 2 && (
            <Step2SystemIdentity 
              promptUseCase={promptUseCase}
              setPromptUseCase={setPromptUseCase}
              isGeneratingPrompt={isGeneratingPrompt}
              handleGeneratePrompt={handleGeneratePrompt}
              systemPrompt={systemPrompt}
              setSystemPrompt={setSystemPrompt}
              handleSavePrompt={handleSavePrompt}
            />
          )}

          {currentStep === 3 && (
            <Step3PipelineConfig 
              pipelineConfig={pipelineConfig}
              handleConfigChange={handleConfigChange}
            />
          )}

          {currentStep === 4 && (
            <Step4RunPipeline 
              pipelineStatus={pipelineStatus}
              pipelineMessage={pipelineMessage}
              pipelineResult={pipelineResult}
              pipelineLogs={pipelineLogs}
              startPipeline={startPipeline}
              handleReset={handleReset}
              pipelineConfig={pipelineConfig}
              systemPrompt={systemPrompt}
            />
          )}

          """
    content = content[:start_idx] + new_components + content[end_idx:]

with open('frontend/src/pages/AdminInterface.jsx', 'w') as f:
    f.write(content)
