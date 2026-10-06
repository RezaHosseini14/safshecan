import { TSE_FEE_RATES } from './constants.js';

export interface FeeBreakdown {
  tradeValue: number;
  brokerFee: number;
  exchangeFee: number;
  clearingFee: number;
  technologyFee: number;
  tax: number;
  totalCost: number;
  netValue: number;
}

/**
 * Calculate TSE Buy Fee and total capital needed
 * @param price Price per share (Rials or Tomans)
 * @param quantity Number of shares
 * @param isFarabourse Whether the symbol belongs to Farabourse
 */
export function calculateBuyFee(
  price: number,
  quantity: number,
  isFarabourse = false
): FeeBreakdown {
  const tradeValue = price * quantity;
  const rates = isFarabourse ? TSE_FEE_RATES.FARABOURSE : TSE_FEE_RATES.BOURSE;
  
  const totalCost = Math.round(tradeValue * rates.TOTAL_BUY);
  const netValue = tradeValue + totalCost;

  return {
    tradeValue,
    brokerFee: Math.round(tradeValue * 0.00304),
    exchangeFee: Math.round(tradeValue * 0.00032),
    clearingFee: Math.round(tradeValue * 0.00024),
    technologyFee: Math.round(tradeValue * 0.000112),
    tax: 0,
    totalCost,
    netValue,
  };
}

/**
 * Calculate TSE Sell Fee and net revenue received
 */
export function calculateSellFee(
  price: number,
  quantity: number,
  isFarabourse = false
): FeeBreakdown {
  const tradeValue = price * quantity;
  const rates = isFarabourse ? TSE_FEE_RATES.FARABOURSE : TSE_FEE_RATES.BOURSE;

  const tax = Math.round(tradeValue * rates.SELL_TAX);
  const brokerFee = Math.round(tradeValue * rates.SELL_BROKER);
  const totalCost = tax + brokerFee;
  const netValue = tradeValue - totalCost;

  return {
    tradeValue,
    brokerFee,
    exchangeFee: Math.round(tradeValue * 0.00032),
    clearingFee: Math.round(tradeValue * 0.00024),
    technologyFee: Math.round(tradeValue * 0.000112),
    tax,
    totalCost,
    netValue,
  };
}

/**
 * Calculate Break-Even Price (نقطه سر به سر با احتساب تمام کارمزدها)
 */
export function calculateBreakEvenPrice(buyPrice: number, isFarabourse = false): number {
  const rates = isFarabourse ? TSE_FEE_RATES.FARABOURSE : TSE_FEE_RATES.BOURSE;
  const effectiveTotalRate = 1 + rates.TOTAL_BUY;
  const netSellFactor = 1 - rates.TOTAL_SELL;
  return Math.ceil((buyPrice * effectiveTotalRate) / netSellFactor);
}
