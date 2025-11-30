"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ParameterChartProps {
  data: {
    date: string
    value: number | null
  }[]
  parameterName: string
  units: string
}

export function ParameterChart({ data, parameterName, units }: ParameterChartProps) {
  // Filter out null values and sort by date
  const chartData = data
    .filter((d) => d.value !== null)
    .map((d) => ({
      date: d.date,
      value: d.value,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{parameterName} Trends</CardTitle>
          <CardDescription>Sample results over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            No data available for this parameter
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartConfig = {
    value: {
      label: `${parameterName} (${units})`,
      color: "hsl(var(--primary))",
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{parameterName} Trends</CardTitle>
        <CardDescription>
          Sample results over time ({chartData.length} samples)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value)
                return `${date.getMonth() + 1}/${date.getDate()}`
              }}
              className="text-xs"
            />
            <YAxis
              className="text-xs"
              label={{ value: units, angle: -90, position: "insideLeft" }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString()
                  }}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={{ fill: "var(--color-value)", r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
