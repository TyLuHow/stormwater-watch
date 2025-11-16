"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"
import { Upload, AlertCircle } from "lucide-react"

export default function IngestPage() {
  const [file, setFile] = useState<File | null>(null)
  const [sourceUrl, setSourceUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast({ title: "Error", description: "Please select a file", variant: "destructive" })
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      if (sourceUrl) formData.append("sourceUrl", sourceUrl)

      const res = await fetch("/api/ingest/smarts-upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (data.success) {
        setResult(data)
        toast({ title: "Success", description: `Ingested ${data.counts.samplesInserted} samples` })
        setFile(null)
        setSourceUrl("")
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Ingestion failed", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Ingestion</h1>
        <p className="text-muted-foreground mt-2">Upload CIWQS/SMARTS CSV files</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
          <CardDescription>Supported format: CIWQS exported violations CSV</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <label className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Click to select or drag CSV file</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {file && <p className="text-sm text-green-600 mt-2">{file.name}</p>}
            </div>

            <Input
              placeholder="Source URL (optional)"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
            />

            <Button type="submit" className="w-full" disabled={loading || !file}>
              {loading ? "Uploading..." : "Upload & Process"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Ingestion Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Samples Inserted</p>
                <p className="text-2xl font-bold">{result.counts.samplesInserted}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duplicates Skipped</p>
                <p className="text-2xl font-bold">{result.counts.duplicatesSkipped}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Facilities Created</p>
                <p className="text-2xl font-bold">{result.counts.facilitiesCreated}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rows Parsed</p>
                <p className="text-2xl font-bold">{result.counts.rowsParsed}</p>
              </div>
            </div>

            {result.warnings.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">{result.warnings.length} warnings:</p>
                  <ul className="text-sm space-y-1">
                    {result.warnings.slice(0, 5).map((w: string, i: number) => (
                      <li key={i}>• {w}</li>
                    ))}
                    {result.warnings.length > 5 && <li>• ... and {result.warnings.length - 5} more</li>}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
