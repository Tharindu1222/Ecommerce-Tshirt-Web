export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 't-shirt' | 'hoodie';
  image_url: string;
  sizes: string[];
  colors: string[];
  stock: number;
  featured: boolean;
  created_at: string;
  flashDeal?: {
    id: string;
    discount_percentage: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
  };
}

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  size: string;
  color: string;
  product?: Product;
}

export interface Order {
  id: string;
  email: string;
  total_amount: number;
  status: string;
  shipping_address: ShippingAddress;
  created_at: string;
}

export interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}
