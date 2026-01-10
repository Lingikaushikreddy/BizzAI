import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Barcode from 'react-barcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getAllItems } from '../../redux/slices/inventorySlice';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';

const BarcodeGenerator = () => {
    const dispatch = useDispatch();
    const { items, isLoading } = useSelector((state) => state.inventory);

    const [formData, setFormData] = useState({
        itemName: '',
        sku: '',
        price: '',
        barcodeType: 'CODE128',
        quantity: 1,
        includePrice: true,
        includeName: true,
        width: 2,
        height: 100,
        fontSize: 16
    });

    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const barcodeRef = useRef(null);

    useEffect(() => {
        if (showInventoryModal && items.length === 0) {
            dispatch(getAllItems());
        }
    }, [showInventoryModal, dispatch, items.length]);

    const barcodeTypes = ['CODE128', 'CODE39', 'EAN13', 'UPC'];

    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=600,width=800');
        const content = barcodeRef.current.innerHTML;

        printWindow.document.write('<html><head><title>Print Barcodes</title>');
        printWindow.document.write('<style>body { font-family: sans-serif; display: flex; flex-wrap: wrap; gap: 20px; text-align: center; } .barcode-item { border: 1px dashed #ccc; padding: 10px; break-inside: avoid; }</style>');
        printWindow.document.write('</head><body>');

        // Repeat content based on quantity
        for (let i = 0; i < formData.quantity; i++) {
            printWindow.document.write(`<div class="barcode-item">${content}</div>`);
        }

        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
    };

    const handleDownloadPDF = async () => {
        if (!barcodeRef.current) return;

        try {
            const canvas = await html2canvas(barcodeRef.current);
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF();

            let x = 10;
            let y = 10;
            const imgWidth = 60; // Adjust based on your needs
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            for (let i = 0; i < formData.quantity; i++) {
                if (y + imgHeight > 280) { // New page if near bottom
                    pdf.addPage();
                    y = 10;
                    x = 10;
                }

                pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

                // Grid layout logic (simple)
                x += imgWidth + 10;
                if (x + imgWidth > 200) {
                    x = 10;
                    y += imgHeight + 10;
                }
            }

            pdf.save(`barcode-${formData.sku || 'generated'}.pdf`);
        } catch (error) {
            console.error("Error generating PDF", error);
        }
    };

    const handleSelectItem = (item) => {
        setFormData({
            ...formData,
            itemName: item.name,
            sku: item.sku || '',
            price: item.sellingPrice || '',
        });
        setShowInventoryModal(false);
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sku && item.sku.includes(searchTerm))
    );

    return (
        <Layout>
            <PageHeader
                title="Barcode Generator"
                description="Generate and print barcodes for your products"
                actions={[
                    <button key="print" onClick={handlePrint} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                        Print Barcodes
                    </button>
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-main mb-4">Barcode Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Item Name</label>
                                <input
                                    type="text"
                                    value={formData.itemName}
                                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                                    className="w-full px-4 py-2 border border-default rounded-lg bg-input text-main"
                                    placeholder="Enter item name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">SKU / Barcode Number</label>
                                <input
                                    type="text"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                    className="w-full px-4 py-2 border border-default rounded-lg bg-input text-main"
                                    placeholder="Enter SKU"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Price</label>
                                <input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full px-4 py-2 border border-default rounded-lg bg-input text-main"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Barcode Type</label>
                                <select
                                    value={formData.barcodeType}
                                    onChange={(e) => setFormData({ ...formData, barcodeType: e.target.value })}
                                    className="w-full px-4 py-2 border border-default rounded-lg bg-input text-main"
                                >
                                    {barcodeTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Quantity to Print</label>
                                <input
                                    type="number"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                    className="w-full px-4 py-2 border border-default rounded-lg bg-input text-main"
                                    min="1"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-main mb-4">Display Options</h2>
                        <div className="space-y-3">
                            <label className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={formData.includeName}
                                    onChange={(e) => setFormData({ ...formData, includeName: e.target.checked })}
                                    className="w-5 h-5 text-indigo-600 rounded"
                                />
                                <span className="text-secondary">Include Item Name</span>
                            </label>
                            <label className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={formData.includePrice}
                                    onChange={(e) => setFormData({ ...formData, includePrice: e.target.checked })}
                                    className="w-5 h-5 text-indigo-600 rounded"
                                />
                                <span className="text-secondary">Include Price</span>
                            </label>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-main mb-4">Load from Inventory</h2>
                        <p className="text-secondary mb-4">Select an item from your inventory to auto-fill details.</p>
                        <button
                            onClick={() => setShowInventoryModal(true)}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                            Select Item
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-card rounded-xl shadow-sm p-6 sticky top-4">
                        <h2 className="text-lg font-bold text-main mb-4">Live Preview</h2>
                        <div className="border-2 border-dashed border-default rounded-lg p-8 flex justify-center items-center bg-white">
                            <div ref={barcodeRef} className="text-center p-4">
                                {formData.includeName && formData.itemName && (
                                    <p className="font-bold text-black mb-1 text-sm">{formData.itemName}</p>
                                )}
                                {formData.sku ? (
                                    <Barcode
                                        value={formData.sku}
                                        format={formData.barcodeType}
                                        width={formData.width}
                                        height={formData.height}
                                        fontSize={formData.fontSize}
                                    />
                                ) : (
                                    <p className="text-gray-400 text-sm">Enter SKU to generate</p>
                                )}
                                {formData.includePrice && formData.price && (
                                    <p className="font-bold text-black mt-1 text-lg">₹{formData.price}</p>
                                )}
                            </div>
                        </div>
                        <div className="mt-6 space-y-3">
                            <button
                                onClick={handlePrint}
                                disabled={!formData.sku}
                                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
                            >
                                Print Barcodes
                            </button>
                            <button
                                onClick={handleDownloadPDF}
                                disabled={!formData.sku}
                                className="w-full py-3 border border-default text-secondary rounded-lg hover:bg-surface disabled:opacity-50"
                            >
                                Download as PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inventory Modal */}
            {showInventoryModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-main">Select Item</h3>
                            <button onClick={() => setShowInventoryModal(false)} className="text-secondary hover:text-main">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-default rounded-lg bg-input text-main mb-4"
                            autoFocus
                        />
                        <div className="flex-1 overflow-y-auto space-y-2">
                            {isLoading ? (
                                <p className="text-center py-4">Loading...</p>
                            ) : filteredItems.length === 0 ? (
                                <p className="text-center py-4 text-secondary">No items found</p>
                            ) : (
                                filteredItems.map(item => (
                                    <div
                                        key={item._id}
                                        onClick={() => handleSelectItem(item)}
                                        className="p-3 border border-default rounded-lg hover:bg-surface cursor-pointer flex justify-between items-center"
                                    >
                                        <div>
                                            <div className="font-medium text-main">{item.name}</div>
                                            <div className="text-sm text-secondary">SKU: {item.sku || 'N/A'}</div>
                                        </div>
                                        <div className="font-bold text-primary">₹{item.sellingPrice}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default BarcodeGenerator;
