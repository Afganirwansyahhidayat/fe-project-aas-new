import { useState, useEffect } from 'react';
import { seeAllPayment } from '../../service/payment'; // sesuaikan path-nya

export default function Payment({ userId }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    country: '',
    province: '',
    subdistrict: '',
    streetAddress: '',
    postcode: '',
    phone: '',
    email: '',
    orderNotes: ''
  });

  const [orderSummary, setOrderSummary] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const currentUserId = userId || user?.id || user?._id;

        if (!currentUserId) {
          throw new Error('User ID not found');
        }


        // fungsi seeAllPayment dari service/payment
        const data = await seeAllPayment(currentUserId);

        if (Array.isArray(data)) {
          setPaymentHistory(data);

          if (data.length > 0) {
            // PERBAIKAN: Gabungkan semua produk dari semua payment
            const allProducts = [];
            let totalSubtotal = 0;
            let totalDiscount = 0;
            let grandTotal = 0;

            data.forEach(payment => {
              if (payment.products && Array.isArray(payment.products)) {
                // Tambahkan semua produk dari payment ini
                payment.products.forEach(product => {
                  allProducts.push({
                    ...product,
                    paymentId: payment._id, // Tambahkan ID payment untuk referensi
                    paymentDate: payment.createdAt || payment.date // Jika ada tanggal
                  });
                });
              }

              // Jumlahkan subtotal, discount, dan total
              totalSubtotal += payment.subtotal || 0;
              totalDiscount += payment.discount || 0;
              grandTotal += payment.total || payment.subtotal || 0;
            });

            // Tambahkan store pickup dan tax seperti di CartTotals
            const storePickup = 5;
            const tax = 10;
            const finalTotal = totalSubtotal - totalDiscount + storePickup + tax;

            // Buat order summary yang menggabungkan semua data
            setOrderSummary({
              products: allProducts,
              subtotal: totalSubtotal,
              discount: totalDiscount,
              storePickup: storePickup,
              tax: tax,
              shipping: {
                method: 'Standard Shipping',
                estimate: '3-5 busy days'
              },
              total: Math.max(finalTotal, 0), // Pastikan total tidak negatif
              paymentMethod: 'Credit Card',
              totalPayments: data.length // Tambahan info jumlah payment
            });
          } else {
            // Jika tidak ada data
            const storePickup = 5;
            const tax = 10;
            setOrderSummary({
              products: [],
              subtotal: 0,
              discount: 0,
              storePickup: storePickup,
              tax: tax,
              shipping: {
                method: 'Standard Shipping',
                estimate: '3-5 busy days'
              },
              total: storePickup + tax,
              paymentMethod: 'Credit Card',
              totalPayments: 0
            });
          }
        } else if (data && typeof data === 'object') {
          setOrderSummary(data);
          setPaymentHistory([data]);
        } else {
          throw new Error('Invalid payment data format');
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching payment data:', error);
        setError(`Failed to load payment data: ${error.message}`);
        setLoading(false);
        setOrderSummary({
          products: [],
          subtotal: 0,
          discount: 0,
          storePickup: 5,
          tax: 10,
          shipping: {
            method: 'Standard Shipping',
            estimate: '3-5 busy days'
          },
          total: 15, // 5 + 10
          paymentMethod: 'Credit Card',
          totalPayments: 0
        });
      }
    };

    fetchPaymentData();
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };



  if (loading) {
    return (
      <div className="max-w-6xl mt-8 mx-auto p-4 font-[poppins] flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mt-8 mx-auto p-4 font-[poppins]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!orderSummary) {
    return (
      <div className="max-w-6xl mt-8 mx-auto p-4 font-[poppins] flex justify-center items-center">
        <p className="text-gray-600">No order data available</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mt-8 mx-auto p-4 font-[poppins]">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-2/3">
          <h2 className="text-xl font-bold mb-6">Billing details</h2>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name (optional)
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Province *
              </label>
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address *
              </label>
              <input
                type="text"
                name="streetAddress"
                value={formData.streetAddress}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postcode *
              </label>
              <input
                type="text"
                name="postcode"
                value={formData.postcode}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Notes (optional)
              </label>
              <textarea
                name="orderNotes"
                value={formData.orderNotes}
                onChange={handleChange}
                rows="4"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                placeholder="Notes about your order, e.g. special notes for delivery."
              />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-full mt-20 md:w-1/3">
          <div className="bg-white border border-red-200 shadow-lg rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
              <h2 className="text-xl font-bold text-white tracking-wide">ORDER SUMMARY</h2>
              {orderSummary.totalPayments > 0 && (
                <p className="text-red-100 text-sm mt-1">
                  From {orderSummary.totalPayments} payment(s)
                </p>
              )}
            </div>
            <div className="p-6">
              <div className="flex justify-between mb-4 pb-3 border-b border-red-100">
                <span className="font-bold text-sm uppercase tracking-wider">Product</span>
                <span className="font-bold text-sm uppercase tracking-wider">Price</span>
              </div>
              <div className="space-y-3 mb-6">
                {orderSummary.products && orderSummary.products.length > 0 ? (
                  orderSummary.products.map((product, index) => (
                    <div key={product.productId || product._id || index} className="flex justify-between items-center py-2">
                      <span className="text-gray-800 font-medium ">
                        {product.name || product.productName || `Product ${index + 1}`}
                      </span>
                      <span className="text-gray-900 font-semibold pl-">
                        ${((product.price || 0) * (product.quantity || 1)).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No products in order</p>
                )}
              </div>
              <div className="space-y-4 border-t border-red-100 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-800 font-medium">${orderSummary.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Discount</span>
                  <span className="text-red-600 font-medium">-${orderSummary.discount?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Store Pickup</span>
                  <span className="text-gray-800 font-medium">
                    ${orderSummary.products.length === 0 ? '0.00' : (orderSummary.storePickup?.toFixed(2) || '5.00')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-800 font-medium">
                    ${orderSummary.products.length === 0 ? '0.00' : (orderSummary.tax?.toFixed(2) || '10.00')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Shipping</span>
                  <div className="text-right">
                    <div className="text-gray-800 font-medium">{orderSummary.shipping?.method || 'Standard Shipping'}</div>
                    <div className="text-xs text-gray-500">{orderSummary.shipping?.estimate || '3-5 busy days'}</div>
                  </div>
                </div>
              </div>
              <div className="border-t-2 border-red-200 mt-6 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-bold">
                    ${orderSummary.products.length === 0 ? '0.00' : (orderSummary.total?.toFixed(2) || '0.00')}
                  </span>
                </div>
              </div>
              <div className="mt-8 p-4 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-3"></div>
                  <span className="text-sm font-semibold text-red-800">Secure Payment</span>
                </div>
                <p className="text-sm text-gray-700 mb-4 font-medium">{orderSummary.paymentMethod || 'Credit Card'}</p>
              </div>
            </div>
            <div className="p-6 pt-0">
              <button
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-4 rounded-lg text-center font-semibold uppercase tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}