import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
  tableNumber: string;
  note: string;
  isOpen: boolean;
}

const initialState: CartState = {
  items: [],
  tableNumber: "",
  note: "",
  isOpen: false,
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setTableNumber(state, action: PayloadAction<string>) {
      state.tableNumber = action.payload;
    },
    addItem(state, action: PayloadAction<Omit<CartItem, "quantity">>) {
      const existing = state.items.find(i => i.menuItemId === action.payload.menuItemId);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
    },
    removeItem(state, action: PayloadAction<number>) {
      state.items = state.items.filter(i => i.menuItemId !== action.payload);
    },
    incrementItem(state, action: PayloadAction<number>) {
      const item = state.items.find(i => i.menuItemId === action.payload);
      if (item) item.quantity += 1;
    },
    decrementItem(state, action: PayloadAction<number>) {
      const item = state.items.find(i => i.menuItemId === action.payload);
      if (item) {
        if (item.quantity <= 1) {
          state.items = state.items.filter(i => i.menuItemId !== action.payload);
        } else {
          item.quantity -= 1;
        }
      }
    },
    setNote(state, action: PayloadAction<string>) {
      state.note = action.payload;
    },
    clearCart(state) {
      state.items = [];
      state.note = "";
    },
    toggleCart(state) {
      state.isOpen = !state.isOpen;
    },
    openCart(state) {
      state.isOpen = true;
    },
    closeCart(state) {
      state.isOpen = false;
    },
  },
});

export const {
  setTableNumber,
  addItem,
  removeItem,
  incrementItem,
  decrementItem,
  setNote,
  clearCart,
  toggleCart,
  openCart,
  closeCart,
} = cartSlice.actions;

// Selectors
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartTotal = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
export const selectCartCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
export const selectTableNumber = (state: { cart: CartState }) => state.cart.tableNumber;
export const selectNote = (state: { cart: CartState }) => state.cart.note;
export const selectIsCartOpen = (state: { cart: CartState }) => state.cart.isOpen;

export default cartSlice.reducer;
