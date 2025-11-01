import { TrendingDown, TrendingUp } from "lucide-react";

function StockWidget() {
  const stockData = [
    { name: 'Apple', symbol: 'AAPL', price: '185.30', change: '+1.20', trend: TrendingUp, color: 'text-green-500' },
    { name: 'Google', symbol: 'GOOGL', price: '139.80', change: '-0.45', trend: TrendingDown, color: 'text-red-500' },
    { name: 'Microsoft', symbol: 'MSFT', price: '340.10', change: '+2.50', trend: TrendingUp, color: 'text-green-500' },
    { name: 'Tesla', symbol: 'TSLA', price: '212.90', change: '-5.10', trend: TrendingDown, color: 'text-red-500' },
  ];

  // Helper to show an emoji or initial
  const getIcon = (symbol: string) => {
    switch (symbol) {
        case 'AAPL': return '🍎';
        case 'GOOGL': return '🇬';
        case 'MSFT': return '🪟';
        case 'TSLA': return '🚗';
        default: return symbol.substring(0, 1);
    }
  }

  return (
    <div className="w-full space-y-2">
      {/* --- THIS LINE IS CHANGED --- */}
      {stockData.slice(0, 3).map((item) => ( 
        <div key={item.symbol} className="flex items-center justify-between">
          {/* Left Side: Icon and Name */}
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-full bg-muted/50 flex items-center justify-center font-bold text-sm">
              {getIcon(item.symbol)}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium">{item.name}</span>
              <span className="text-[10px] text-muted-foreground">{item.symbol}</span>
            </div>
          </div>
          
          {/* Right Side: Price and Change */}
          <div className="flex flex-col items-end">
             <span className="text-xs font-medium">{item.price}</span>
             <div className={`flex items-center text-xs font-medium ${item.color}`}>
               <item.trend size={10} className="mr-0.5" />
               {item.change}
             </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default StockWidget;