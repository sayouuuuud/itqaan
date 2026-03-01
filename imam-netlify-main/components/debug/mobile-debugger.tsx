"use client"

import { useState, useEffect } from "react"
import { pdfjs } from "react-pdf"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronUp, ChevronDown, Bug, RefreshCcw, Copy } from "lucide-react"

export function MobileDebugger() {
    const [isOpen, setIsOpen] = useState(false)
    const [logs, setLogs] = useState<string[]>([])
    const [workerStatus, setWorkerStatus] = useState<string>("Unknown")
    const [workerUrl, setWorkerUrl] = useState<string>("")

    // Capture logs
    useEffect(() => {
        const originalLog = console.log
        const originalError = console.error
        const originalWarn = console.warn

        const addLog = (type: string, args: any[]) => {
            const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ')
            setLogs(prev => [`[${type}] ${message}`, ...prev].slice(0, 50))
        }

        console.log = (...args) => {
            addLog('LOG', args)
            originalLog.apply(console, args)
        }

        console.error = (...args) => {
            addLog('ERR', args)
            originalError.apply(console, args)
        }

        console.warn = (...args) => {
            addLog('WRN', args)
            originalWarn.apply(console, args)
        }

        return () => {
            console.log = originalLog
            console.error = originalError
            console.warn = originalWarn
        }
    }, [])

    const checkWorker = async () => {
        try {
            // @ts-ignore
            const currentSrc = pdfjs.GlobalWorkerOptions.workerSrc
            setWorkerUrl(String(currentSrc))

            setLogs(prev => [`[CHECK] Checking worker at: ${currentSrc}`, ...prev])

            if (typeof currentSrc === 'string' && !currentSrc.startsWith('blob:')) {
                const response = await fetch(currentSrc)
                setWorkerStatus(`${response.status} ${response.statusText}`)
                setLogs(prev => [`[CHECK] Worker fetch status: ${response.status}`, ...prev])
            } else {
                setWorkerStatus("Blob/Object URL (Cannot fetch)")
            }
        } catch (e: any) {
            setWorkerStatus(`Error: ${e.message}`)
            setLogs(prev => [`[CHECK] Worker fetch error: ${e.message}`, ...prev])
        }
    }

    useEffect(() => {
        checkWorker()
    }, [])

    const copyLogs = () => {
        const logText = logs.join('\n')
        navigator.clipboard.writeText(
            `User Agent: ${navigator.userAgent}\nWorker: ${workerUrl}\nStatus: ${workerStatus}\n\nLogs:\n${logText}`
        )
        alert("Copied to clipboard!")
    }

    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined' && !window.location.search.includes('debug=true')) {
        // Optional: You can hide this in production unless ?debug=true is present
        // For now, removing this check as requested by user to debug PROD
    }

    return (
        <div className={`fixed bottom-0 left-0 right-0 z-[9999] bg-black/90 text-white transition-all duration-300 ${isOpen ? 'h-[50vh]' : 'h-12'}`}>
            <div
                className="flex items-center justify-between p-2 cursor-pointer bg-zinc-800 border-t border-zinc-700"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <Bug className="h-4 w-4 text-red-500" />
                    <span className="text-xs font-mono font-bold">Debug Console</span>
                    <span className={`text-[10px] px-1 rounded ${workerStatus.includes('200') ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                        {workerStatus}
                    </span>
                </div>
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </div>

            {isOpen && (
                <div className="h-full flex flex-col p-2 space-y-2 pb-14">
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-zinc-900 p-2 rounded">
                        <div>
                            <span className="text-zinc-500">UA:</span>
                            <div className="truncate text-zinc-300">{typeof navigator !== 'undefined' ? navigator.userAgent : 'Server'}</div>
                        </div>
                        <div>
                            <span className="text-zinc-500">Worker Src:</span>
                            <div className="truncate text-yellow-300">{workerUrl}</div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-6 text-xs bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700" onClick={(e) => { e.stopPropagation(); checkWorker(); }}>
                            <RefreshCcw className="h-3 w-3 mr-1" /> Re-check
                        </Button>
                        <Button size="sm" variant="outline" className="h-6 text-xs bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700" onClick={(e) => { e.stopPropagation(); copyLogs(); }}>
                            <Copy className="h-3 w-3 mr-1" /> Copy Report
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 bg-zinc-950 rounded border border-zinc-800 p-2 font-mono text-[10px]">
                        {logs.map((log, i) => (
                            <div key={i} className={`mb-1 border-b border-white/5 pb-1 ${log.includes('[ERR]') ? 'text-red-400' :
                                    log.includes('[WRN]') ? 'text-yellow-400' :
                                        log.includes('[CHECK]') ? 'text-blue-400' : 'text-zinc-400'
                                }`}>
                                {log}
                            </div>
                        ))}
                    </ScrollArea>
                </div>
            )}
        </div>
    )
}
