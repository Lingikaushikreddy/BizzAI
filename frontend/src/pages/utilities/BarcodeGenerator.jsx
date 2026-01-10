import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Barcode from 'react-barcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import { getAllItems } from '../../redux/slices/inventorySlice';

const BarcodeGenerator = () => {
    const dispatch = useDispatch();
    const { items } = useSelector((state) => state.inventory);
    const barcodeRef = useRef(null);

    const [formData, setFormData] = useState({
        itemName: '',
        sku: '1234567890',
        price: '',
        barcodeType: 'CODE128',
        quantity: 1,
        paperSize: 'A4',
        includePrice: true,
        includeName: true
    });

    const [showItemSelect, setShowItemSelect] = useState(false);
    const [itemSearchTerm, setItemSearchTerm] = useState('');

    useEffect(() => {
        dispatch(getAllItems());
    }, [dispatch]);

    const barcodeTypes = ['CODE128', 'CODE39', 'EAN13', 'UPC'];
    const paperSizes = ['A4', 'Letter', 'Label 40x20mm', 'Label 50x25mm', 'Label 60x30mm'];

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(itemSearchTerm.toLowerCase()))
    );

    const handleItemSelect = (item) => {
        setFormData({
            ...formData,
            itemName: item.name,
            sku: item.sku || '',
            price: item.sellingPrice,
        });
        setShowItemSelect(false);
        toast.success(`Selected ${item.name}`);
    };

    const downloadPDF = async () => {
        if (!barcodeRef.current) return;

        try {
            const canvas = await html2canvas(barcodeRef.current);
            const imgData = canvas.toDataURL('image/png');

            // For single barcode download
            const pdf = new jsPDF();
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`barcode-${formData.sku || 'generated'}.pdf`);
            toast.success('PDF downloaded successfully');
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF');
        }
    };

    const printBarcode = () => {
        if (!barcodeRef.current) return;

        const content = barcodeRef.current.innerHTML;
        const printWindow = window.open('', '', 'height=600,width=800');

        printWindow.document.write('<html><head><title>Print Barcode</title>');
        printWindow.document.write('<style>body { display: flex; justify-content: center; align-items: center; height: 100vh; }</style>');
        printWindow.document.write('</head><body>');
        // We need to capture the current state of the DOM element or re-render it
        // Since react-barcode renders SVG/Canvas, html2canvas is better for printing too

        html2canvas(barcodeRef.current).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            printWindow.document.body.innerHTML = `<img src="${imgData}" />`;
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        });
    };

    return (
        <Layout>
            <PageHeader
                title="Barcode Generator"
                description="Generate and print barcodes for your products"
                actions={[
                    <button
                        key="print"
                        onClick={printBarcode}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Print Barcode
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
                                    className="w-full px-4 py-2 border rounded-lg bg-input text-main"
                                    placeholder="Enter item name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">SKU / Barcode Number</label>
                                <input
                                    type="text"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg bg-input text-main"
                                    placeholder="Enter SKU"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Price</label>
                                <input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg bg-input text-main"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Barcode Type</label>
                                <select
                                    value={formData.barcodeType}
                                    onChange={(e) => setFormData({ ...formData, barcodeType: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg bg-input text-main"
                                >
                                    {barcodeTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>
                            {/*
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Quantity</label>
                                <input
                                    type="number"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                    className="w-full px-4 py-2 border rounded-lg bg-input text-main"
                                    min="1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Paper Size</label>
                                <select
                                    value={formData.paperSize}
                                    onChange={(e) => setFormData({ ...formData, paperSize: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg bg-input text-main"
                                >
                                    {paperSizes.map(size => <option key={size} value={size}>{size}</option>)}
                                </select>
                            </div>
                             */}
                        </div>
                    </div>

                    <div className="bg-card rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-main mb-4">Print Options</h2>
                        <div className="space-y-3">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.includeName}
                                    onChange={(e) => setFormData({ ...formData, includeName: e.target.checked })}
                                    className="w-5 h-5 text-indigo-600 rounded"
                                />
                                <span className="text-secondary">Include Item Name</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
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
                        <h2 className="text-lg font-bold text-main mb-4">Select from Inventory</h2>
                        <p className="text-secondary mb-4">Auto-fill details from existing items</p>
                        <button
                            onClick={() => setShowItemSelect(true)}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Select Item
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-card rounded-xl shadow-sm p-6 sticky top-4">
                        <h2 className="text-lg font-bold text-main mb-4">Preview</h2>
                        <div className="border-2 border-dashed border-default rounded-lg p-8 text-center flex justify-center items-center bg-white">
                            <div ref={barcodeRef} className="inline-block p-4 text-center">
                                {formData.sku ? (
                                    <>
                                        <Barcode
                                            value={formData.sku}
                                            format={formData.barcodeType}
                                            width={2}
                                            height={60}
                                            displayValue={true}
                                            fontOptions=""
                                            textAlign="center"
                                            textPosition="bottom"
                                            textMargin={2}
                                            fontSize={14}
                                            background="#ffffff"
                                            lineColor="#000000"
                                            margin={10}
                                        />
                                        {formData.includeName && formData.itemName && (
                                            <p className="text-sm font-bold text-black mt-1 font-mono">{formData.itemName}</p>
                                        )}
                                        {formData.includePrice && formData.price && (
                                            <p className="text-lg font-bold text-black font-mono">₹{formData.price}</p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-gray-400">Enter SKU to generate barcode</p>
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-muted mt-2 text-center">Barcode preview</p>

                        <div className="mt-6 space-y-3">
                            <button
                                onClick={handleItemSelect} // This seems wrong, should likely be generate or re-render which happens automatically
                                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium hidden"
                            >
                                Generate Barcode
                            </button>
                            <button
                                onClick={downloadPDF}
                                className="w-full py-3 border border-default text-secondary rounded-lg hover:bg-surface"
                            >
                                Download as PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Item Selection Modal */}
            {showItemSelect && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-default shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-main">Select Item</h3>
                            <button
                                onClick={() => setShowItemSelect(false)}
                                className="text-secondary hover:text-main"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search by name or SKU..."
                                value={itemSearchTerm}
                                onChange={(e) => setItemSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-default rounded-lg bg-input text-main placeholder-muted focus:ring-2 focus:ring-primary"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            {filteredItems.length === 0 ? (
                                <p className="text-center text-secondary py-8">No items found</p>
                            ) : (
                                filteredItems.map((item) => (
                                    <button
                                        key={item._id}
                                        onClick={() => handleItemSelect(item)}
                                        className="w-full p-3 border border-default rounded-lg hover:border-primary hover:bg-indigo-50 dark:hover:bg-[rgb(var(--color-input))] text-left transition flex justify-between items-center"
                                    >
                                        <div>
                                            <div className="font-medium text-main">{item.name}</div>
                                            <div className="text-xs text-secondary">SKU: {item.sku || 'N/A'}</div>
                                        </div>
                                        <div className="font-bold text-primary">₹{item.sellingPrice}</div>
                                    </button>
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
