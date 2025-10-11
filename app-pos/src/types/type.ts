export interface MenuData {
  menuID: string;
  menuName: string;
  price: number;
  menuDetail?: string;
  imageUrl?: string;
  categories?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuFormData {
  menuName: string;
  price: number;
  menuDetail?: string;
  imageFile: File | null;
  categories?: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CategoryData {
  categoryID: string;
  categoryName: string;
}

export interface OrderData {
  orderID: string;
  orderDescription?: string;
  orderDateTime: Date;
  userID: string;
  orderMenus: OrderMenuData[];
}

export interface OrderMenuData {
  orderID: string;
  menuID: string;
  quantity: number;
  menu: MenuData;
}

export interface ReceiptData {
  receiptID: string;
  orderID: string;
  receiptDate: Date;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  amountPaid: number;
  changeAmount: number;
  paymentMethod: 'CASH' | 'QR';
}