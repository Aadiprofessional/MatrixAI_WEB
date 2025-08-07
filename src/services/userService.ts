interface UserInfo {
  name: string;
  age: number;
  gender: string;
  email: string;
  dp_url: string;
  subscription_active: boolean;
}

interface UserInfoResponse {
  success: boolean;
  data: UserInfo;
}

interface UserCoinsResponse {
  success: boolean;
  coins: number;
  expiry: string | null;
}

interface Transaction {
  id: number;
  uid: string;
  transaction_name: string;
  coin_amount: number;
  remaining_coins: number;
  status: string;
  time: string;
}

interface TransactionsResponse {
  success: boolean;
  data: Transaction[];
}

interface SubtractCoinsResponse {
  success: boolean;
  message: string;
}

interface Coupon {
  id: number;
  coupon_name: string;
  coupon_amount: number;
  valid_till: string;
  only_new_users: boolean;
  active: boolean;
  uid: string[] | null;
}

interface CouponResponse {
  success: boolean;
  data: Coupon[];
}

interface Order {
  id: number;
  uid: string;
  plan_name: string;
  total_price: number;
  coins_added: number;
  plan_valid_till: string;
  coupon_id: number | null;
  status: string;
  created_at: string;
}

interface OrderResponse {
  success: boolean;
  data: Order[];
}

interface SubscriptionResponse {
  success: boolean;
  message: string;
}

interface EditUserResponse {
  success: boolean;
  message: string;
}

const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

export const userService = {
  // Get user profile information
  getUserInfo: async (uid: string): Promise<UserInfoResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/user/userinfo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to get user info');
    }

    return response.json();
  },

  // Get user's current coin balance
  getUserCoins: async (uid: string): Promise<UserCoinsResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/user/getUserCoins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to get user coins');
    }

    return response.json();
  },

  // Get user's transaction history
  getAllTransactions: async (uid: string): Promise<TransactionsResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/user/AllTransactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to get transactions');
    }

    return response.json();
  },

  // Subtract coins (internal use)
  subtractCoins: async (uid: string, coinAmount: number, transactionName: string): Promise<SubtractCoinsResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/user/subtractCoins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        coinAmount,
        transaction_name: transactionName
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to subtract coins');
    }

    return response.json();
  },

  // Get user coupons
  getCoupon: async (uid: string): Promise<CouponResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/user/getCoupon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to get coupons');
    }

    return response.json();
  },

  // Get user orders
  getUserOrder: async (uid: string): Promise<OrderResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/user/getUserOrder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to get user orders');
    }

    return response.json();
  },

  // Buy subscription
  BuySubscription: async (uid: string, plan: string, totalPrice: number, couponId?: number): Promise<SubscriptionResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/user/BuySubscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        plan,
        totalPrice,
        couponId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to buy subscription');
    }

    return response.json();
  },

  // Edit user profile
  editUser: async (uid: string, name?: string, age?: number, gender?: string, dp_url?: string): Promise<EditUserResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/user/edituser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        name,
        age,
        gender,
        dp_url
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to edit user');
    }

    return response.json();
  }
};