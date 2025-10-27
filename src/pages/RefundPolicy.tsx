import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Refund and Cancellation Policy</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-sm text-gray-600 mb-4">
                Last Updated: October 27, 2025
              </p>

              <p>
                This refund and cancellation policy outlines how you can cancel or seek a refund for a product/service 
                that you have purchased through the Platform.
              </p>

              <h2>1. Cancellation Policy</h2>
              <ul>
                <li>
                  <strong>Cancellation Window:</strong> Cancellations will only be considered if the request is made 
                  within <strong>3 days</strong> of placing the order.
                </li>
                <li>
                  <strong>Order Processing:</strong> Cancellation requests may not be entertained if the orders have 
                  been processed and are out for delivery. In such cases, you may reject the product at the doorstep.
                </li>
                <li>
                  <strong>Printed Documents:</strong> Once printing has started or the order is out for delivery, 
                  cancellations cannot be accepted.
                </li>
              </ul>

              <h2>2. Refund Policy</h2>
              <ul>
                <li>
                  <strong>Damaged Products:</strong> In case of receipt of damaged or defective items, please report 
                  to our customer service team within <strong>3 days</strong> of receiving the product.
                </li>
                <li>
                  <strong>Quality Issues:</strong> If you feel that the product received is not as shown on the site 
                  or as per your expectations, you must bring it to our notice within <strong>3 days</strong> of 
                  receiving the product.
                </li>
                <li>
                  <strong>Refund Processing:</strong> In case of any refunds approved by XpressPrints, it will take 
                  <strong>5-7 business days</strong> for the refund to be processed to your original payment method.
                </li>
              </ul>

              <h2>3. Non-Refundable Items</h2>
              <ul>
                <li>Digital copies or soft copies of documents</li>
                <li>Custom printed materials (once printing has started)</li>
                <li>Binding services (once completed)</li>
              </ul>

              <h2>4. How to Request Refund/Cancellation</h2>
              <p>
                To request a refund or cancellation:
              </p>
              <ol>
                <li>Contact our customer service through the website</li>
                <li>Provide your order number and reason for refund/cancellation</li>
                <li>Our team will review and respond within 24-48 hours</li>
              </ol>

              <h2>5. Contact Us</h2>
              <p>
                For any queries regarding refunds or cancellations, please contact our customer service team 
                through the contact information provided on our website.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
