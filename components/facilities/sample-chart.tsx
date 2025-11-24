"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import type { Sample } from "@prisma/client"

interface SampleChartProps {
  samples: Sample[]
  pollutant: string
}

export function SampleChart({ samples, pollutant }: SampleChartProps) {
  // Prepare chart data
  const chartData = samples
    .filter((s) => s.pollutant === pollutant)
    .map((sample) => ({
      date: format(new Date(sample.sampleDate), "MMM dd"),
      value: Number(sample.value),
      benchmark: Number(sample.benchmark),
      exceedanceRatio: sample.exceedanceRatio ? Number(sample.exceedanceRatio) : null,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sample History - {pollutant}</CardTitle>
          <CardDescription>No samples available for this pollutant</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sample History - {pollutant}</CardTitle>
        <CardDescription>Values vs. benchmark over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === "value" || name === "benchmark") {
                  return `${value.toFixed(2)}`
                }
                return value
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <ReferenceLine
              y={chartData[0]?.benchmark}
              label="Benchmark"
              stroke="red"
              strokeDasharray="3 3"
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              strokeWidth={2}
              name="Sample Value"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="benchmark"
              stroke="#82ca9d"
              strokeWidth={2}
              name="Benchmark"
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}




