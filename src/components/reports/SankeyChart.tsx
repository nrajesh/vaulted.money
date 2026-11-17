import React from "react";
import {
  ThemedCard,
  ThemedCardContent,
  ThemedCardDescription,
  ThemedCardHeader,
  ThemedCardTitle,
} from "@/components/ThemedCard";
import { ResponsiveContainer, Sankey, Tooltip } from "recharts";
import { useCurrency } from "@/contexts/CurrencyContext";

import { Transaction } from "@/data/finance-data";
import { Payee } from "@/components/dialogs/AddEditPayeeDialog";

// The Charts page's colours, so a category looks the same here as in the
// spending ring.
const FLOW_COLOURS = [
  "#6366f1",
  "#ec4899",
  "#22c55e",
  "#f59e0b",
  "#06b6d4",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#f97316",
  "#3b82f6",
];

/** A colour that stays the same for a name from one render to the next. */
const colourFor = (name = "") => {
  // Money coming in is always green, never the red a hash might pick.
  if (name.startsWith("Income")) return "#10b981";
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return FLOW_COLOURS[hash % FLOW_COLOURS.length];
};

/**
 * A flow between two nodes, shaded from the colour of where the money came
 * from to the colour of where it went.
 */
const FlowLink = (props: {
  sourceX?: number;
  targetX?: number;
  sourceY?: number;
  targetY?: number;
  sourceControlX?: number;
  targetControlX?: number;
  linkWidth?: number;
  index?: number;
  payload?: { source?: { name: string }; target?: { name: string } };
}) => {
  const {
    sourceX = 0,
    targetX = 0,
    sourceY = 0,
    targetY = 0,
    sourceControlX = 0,
    targetControlX = 0,
    linkWidth = 0,
    index = 0,
    payload,
  } = props;
  const gradientId = `flow-link-${index}`;
  return (
    <g>
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={sourceX}
          x2={targetX}
        >
          <stop offset="0" stopColor={colourFor(payload?.source?.name)} />
          <stop offset="1" stopColor={colourFor(payload?.target?.name)} />
        </linearGradient>
      </defs>
      <path
        d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={Math.max(linkWidth, 1)}
        strokeOpacity={0.5}
      />
    </g>
  );
};

/**
 * A node with its name beside it, so the chart reads without hovering:
 * income on the left, accounts in the middle, where the money went on the
 * right. Node names are "Income: Salary", "Account: Savings" and so on.
 */
const FlowNode = (props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: { name: string };
}) => {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  const [kind, ...rest] = (payload?.name ?? "").split(": ");
  const label = rest.join(": ") || kind;
  const onLeft = kind === "Income";
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={Math.max(height, 2)}
        rx={2}
        fill={colourFor(payload?.name)}
      />
      <text
        x={onLeft ? x - 8 : x + width + 8}
        y={y + height / 2}
        textAnchor={onLeft ? "end" : "start"}
        dominantBaseline="middle"
        className="fill-slate-700 text-[11px] font-medium dark:fill-slate-200"
      >
        {label}
      </text>
    </g>
  );
};

interface SankeyChartProps {
  transactions: Transaction[];
  accounts: Payee[];
}

const SankeyChart: React.FC<SankeyChartProps> = ({
  transactions,
  accounts,
}) => {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } =
    useCurrency();

  const { sankeyData, chartHeight } = React.useMemo(() => {
    const nodes: { name: string }[] = [];
    const linkMap = new Map<
      string,
      { source: number; target: number; value: number }
    >();
    const nodeMap = new Map<string, number>();

    const addNode = (name: string) => {
      if (!nodeMap.has(name)) {
        nodeMap.set(name, nodes.length);
        nodes.push({ name });
      }
    };

    // Define nodes
    const incomeCategories = new Set<string>();
    const expenseCategories = new Set<string>();
    const accountNames = new Set(accounts.map((a) => a.name));
    let hasTransfers = false;

    transactions.forEach((t) => {
      if (t.category === "Transfer") {
        hasTransfers = true;
      } else if (t.amount > 0) {
        incomeCategories.add(t.category);
      } else {
        expenseCategories.add(t.category);
      }
    });

    incomeCategories.forEach((name) => addNode(`Income: ${name}`));
    accountNames.forEach((name) => addNode(`Account: ${name}`));
    expenseCategories.forEach((name) => addNode(`Expense: ${name}`));
    if (hasTransfers) {
      addNode("Transfer Out");
      addNode("Transfer In");
    }

    // Define links

    transactions.forEach((t) => {
      const convertedAmount = Math.abs(
        convertBetweenCurrencies(t.amount, t.currency, selectedCurrency),
      );
      let sourceNode: string;
      let targetNode: string;

      if (t.category === "Transfer") {
        if (t.amount < 0) {
          // Debit - money leaving an account
          sourceNode = `Account: ${t.account}`;
          targetNode = "Transfer Out";
        } else {
          // Credit - money entering an account
          sourceNode = "Transfer In";
          targetNode = `Account: ${t.account}`;
        }
      } else if (t.amount > 0) {
        // Income flow
        sourceNode = `Income: ${t.category}`;
        targetNode = `Account: ${t.account}`;
      } else {
        // Expense flow
        sourceNode = `Account: ${t.account}`;
        targetNode = `Expense: ${t.category}`;
      }

      if (nodeMap.has(sourceNode) && nodeMap.has(targetNode)) {
        const sourceIndex = nodeMap.get(sourceNode)!;
        const targetIndex = nodeMap.get(targetNode)!;
        const linkKey = `${sourceIndex}-${targetIndex}`;

        if (linkMap.has(linkKey)) {
          linkMap.get(linkKey)!.value += convertedAmount;
        } else {
          linkMap.set(linkKey, {
            source: sourceIndex,
            target: targetIndex,
            value: convertedAmount,
          });
        }
      }
    });

    // Convert map to array
    const links = Array.from(linkMap.values());

    // Filter out links with zero value
    const filteredLinks = links.filter((link) => link.value > 0);

    // Calculate dynamic height based on the number of nodes to prevent excessive white space
    const dynamicHeight = Math.max(150, nodes.length * 40);

    return {
      sankeyData: { nodes, links: filteredLinks },
      chartHeight: dynamicHeight,
    };
  }, [transactions, accounts, selectedCurrency, convertBetweenCurrencies]);

  return (
    <ThemedCard className="col-span-1 md:col-span-2">
      <ThemedCardHeader>
        <ThemedCardTitle className="app-gradient-title">
          Financial Flow (Sankey Chart)
        </ThemedCardTitle>
        <ThemedCardDescription>
          Visualizes the flow of money from income sources through accounts to
          expense categories.
          <span className="md:hidden block mt-2 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">
            Tip: Rotate device to landscape for a better view
          </span>
        </ThemedCardDescription>
      </ThemedCardHeader>
      <ThemedCardContent>
        {sankeyData.nodes.length > 1 && sankeyData.links.length > 0 ? (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <Sankey
              data={sankeyData}
              nodePadding={50}
              margin={{
                left: 120,
                right: 130,
                top: 5,
                bottom: 5,
              }}
              link={<FlowLink />}
              node={<FlowNode />}
            >
              <Tooltip
                formatter={(value: unknown) => formatCurrency(value as number)}
              />
            </Sankey>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-center">
            <p className="text-muted-foreground">
              Not enough data to display the Sankey chart. Please add more
              transactions.
            </p>
          </div>
        )}
      </ThemedCardContent>
    </ThemedCard>
  );
};

export default SankeyChart;
