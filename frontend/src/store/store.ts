import { configureStore } from '@reduxjs/toolkit';
// Import reducers here as they are created
// import chargePointsReducer from './slices/chargePointsSlice';
// import transactionsReducer from './slices/transactionsSlice';

export const store = configureStore({
  reducer: {
    // chargePoints: chargePointsReducer,
    // transactions: transactionsReducer,
    // Empty reducer object to avoid Redux error
    _: (state = {}) => state,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;



