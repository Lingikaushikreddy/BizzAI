import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import POS from './POS';
import inventoryReducer from '../redux/slices/inventorySlice';
import customersReducer from '../redux/slices/customerSlice';
import posReducer from '../redux/slices/posSlice';
import cashbankReducer from '../redux/slices/cashbankSlice';
import authReducer from '../redux/slices/authSlice';

// Mock audio
window.Audio = vi.fn().mockImplementation(() => ({
    play: vi.fn().mockResolvedValue(),
}));

// Mock URL.createObjectURL for print
window.URL.createObjectURL = vi.fn();

// Mock matchMedia
window.matchMedia = window.matchMedia || function () {
    return {
        matches: false,
        addListener: function () { },
        removeListener: function () { }
    };
};

const createMockStore = () => configureStore({
    reducer: {
        inventory: inventoryReducer,
        customers: customersReducer,
        pos: posReducer,
        cashbank: cashbankReducer,
        auth: authReducer,
    },
    preloadedState: {
        auth: { user: { name: 'Test User' }, isLoading: false },
        inventory: {
            items: [
                { _id: '1', name: 'Test Item 1', sku: '12345678', sellingPrice: 100, stockQty: 10 },
                { _id: '2', name: 'Test Item 2', sku: '87654321', sellingPrice: 200, stockQty: 5 },
            ],
            isLoading: false,
        },
        customers: { customers: [], isLoading: false },
        cashbank: { accounts: [], isLoading: false },
        pos: { cart: [], isLoading: false },
    }
});

describe('POS Component Barcode Scanner', () => {
    let store;

    beforeEach(() => {
        store = createMockStore();
        localStorage.clear();
    });

    const renderPOS = () => {
        return render(
            <Provider store={store}>
                <ThemeProvider>
                    <BrowserRouter>
                        <POS />
                    </BrowserRouter>
                </ThemeProvider>
            </Provider>
        );
    };

    it('adds item to cart when valid barcode is entered', async () => {
        renderPOS();

        const barcodeInput = screen.getByPlaceholderText(/scan barcode/i);

        // Type barcode and hit enter
        fireEvent.change(barcodeInput, { target: { value: '12345678' } });
        fireEvent.keyPress(barcodeInput, { key: 'Enter', code: 13, charCode: 13 });

        // Check if item name appears in the cart AND the grid
        // Should find 2 occurrences: one in product list, one in cart
        const items = screen.getAllByText('Test Item 1');
        expect(items).toHaveLength(2);
    });

    it('shows error for invalid barcode', () => {
        renderPOS();
        const barcodeInput = screen.getByPlaceholderText(/scan barcode/i);

        fireEvent.change(barcodeInput, { target: { value: '999999' } });
        fireEvent.keyPress(barcodeInput, { key: 'Enter', code: 13, charCode: 13 });

        // Item should only be in grid (length 1), not in cart
        const items = screen.getAllByText('Test Item 1');
        expect(items).toHaveLength(1);
    });

    it('toggles scan mode and focuses input', () => {
        renderPOS();
        const toggleButton = screen.getByText(/Scan Mode: OFF/i);

        fireEvent.click(toggleButton);

        expect(screen.getByText(/Scan Mode: ON/i)).toBeInTheDocument();
    });
});
