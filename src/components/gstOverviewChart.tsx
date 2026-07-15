'use client';

import { Pie, PieChart } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';

export const description = 'A pie chart with a legend';

const chartData = [
  { browser: 'chrome', visitors: 275, fill: 'red' },
  { browser: 'safari', visitors: 200, fill: 'blue' },
  { browser: 'firefox', visitors: 187, fill: 'green' },
  { browser: 'edge', visitors: 173, fill: 'orange' },
  { browser: 'other', visitors: 90, fill: 'purple' },
];

const chartConfig = {
  visitors: {
    label: 'Visitors',
  },
  chrome: {
    label: 'Chrome',
    color: 'red',
  },
  safari: {
    label: 'Safari',
    color: 'blue',
  },
  firefox: {
    label: 'Firefox',
    color: 'green',
  },
  edge: {
    label: 'Edge',
    color: 'orange',
  },
  other: {
    label: 'Other',
    color: 'purple',
  },
} satisfies ChartConfig;

export function gstOverviewChart() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>GST Overview</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <Pie data={chartData} dataKey="visitors" />
            <ChartLegend
              content={<ChartLegendContent nameKey="browser" />}
              className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
