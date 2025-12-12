import { Chart, ChartConfiguration, TooltipItem } from 'chart.js/auto';

// -- Types --
interface ChartTheme {
  isDark: boolean;
  primary: string;   // Main line/bar color
  secondary: string; // Accent
  text: string;      // Label color
  grid: string;      // Grid line color
  tooltipBg: string; // Tooltip background
}

interface ExpenseDataPoint {
  date: string; // YYYY-MM-DD
  amount: number;
  category?: string;
}

// -- Themes --
const LIGHT_THEME: ChartTheme = {
  isDark: false,
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  text: '#374151',
  grid: '#E5E7EB',
  tooltipBg: 'rgba(255, 255, 255, 0.95)'
};

const DARK_THEME: ChartTheme = {
  isDark: true,
  primary: '#60A5FA',
  secondary: '#A78BFA',
  text: '#F3F4F6',
  grid: '#374151',
  tooltipBg: 'rgba(31, 41, 55, 0.95)'
};

// -- Common Options --
const getCommonOptions = (theme: ChartTheme, currency = '$') => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: theme.text, font: { family: 'Inter' } }
    },
    tooltip: {
      backgroundColor: theme.tooltipBg,
      titleColor: theme.text,
      bodyColor: theme.text,
      borderColor: theme.grid,
      borderWidth: 1,
      padding: 10,
      titleFont: { family: 'Inter', weight: 'bold' },
      bodyFont: { family: 'Inter' },
      callbacks: {
        label: (context: TooltipItem<any>) => {
          let label = context.dataset.label || '';
          if (label) label += ': ';
          if (context.parsed.y !== null) {
            label += currency + context.parsed.y.toFixed(2);
          }
          return label;
        }
      }
    }
  },
  scales: {
    x: {
      grid: { color: theme.grid },
      ticks: { color: theme.text, font: { family: 'Inter' } }
    },
    y: {
      grid: { color: theme.grid },
      ticks: { color: theme.text, font: { family: 'Inter' } }
    }
  }
});

/**
 * Builds a Daily Line Chart (Last 30 Days)
 * @param ctx Canvas context or ID
 * @param data Array of { date, amount }
 * @param theme Light or Dark theme configuration
 */
export const buildDailyLineChart = (
  ctx: string | CanvasRenderingContext2D | HTMLCanvasElement,
  data: ExpenseDataPoint[],
  theme: ChartTheme = LIGHT_THEME
) => {
  const options = getCommonOptions(theme);
  
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.date),
      datasets: [{
        label: 'Daily Spending',
        data: data.map(d => d.amount),
        borderColor: theme.primary,
        backgroundColor: `${theme.primary}20`, // transparent fill
        tension: 0.4, // Smooth curve
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      ...options,
      interaction: {
        intersect: false,
        mode: 'index',
      },
    }
  });
};

/**
 * Builds a Stacked Weekly Bar Chart
 * @param ctx Canvas context
 * @param data Flat array of all expenses
 * @param categories List of category names to create stacks
 * @param theme Light/Dark theme
 */
export const buildWeeklyBarChart = (
  ctx: string | CanvasRenderingContext2D | HTMLCanvasElement,
  data: ExpenseDataPoint[],
  categories: string[],
  theme: ChartTheme = LIGHT_THEME
) => {
  // Process Data: Group by Week, then by Category
  const weeks: Record<string, Record<string, number>> = {};
  
  data.forEach(item => {
    // Basic week calc (start of week)
    const d = new Date(item.date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff)).toISOString().split('T')[0];

    if (!weeks[monday]) weeks[monday] = {};
    const cat = item.category || 'Other';
    weeks[monday][cat] = (weeks[monday][cat] || 0) + item.amount;
  });

  const sortedWeeks = Object.keys(weeks).sort();
  
  // Create datasets per category
  const datasets = categories.map((cat, index) => {
    // Generate distinct colors if not provided in theme
    const color = `hsl(${(index * 360) / categories.length}, 70%, 50%)`;
    
    return {
      label: cat,
      data: sortedWeeks.map(week => weeks[week][cat] || 0),
      backgroundColor: color,
      stack: 'Stack 0',
    };
  });

  const options = getCommonOptions(theme);
  // Force stacking
  if (options.scales?.x) (options.scales.x as any).stacked = true;
  if (options.scales?.y) (options.scales.y as any).stacked = true;

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedWeeks,
      datasets: datasets
    },
    options: options
  });
};

// -- Example Usage --
/*
import { buildDailyLineChart } from './services/chartBuilder';

const expenses = [
  { date: '2023-10-01', amount: 50.00, category: 'Food' },
  { date: '2023-10-02', amount: 20.00, category: 'Transport' }
];

// In a React useEffect:
const canvas = document.getElementById('myChart') as HTMLCanvasElement;
if (canvas) {
    const chartInstance = buildDailyLineChart(canvas, expenses);
    // Cleanup: chartInstance.destroy();
}
*/