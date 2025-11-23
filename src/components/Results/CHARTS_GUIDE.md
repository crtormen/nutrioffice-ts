# Charts Guide - NutriOffice

This guide shows how to use all available chart components in the NutriOffice application.

## Available Charts

### 1. **BodyCompositionBarChart** - Stacked Bar Chart
Shows body composition (mg, mm, mr, mo) over multiple consultations.

**Use case:** Compare how body composition changed across consultations

```tsx
import { BodyCompositionBarChart } from "@/components/Results/charts";

<BodyCompositionBarChart
  customerId="customer-id"
  userId="user-id"
  limit={6} // Optional: number of consultations to show (default: 6)
/>
```

**Features:**
- Stacked bars showing all 4 body composition components
- Displays last 6 consultations by default
- Perfect for seeing total weight distribution over time

---

### 2. **WeightProgressAreaChart** - Area Chart with Goals
Shows weight progression over time with goal reference lines.

**Use case:** Track weight loss/gain progress toward a goal

```tsx
import { WeightProgressAreaChart } from "@/components/Results/charts";

<WeightProgressAreaChart
  goal={currentGoal} // Optional: IGoal object
/>
```

**Features:**
- Beautiful gradient area fill
- Shows target weight as horizontal dashed line
- Shows target date as vertical dashed line
- Works with or without goals

---

### 3. **CircumferenceRadarChart** - Radar Chart
Visualizes body circumference measurements in a spider/radar chart.

**Use case:** Compare current vs previous measurements across all body parts

```tsx
import { CircumferenceRadarChart } from "@/components/Results/charts";

<CircumferenceRadarChart
  customerId="customer-id"
  userId="user-id"
  compareConsultations={true} // Optional: show current vs previous (default: true)
/>
```

**Features:**
- Shows 6 main circumference measurements
- Compares latest consultation with previous one
- Easy to spot which areas increased/decreased
- Great for visual impact

---

### 4. **MetricsProgressChart** - Horizontal Progress Bars
Shows total change in key metrics from first to latest consultation.

**Use case:** Show overall progress summary

```tsx
import { MetricsProgressChart } from "@/components/Results/charts";

<MetricsProgressChart
  customerId="customer-id"
  userId="user-id"
/>
```

**Features:**
- Horizontal bars showing total change
- Green bars = increase, Blue bars = decrease
- Shows percentage change in tooltip
- Compares first consultation vs latest

---

### 5. **ResultsChart** (Migrated) - Line Chart
Tracks a single metric over time with goal reference.

**Use case:** Detailed tracking of specific metric (weight, fat%, etc.)

```tsx
import { ResultsChart } from "@/components/Results/charts";

<ResultsChart
  param="peso" // or "fat", "mg", "mm"
  goal={currentGoal} // Optional
/>
```

**Features:**
- Line chart for time-series data
- Supports goal comparison
- Reference lines for target value and date

---

### 6. **CompositionChart** (Migrated) - Pie Chart
Shows current body composition breakdown.

**Use case:** Snapshot of latest body composition

```tsx
import { CompositionChart } from "@/components/Results/charts";

<CompositionChart />
```

**Features:**
- Pie chart with percentage labels
- Shows mg, mm, mr, mo proportions
- Uses latest consultation data

---

## Quick Import

Import all charts from one place:

```tsx
import {
  BodyCompositionBarChart,
  WeightProgressAreaChart,
  CircumferenceRadarChart,
  MetricsProgressChart,
  ResultsChart,
  CompositionChart,
} from "@/components/Results/charts";
```

## Example: Dashboard with Multiple Charts

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  WeightProgressAreaChart,
  MetricsProgressChart,
  CircumferenceRadarChart,
} from "@/components/Results/charts";

export function CustomerDashboard({ customerId, userId, currentGoal }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Progresso de Peso</CardTitle>
        </CardHeader>
        <CardContent>
          <WeightProgressAreaChart goal={currentGoal} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo de Mudanças</CardTitle>
        </CardHeader>
        <CardContent>
          <MetricsProgressChart customerId={customerId} userId={userId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medidas Corporais</CardTitle>
        </CardHeader>
        <CardContent>
          <CircumferenceRadarChart customerId={customerId} userId={userId} />
        </CardContent>
      </Card>
    </div>
  );
}
```

## Dark Mode

All charts automatically support dark mode through your theme system. No additional configuration needed!

## Customization

All charts accept a `className` prop for custom styling:

```tsx
<WeightProgressAreaChart
  goal={currentGoal}
  className="h-[500px]" // Custom height
/>
```

Chart colors are controlled via CSS variables in `global.css`:
- `--chart-1` through `--chart-5` for light mode
- Same variables in `.dark` for dark mode

## Data Requirements

- **BodyCompositionBarChart**: Needs consultations with `results` object
- **WeightProgressAreaChart**: Needs consultations with `peso` field
- **CircumferenceRadarChart**: Needs consultations with `measures` object
- **MetricsProgressChart**: Needs at least 2 consultations
- **ResultsChart**: Uses `useSetChartData` hook
- **CompositionChart**: Uses `useSetLastConsulta` hook

All charts show a friendly message when data is missing.
