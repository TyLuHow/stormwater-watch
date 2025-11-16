"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Download, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface CasePacketButtonProps {
  violationEventId: string
  facilityName: string
  permitId: string
}

export function CasePacketButton({ violationEventId, facilityName, permitId }: CasePacketButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPacket, setGeneratedPacket] = useState<{ url: string; createdAt: Date } | null>(null)

  const handleGenerateCasePacket = async () => {
    setIsGenerating(true)

    try {
      const response = await fetch("/api/case-packet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          violationEventId,
          includePrecipitation: true,
          includeMap: true,
          includeChart: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Generation failed")
      }

      // Get the PDF blob
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition")
      let filename = `case-packet-${permitId}-${Date.now()}.pdf`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Trigger download
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setGeneratedPacket({ url, createdAt: new Date() })
      toast({
        title: "Success",
        description: "Case packet generated and downloaded successfully",
      })
    } catch (error) {
      console.error("Case packet generation error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate case packet",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleGenerateCasePacket} disabled={isGenerating} className="w-full">
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <FileText className="w-4 h-4 mr-2" />
            Generate Case Packet
          </>
        )}
      </Button>
      {generatedPacket && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Download className="w-4 h-4" />
          <span>Generated {new Date(generatedPacket.createdAt).toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}




