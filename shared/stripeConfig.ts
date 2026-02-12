/**
 * Spark 充值系統配置
 * Lulubaby Pay-as-you-go 模式
 */

// Spark 充值包配置（Stripe 一次性付款產品）
export const SPARK_PACKAGES = {
  snack: { name: "小食包", nameEn: "Snack Pack", price: 88, currency: "HKD", sparks: 1000, bonus: 0, tagline: "淺嘗 AI 的威力" },
  energy: { name: "能量包", nameEn: "Energy Pack", price: 288, currency: "HKD", sparks: 3000, bonus: 1000, tagline: "最受歡迎的選擇" },
  super: { name: "超級包", nameEn: "Super Pack", price: 888, currency: "HKD", sparks: 10000, bonus: 5000, tagline: "釋放全部潛能" },
  flagship: { name: "旗艦包", nameEn: "Flagship Pack", price: 2888, currency: "HKD", sparks: 40000, bonus: 20000, tagline: "企業級用量" },
} as const;

export type SparkPackageType = keyof typeof SPARK_PACKAGES;

// Spark 消耗標準
export const SPARK_COSTS = {
  chatMessage: 1,                    // 每條 AI 對話訊息
  knowledgeBasePerMB: 10,            // 每 MB 知識庫上傳（從 100 降至 10）
  knowledgeBaseOverlimitPerChat: 3,  // 知識庫超過免費額度時，每次對話額外收費（從 5 降至 3）
  
  superpowerActivation: 30,          // 超能力首次啟用費用（從 50 降至 30，改為一次性）
} as const;

// Stripe Price IDs (LIVE mode - Lulubaby Stripe account)
// 注意：flagship 取代了原來的 unlimited
export const SPARK_PRICE_IDS: Record<SparkPackageType, string> = {
  snack: process.env.STRIPE_PRICE_SNACK || "price_1SzXdcGvm1Hl1zO1EaZC8QgB",
  energy: process.env.STRIPE_PRICE_ENERGY || "price_1SzXdfGvm1Hl1zO1lHoFvSgc",
  super: process.env.STRIPE_PRICE_SUPER || "price_1SzXdhGvm1Hl1zO1XZDRKMDp",
  flagship: process.env.STRIPE_PRICE_FLAGSHIP || "price_1SzsHhGvm1Hl1zO13xa3gqOj",
};

// 新用戶免費 Spark 額度
export const FREE_SPARK_AMOUNT = 100;
