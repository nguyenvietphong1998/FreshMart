import { StockBatch } from '../types';

export const SIMULATED_TODAY = new Date(2026, 9, 4); // 2026-10-04

/**
 * Tính số ngày còn lại đến hạn sử dụng
 */
export function getDaysUntilExpiry(expiryDateStr: string, baseDate = SIMULATED_TODAY): number {
  const expiryDate = new Date(expiryDateStr);
  const diffTime = expiryDate.getTime() - baseDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Kiểm tra xem lô hàng đã quá hạn hay chưa
 */
export function isExpired(expiryDateStr: string, baseDate = SIMULATED_TODAY): boolean {
  return getDaysUntilExpiry(expiryDateStr, baseDate) < 0;
}

/**
 * Kiểm tra xem lô hàng có sắp hết hạn (< 7 ngày) hay không
 */
export function isExpiringSoon(expiryDateStr: string, thresholdDays = 7, baseDate = SIMULATED_TODAY): boolean {
  const days = getDaysUntilExpiry(expiryDateStr, baseDate);
  return days >= 0 && days <= thresholdDays;
}

export interface AllocationResult {
  success: boolean;
  allocated: {
    batchId: string;
    batchCode: string;
    quantity: number;
    expiryDate: string;
    daysUntilExpiry: number;
  }[];
  availableTotal: number;
  message?: string;
}

/**
 * Thuật toán phân bổ lô hàng theo nguyên tắc FEFO (First-Expired, First-Out)
 * Chỉ lấy các lô hàng CÒN HẠN (expiryDate >= today), sắp xếp theo hạn sử dụng tăng dần (hết hạn sớm nhất xuất trước).
 */
export function allocateBatchesFEFO(
  productId: string,
  branchId: string,
  requestedQuantity: number,
  allBatches: StockBatch[],
  baseDate = SIMULATED_TODAY
): AllocationResult {
  // Lọc các lô của sản phẩm này tại chi nhánh này, số lượng > 0 và chưa quá hạn
  const validBatches = allBatches
    .filter((b) => b.productId === productId && b.branchId === branchId && b.quantity > 0 && !isExpired(b.expiryDate, baseDate))
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  const availableTotal = validBatches.reduce((acc, b) => acc + b.quantity, 0);

  if (availableTotal < requestedQuantity) {
    return {
      success: false,
      allocated: [],
      availableTotal,
      message: `Tồn kho khả dụng chỉ còn ${availableTotal} (không tính hàng quá hạn), không đủ đáp ứng ${requestedQuantity}.`,
    };
  }

  let remainingToAllocate = requestedQuantity;
  const allocated: AllocationResult['allocated'] = [];

  for (const batch of validBatches) {
    if (remainingToAllocate <= 0) break;

    const takeQty = Math.min(batch.quantity, remainingToAllocate);
    allocated.push({
      batchId: batch.id,
      batchCode: batch.batchCode,
      quantity: takeQty,
      expiryDate: batch.expiryDate,
      daysUntilExpiry: getDaysUntilExpiry(batch.expiryDate, baseDate),
    });

    remainingToAllocate -= takeQty;
  }

  return {
    success: true,
    allocated,
    availableTotal,
  };
}

/**
 * Thống kê tổng quan tồn kho theo các nhóm trạng thái HSD
 */
export function calculateBatchSummary(productId: string, branchId: string, allBatches: StockBatch[]) {
  const batches = allBatches.filter((b) => b.productId === productId && b.branchId === branchId);
  let total = 0;
  let safe = 0;
  let expiringSoon = 0;
  let expired = 0;

  for (const b of batches) {
    total += b.quantity;
    if (isExpired(b.expiryDate)) {
      expired += b.quantity;
    } else if (isExpiringSoon(b.expiryDate, 7)) {
      expiringSoon += b.quantity;
    } else {
      safe += b.quantity;
    }
  }

  return { total, safe, expiringSoon, expired };
}
