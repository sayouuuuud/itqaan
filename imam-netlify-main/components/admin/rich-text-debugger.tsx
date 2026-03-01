"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, Bug, Play, RefreshCw, Eye, EyeOff } from "lucide-react"

interface DebugInfo {
  timestamp: string
  selectedFont: string
  editorContent: string
  htmlContent: string
  fontFamilyInHTML: string | null
  hasFontFamily: boolean
  contentLength: number
  editorState: string
  lastContent: string
  contentChanged: boolean
}

export default function RichTextEditorDebugger() {
  const [isVisible, setIsVisible] = useState(true)
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${message}`
    setLogs(prev => [...prev.slice(-9), logEntry])
    console.log(logEntry)
  }

  const analyzeRichTextEditor = () => {
    addLog("🔍 Starting analysis of Rich Text Editor...")
    
    // Find editor instances - try multiple selectors
    let editorElements = document.querySelectorAll('.ProseMirror')
    if (editorElements.length === 0) {
      editorElements = document.querySelectorAll('.ProseMirror-focused')
    }
    if (editorElements.length === 0) {
      editorElements = document.querySelectorAll('[contenteditable="true"]')
    }
    if (editorElements.length === 0) {
      editorElements = document.querySelectorAll('.tiptap-editor')
    }
    if (editorElements.length === 0) {
      editorElements = document.querySelectorAll('.editor-content')
    }
    
    addLog(`📊 Found ${editorElements.length} editor instances`)
    
    if (editorElements.length === 0) {
      addLog("❌ No editor found - checking if component is mounted")
      addLog("🔍 Looking for any rich text editor components...")
      
      // Log all potential editor containers
      const allDivs = document.querySelectorAll('div')
      const potentialEditors = Array.from(allDivs).filter(div => {
        const hasContentEditable = div.getAttribute('contenteditable') === 'true'
        const hasProseClass = div.className.includes('ProseMirror')
        const hasEditorClass = div.className.includes('editor')
        return hasContentEditable || hasProseClass || hasEditorClass
      })
      
      addLog(`🔍 Found ${potentialEditors.length} potential editor containers`)
      potentialEditors.forEach((div, index) => {
        addLog(`📝 Container ${index + 1}: class="${div.className}" contenteditable="${div.getAttribute('contenteditable')}"`)
      })
      
      return
    }

    const editor = editorElements[0] as HTMLElement
    const htmlContent = editor.innerHTML
    
    // Extract font-family from HTML
    const fontFamilyMatch = htmlContent.match(/font-family:\s*([^;"]+)/i)
    const fontFamilyInHTML = fontFamilyMatch ? fontFamilyMatch[1].trim() : null
    
    // Find font selector
    const fontSelector = document.querySelector('[data-state="open"]') as HTMLSelectElement
    const selectedFont = fontSelector?.value || 'Unknown'
    
    const debugData: DebugInfo = {
      timestamp: new Date().toISOString(),
      selectedFont,
      editorContent: editor.textContent || '',
      htmlContent,
      fontFamilyInHTML,
      hasFontFamily: !!fontFamilyInHTML,
      contentLength: htmlContent.length,
      editorState: editor.getAttribute('contenteditable') || 'unknown',
      lastContent: '', // This would need to be tracked in the actual component
      contentChanged: true // This would need to be tracked in the actual component
    }
    
    setDebugInfo(debugData)
    
    // Detailed analysis
    addLog(`📝 Selected Font: ${selectedFont}`)
    addLog(`🎨 Font Family in HTML: ${fontFamilyInHTML || 'NOT FOUND'}`)
    addLog(`✅ Has Font Family: ${!!fontFamilyInHTML}`)
    addLog(`📏 Content Length: ${htmlContent.length} characters`)
    addLog(`🔧 Editor State: ${debugData.editorState}`)
    
    // Check for common issues
    if (!fontFamilyInHTML) {
      addLog("⚠️ ISSUE: No font-family found in HTML content")
    }
    
    if (selectedFont !== 'Unknown' && fontFamilyInHTML && !fontFamilyInHTML.includes(selectedFont)) {
      addLog("⚠️ ISSUE: Selected font doesn't match font in HTML")
    }
    
    if (htmlContent.length === 0) {
      addLog("⚠️ ISSUE: Editor content is empty")
    }
    
    addLog("✅ Analysis complete")
  }

  const copyDebugInfo = () => {
    if (!debugInfo) return
    
    const debugText = `
🐛 RICH TEXT EDITOR DEBUG REPORT
=====================================
Generated: ${debugInfo.timestamp}

🎨 FONT INFORMATION
------------------
Selected Font: ${debugInfo.selectedFont}
Font Family in HTML: ${debugInfo.fontFamilyInHTML || 'NOT FOUND'}
Has Font Family: ${debugInfo.hasFontFamily}

📝 CONTENT ANALYSIS
-------------------
Content Length: ${debugInfo.contentLength} characters
Editor State: ${debugInfo.editorState}
Content Changed: ${debugInfo.contentChanged}

🔍 HTML CONTENT (First 500 chars)
------------------------------------
${debugInfo.htmlContent.substring(0, 500)}${debugInfo.htmlContent.length > 500 ? '...' : ''}

📊 RAW TEXT CONTENT (First 200 chars)
---------------------------------------
${debugInfo.editorContent.substring(0, 200)}${debugInfo.editorContent.length > 200 ? '...' : ''}

🚨 ISSUES DETECTED
-------------------
${!debugInfo.hasFontFamily ? '❌ No font-family found in HTML' : '✅ Font family is present'}
${debugInfo.selectedFont !== 'Unknown' && debugInfo.fontFamilyInHTML && !debugInfo.fontFamilyInHTML.includes(debugInfo.selectedFont) ? '❌ Selected font mismatch with HTML font' : '✅ Selected font matches HTML'}
${debugInfo.contentLength === 0 ? '❌ Empty content' : '✅ Content exists'}

📋 RECENT LOGS
----------------
${logs.join('\n')}

=====================================
END OF DEBUG REPORT
    `.trim()
    
    navigator.clipboard.writeText(debugText).then(() => {
      addLog("📋 Debug info copied to clipboard!")
    }).catch(() => {
      addLog("❌ Failed to copy to clipboard")
    })
  }

  const simulateFontChange = () => {
    addLog("🔄 Simulating font change...")
    
    // Find font selector - try multiple selectors
    let fontSelector = document.querySelector('select') as HTMLSelectElement
    if (!fontSelector) {
      // Try to find by looking for select elements with specific patterns
      const allSelects = document.querySelectorAll('select')
      addLog(`🔍 Found ${allSelects.length} select elements`)
      
      allSelects.forEach((select, index) => {
        addLog(`📝 Select ${index + 1}: className="${select.className}" value="${select.value}"`)
      })
      
      fontSelector = allSelects[0] as HTMLSelectElement
    }
    
    if (fontSelector) {
      const currentFont = fontSelector.value
      const newFont = currentFont === 'Cairo' ? 'Amiri' : 'Cairo'
      
      addLog(`🎨 Changing font from ${currentFont} to ${newFont}`)
      
      // Trigger change event
      fontSelector.value = newFont
      fontSelector.dispatchEvent(new Event('change', { bubbles: true }))
      
      setTimeout(() => {
        analyzeRichTextEditor()
      }, 1000)
    } else {
      addLog("❌ Font selector not found")
      addLog("🔍 Looking for any form elements...")
      
      const forms = document.querySelectorAll('form')
      addLog(`📝 Found ${forms.length} forms`)
      
      forms.forEach((form, index) => {
        addLog(`📋 Form ${index + 1}: ${form.className}`)
      })
    }
  }

  const clearLogs = () => {
    setLogs([])
    addLog("🧹 Logs cleared")
  }

  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        analyzeRichTextEditor()
      }, 5000)
      
      return () => clearInterval(interval)
    }
  }, [isMonitoring])

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 z-50 bg-red-600 hover:bg-red-700 text-white"
        size="sm"
      >
        <Bug className="h-4 w-4 mr-2" />
        Show Debug
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-96 bg-white border-2 border-red-500 rounded-lg shadow-lg">
      <Card className="border-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Bug className="h-4 w-4 text-red-600" />
              Rich Text Editor Debug
            </CardTitle>
            <div className="flex gap-1">
              <Button
                onClick={() => setIsMonitoring(!isMonitoring)}
                size="sm"
                variant={isMonitoring ? "default" : "outline"}
                className="h-6 px-2"
              >
                {isMonitoring ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                size="sm"
                variant="outline"
                className="h-6 px-2"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={analyzeRichTextEditor} size="sm" className="flex-1">
              <Bug className="h-3 w-3 mr-1" />
              Analyze
            </Button>
            <Button onClick={simulateFontChange} size="sm" variant="outline" className="flex-1">
              <RefreshCw className="h-3 w-3 mr-1" />
              Test Font
            </Button>
            <Button onClick={copyDebugInfo} size="sm" variant="outline" className="flex-1">
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
            <Button onClick={clearLogs} size="sm" variant="outline" className="flex-1">
              Clear
            </Button>
          </div>

          {/* Debug Info */}
          {debugInfo && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="font-semibold">Selected Font:</span>
                <Badge variant={debugInfo.hasFontFamily ? "default" : "destructive"}>
                  {debugInfo.selectedFont}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Font in HTML:</span>
                <Badge variant={debugInfo.fontFamilyInHTML ? "default" : "destructive"}>
                  {debugInfo.fontFamilyInHTML || 'None'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Content Length:</span>
                <span>{debugInfo.contentLength}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Has Font:</span>
                <Badge variant={debugInfo.hasFontFamily ? "default" : "destructive"}>
                  {debugInfo.hasFontFamily ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          )}

          {/* Logs */}
          <div className="space-y-1">
            <div className="font-semibold text-xs">Logs:</div>
            <div className="bg-gray-50 border rounded p-2 h-32 overflow-y-auto text-xs font-mono">
              {logs.length === 0 ? (
                <div className="text-gray-400">No logs yet. Click "Analyze" to start.</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="border-b border-gray-100 pb-1 mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Status */}
          <div className="text-xs text-gray-500 text-center">
            {isMonitoring ? '🔴 Monitoring every 5 seconds' : '⚫ Monitoring disabled'}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
