import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import POS from './POS';
import inventoryReducer from '../redux/slices/inventorySlice';
import customerReducer from '../redux/slices/customerSlice';
import posReducer from '../redux/slices/posSlice';
import cashbankReducer from '../redux/slices/cashbankSlice';

// Mock other reducers that are needed by the store but not relevant for this specific test
const mockReducer = (state = {}, action) => state;

// Create a mock store function
const createMockStore = (initialState) => {
  return configureStore({
    reducer: {
      inventory: inventoryReducer,
      customers: customerReducer,
      pos: posReducer,
      cashbank: cashbankReducer,
      auth: mockReducer, // Mock auth if needed
    },
    preloadedState: initialState,
  });
};

describe('POS Component Barcode Integration', () => {
  let store;
  const mockItems = [
    {
      _id: '1',
      name: 'Test Product 1',
      sku: '123456789',
      sellingPrice: 100,
      stockQty: 10,
      unit: 'pcs',
    },
    {
      _id: '2',
      name: 'Test Product 2',
      sku: '987654321',
      sellingPrice: 200,
      stockQty: 5,
      unit: 'pcs',
    },
  ];

  beforeEach(() => {
    // Setup initial state
    const initialState = {
      inventory: {
        items: mockItems,
        isLoading: false,
        isSuccess: true,
        isError: false,
        message: '',
      },
      customers: {
        customers: [],
      },
      cashbank: {
        accounts: [],
      },
      pos: {
        invoice: null,
        isLoading: false,
        isSuccess: false,
        isError: false,
        message: '',
      },
      auth: {
          user: { token: 'mock-token'}
      }
    };
    store = createMockStore(initialState);

    // Mock window.alert
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    // Mock dispatch to prevent actual API calls if they happen in useEffect
    // However, we are using a real store with reducers, but we might want to mock the async thunks if they are called.
    // In POS.jsx, useEffect calls dispatch(getAllItems()), etc.
    // Since we provided preloadedState, the reducers will have data.
    // The async thunks might still fire. For this unit test, we can mock the axios calls or just ignore them if they fail gracefully.
    // Alternatively, we can mock the async thunks.
  });

  it('adds item to cart when valid barcode is scanned', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
            <ThemeProvider>
                <POS />
            </ThemeProvider>
        </BrowserRouter>
      </Provider>
    );

    // Find barcode input
    const barcodeInput = screen.getByPlaceholderText(/Scan barcode or type SKU/i);

    // Type barcode
    fireEvent.change(barcodeInput, { target: { value: '123456789' } });

    // Press Enter
    fireEvent.keyPress(barcodeInput, { key: 'Enter', code: 13, charCode: 13 });

    // Check if item is added to cart
    // The cart is displayed in the "Right Side - Cart & Checkout" section.
    // We look for the item name in the document.
    // Since the product is also in the product list grid, we will have multiple elements.
    // We should check specifically within the cart section or just check that it appears more than once (one in grid, one in cart)
    const productElements = screen.getAllByText('Test Product 1');
    expect(productElements.length).toBeGreaterThan(1);

    // Check price
    expect(screen.getAllByText('₹100.00').length).toBeGreaterThan(0);
  });

  it('shows alert when invalid barcode is scanned', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
            <ThemeProvider>
                <POS />
            </ThemeProvider>
        </BrowserRouter>
      </Provider>
    );

    const barcodeInput = screen.getByPlaceholderText(/Scan barcode or type SKU/i);

    fireEvent.change(barcodeInput, { target: { value: 'INVALID' } });
    fireEvent.keyPress(barcodeInput, { key: 'Enter', code: 13, charCode: 13 });

    expect(window.alert).toHaveBeenCalledWith('Product not found with this barcode!');
  });
});
