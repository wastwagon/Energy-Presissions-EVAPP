/**
 * Transactions Redux Slice
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { transactionsApi } from '../../services/transactionsApi';
import { Transaction, ApiError } from '../../types';

interface TransactionsState {
  transactions: Transaction[];
  activeTransactions: Transaction[];
  selectedTransaction: Transaction | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TransactionsState = {
  transactions: [],
  activeTransactions: [],
  selectedTransaction: null,
  isLoading: false,
  error: null,
};

export const fetchUserTransactions = createAsyncThunk(
  'transactions/fetchUser',
  async (userId: number, { rejectWithValue }) => {
    try {
      return await transactionsApi.getUserTransactions(userId);
    } catch (error: any) {
      return rejectWithValue(
        (error as ApiError).message || 'Failed to fetch transactions'
      );
    }
  }
);

export const fetchActiveTransactions = createAsyncThunk(
  'transactions/fetchActive',
  async (userId: number, { rejectWithValue }) => {
    try {
      return await transactionsApi.getActiveTransactions(userId);
    } catch (error: any) {
      return rejectWithValue(
        (error as ApiError).message || 'Failed to fetch active transactions'
      );
    }
  }
);

export const fetchTransactionById = createAsyncThunk(
  'transactions/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await transactionsApi.getTransactionById(id);
    } catch (error: any) {
      return rejectWithValue(
        (error as ApiError).message || 'Failed to fetch transaction'
      );
    }
  }
);

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    setSelectedTransaction: (state, action: PayloadAction<Transaction | null>) => {
      state.selectedTransaction = action.payload;
    },
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload);
      if (action.payload.status === 'Active') {
        state.activeTransactions.push(action.payload);
      }
    },
    updateTransaction: (state, action: PayloadAction<Transaction>) => {
      const index = state.transactions.findIndex(
        (t) => t.id === action.payload.id
      );
      if (index !== -1) {
        state.transactions[index] = action.payload;
      }
      // Update active transactions
      const activeIndex = state.activeTransactions.findIndex(
        (t) => t.id === action.payload.id
      );
      if (action.payload.status !== 'Active' && activeIndex !== -1) {
        state.activeTransactions.splice(activeIndex, 1);
      } else if (action.payload.status === 'Active' && activeIndex === -1) {
        state.activeTransactions.push(action.payload);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch user transactions
    builder
      .addCase(fetchUserTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchUserTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch active transactions
    builder
      .addCase(fetchActiveTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActiveTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeTransactions = action.payload;
      })
      .addCase(fetchActiveTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch transaction by ID
    builder
      .addCase(fetchTransactionById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransactionById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedTransaction = action.payload;
      })
      .addCase(fetchTransactionById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setSelectedTransaction,
  addTransaction,
  updateTransaction,
  clearError,
} = transactionsSlice.actions;
export default transactionsSlice.reducer;
