// app/crypto-markets/_lib/mockData.ts

// This new file defines the shape of our data


// Generate a mock sparkline
const generateSparkline = (base: number, volatility: number, length: number) => {
    const data = [];
    let current = base;
    for (let i = 0; i < length; i++) {
        data.push(current);
        current += (Math.random() - 0.5) * volatility;
    }
    return data;
};

export const mockCryptoData: CryptoAsset[] = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    price: 68850.47,
    change: 2.75,
    volume24h: 38_500_000_000,
    marketCap: 1_350_000_000_000,
    circulatingSupply: 19_600_000,
    iconUrl: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=026",
    sparkline: generateSparkline(65000, 3000, 20),
  },
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    price: 2461.52,
    change: 2.17,
    volume24h: 20_200_000_000,
    marketCap: 295_000_000_000,
    circulatingSupply: 120_000_000,
    iconUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=026",
    sparkline: generateSparkline(2300, 100, 20),
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "SOL",
    price: 16.96,
    change: -1.66,
    volume24h: 2_000_000_000,
    marketCap: 7_500_000_000,
    circulatingSupply: 440_000_000,
    iconUrl: "https://cryptologos.cc/logos/solana-sol-logo.svg?v=026",
    sparkline: generateSparkline(17, 0.5, 20),
  },
  {
    id: "dogecoin",
    name: "Dogecoin",
    symbol: "DOGE",
    price: 0.3349,
    change: 2.60,
    volume24h: 1_200_000_000,
    marketCap: 48_000_000_000,
    circulatingSupply: 140_000_000_000,
    iconUrl: "https://cryptologos.cc/logos/dogecoin-doge-logo.svg?v=026",
    sparkline: generateSparkline(0.3, 0.02, 20),
  },
  {
    id: "monero",
    name: "Monero",
    symbol: "XMR",
    price: 133.20,
    change: -2.50,
    volume24h: 1_500_000_000,
    marketCap: 2_400_000_000,
    circulatingSupply: 18_000_000,
    iconUrl: "https://cryptologos.cc/logos/monero-xmr-logo.svg?v=026",
    sparkline: generateSparkline(135, 5, 20),
  },
  {
    id: "litecoin",
    name: "Litecoin",
    symbol: "LTC",
    price: 67.38,
    change: -1.66,
    volume24h: 2_300_000_000,
    marketCap: 4_900_000_000,
    circulatingSupply: 73_000_000,
    iconUrl: "https://cryptologos.cc/logos/litecoin-ltc-logo.svg?v=026",
    sparkline: generateSparkline(68, 2, 20),
  },
  {
    id: "tether-usd",
    name: "Tether USD",
    symbol: "USDT",
    price: 1.00,
    change: -0.01, // Stablecoin, minimal change
    volume24h: 70_000_000_000,
    marketCap: 100_000_000_000,
    circulatingSupply: 100_000_000_000,
    iconUrl: "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=026",
    sparkline: generateSparkline(1.00, 0.001, 20),
  },
  {
    id: "cardano",
    name: "Cardano",
    symbol: "ADA",
    price: 0.3349,
    change: 8.30,
    volume24h: 900_000_000,
    marketCap: 12_000_000_000,
    circulatingSupply: 35_000_000_000,
    iconUrl: "https://cryptologos.cc/logos/cardano-ada-logo.svg?v=026",
    sparkline: generateSparkline(0.31, 0.01, 20),
  },
  {
    id: "binance-coin",
    name: "BNB",
    symbol: "BNB",
    price: 515.25,
    change: 6.80,
    volume24h: 8_500_000_000,
    marketCap: 78_000_000_000,
    circulatingSupply: 150_000_000,
    iconUrl: "https://cryptologos.cc/logos/binance-coin-bnb-logo.svg?v=026",
    sparkline: generateSparkline(480, 20, 20),
  },
  {
    id: "xrp",
    name: "XRP",
    symbol: "XRP",
    price: 0.5058,
    change: 1.04,
    volume24h: 3_000_000_000,
    marketCap: 27_000_000_000,
    circulatingSupply: 53_000_000_000,
    iconUrl: "https://cryptologos.cc/logos/xrp-xrp-logo.svg?v=026",
    sparkline: generateSparkline(0.49, 0.01, 20),
  },
];