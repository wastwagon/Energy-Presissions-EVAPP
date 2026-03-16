/**
 * Wallet Redux Slice
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { walletApi } from '../../services/walletApi';
import { WalletBalance, WalletTransaction, ApiError } from '../../types';

interface WalletState {
  balance: WalletBalance | null;
  availableBalance: {
    available: number;
    reserved: number;
    total: number;
    currency: string;
  } | null;
  transactions: WalletTransaction[];
  isLoading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  balance: null,
  availableBalance: null,
  transactions: [],
  isLoading: false,
  error: null,
};

export const fetchBalance = createAsyncThunk(
  'wallet/fetchBalance',
  async (userId?: number, { rejectWithValue }) => {
    try {
      return await walletApi.getBalance(userId);
    } catch (error: any) {
      return rejectWithValue(
        (error as ApiError).message || 'Failed to fetch balance'
      );
    }
  }
);

export const fetchAvailableBalance = createAsyncThunk(
  'wallet/fetchAvailableBalance',
  async (userId?: number, { rejectWithValue }) => {
    try {
      return await walletApi.getAvailableBalance(userId);
    } catch (error: any) {
      return rejectWithValue(
        (error as ApiError).message || 'Failed to fetch available balance'
      );
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  'wallet/fetchTransactions',
  async (
    { userId, limit, offset }: { userId: number; limit?: number; offset?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await walletApi.getTransactions(userId, limit, offset);
      return response.transactions;
    } catch (error: any) {
      return rejectWithValue(
        (error as ApiError).message || 'Failed to fetch transactions'
      );
    }
  }
);

export const topUp = createAsyncThunk(
  'wallet/topUp',
  async (
    { userId, amount, adminNote }: { userId: number; amount: number; adminNote?: string },
    { rejectWithValue }
  ) => {
    try {
      return await walletApi.topUp(userId, amount, adminNote);
    } catch (error: any) {
      return rejectWithValue(
        (error as ApiError).message || 'Top-up failed'
      );
    }
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateBalance: (state, action: PayloadAction<number>) => {
      if (state.balance) {
        state.balance.balance = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch balance
    builder
      .addCase(fetchBalance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBalance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.balance = action.payload;
      })
      .addCase(fetchBalance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch available balance
    builder
      .addCase(fetchAvailableBalance.fulfilled, (state, action) => {
        state.availableBalance = action.payload;
      });

    // Fetch transactions
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Top up
    builder
      .addCase(topUp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(topUp.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update balance
        if (state.balance) {
          state.balance.balance = action.payload.balanceAfter;
        }
        // Add transaction to list
        state.transactions.unshift(action.payload);
      })
      .addCase(topUp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, updateBalance } = walletSlice.actions;
export default walletSlice.reducer;
