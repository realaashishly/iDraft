"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface DetailProps {
  title: string;
  data: any;
}

// A small component to display a single stat
function StatCard({ title, value, change, percentChange }: any) {
  const isPositive = change ? parseFloat(change) >= 0 : null;
  const colorClass = isPositive ? "text-green-400" : "text-red-400";
  
  return (
    <Card className="bg-zinc-800 border-zinc-700 text-zinc-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-white">{value}</div>
        {change && (
          <div className={`flex items-center gap-1 text-sm ${colorClass}`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {change} ({percentChange}%)
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AssetDetailView({ title, data }: DetailProps) {
  // We check which keys are present to know what to render
  const isCrypto = data.marketCap;
  const isForex = data.open && !data.volume;
  const isCommodity = data.percentChange;

  const formatPrice = (price: string) => {
    return (price ? `$${parseFloat(price).toFixed(2)}` : "N/A");
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
          title="Current Price"
          value={formatPrice(data.price)}
          change={isCommodity ? data.change : null}
          percentChange={isCommodity ? data.percentChange : null}
        />
        
        {isForex && <StatCard title="Open" value={formatPrice(data.open)} />}
        {isForex && <StatCard title="High" value={formatPrice(data.high)} />}
        {isForex && <StatCard title="Low" value={formatPrice(data.low)} />}

        {isCrypto && <StatCard title="Market Cap" value={`$${parseFloat(data.marketCap).toLocaleString()}`} />}
        {isCrypto && <StatCard title="Volume (24h)" value={parseFloat(data.volume).toLocaleString()} />}
        {isCrypto && <StatCard title="Open" value={formatPrice(data.open)} />}
        {isCrypto && <StatCard title="High" value={formatPrice(data.high)} />}
        {isCrypto && <StatCard title="Low" value={formatPrice(data.low)} />}
        
        {isCommodity && <StatCard title="Date" value={data.date} />}
      </div>
      
      <div className="pt-6">
        <h2 className="text-xl font-semibold text-white mb-4">Price Chart</h2>
        <div className="h-96 rounded-lg border border-zinc-700 bg-zinc-800 flex items-center justify-center text-zinc-400">
          (A price chart for {title} would be rendered here using another API call)
        </div>
      </div>
    </div>
  );
}