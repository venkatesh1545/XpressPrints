import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Shipping & Delivery Policy</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-sm text-gray-600 mb-4">
                Last Updated: October 27, 2025
              </p>

              <h2>1. Delivery Service</h2>
              <p>
                XpressPrints offers fast and reliable delivery services for all printed documents and materials 
                in Rajahmundry, Andhra Pradesh.
              </p>

              <h2>2. Delivery Timeline</h2>
              <ul>
                <li>
                  <strong>Standard Delivery:</strong> Within <strong>2 hours</strong> from order confirmation 
                  for local Rajahmundry addresses
                </li>
                <li>
                  <strong>Express Delivery:</strong> Within <strong>1 hour</strong> (if opted and available)
                </li>
                <li>
                  <strong>Processing Time:</strong> Orders are typically processed within 15-30 minutes after 
                  payment confirmation
                </li>
              </ul>

              <h2>3. Delivery Areas</h2>
              <p>
                We currently deliver to all areas within Rajahmundry city limits including:
              </p>
              <ul>
                <li>Danavaipeta</li>
                <li>Innespeta</li>
                <li>T. Nagar</li>
                <li>Seethanagaram</li>
                <li>And other Rajahmundry localities</li>
              </ul>

              <h2>4. Delivery Charges</h2>
              <ul>
                <li><strong>FREE</strong> delivery on all orders</li>
                <li>No minimum order value required</li>
                <li>₹4 convenience fee applies to all orders</li>
              </ul>

              <h2>5. Delivery Process</h2>
              <ol>
                <li>Order confirmation via SMS/Email</li>
                <li>Document printing and quality check</li>
                <li>Packaging and dispatch</li>
                <li>Real-time delivery tracking (if applicable)</li>
                <li>OTP-based delivery verification</li>
              </ol>

              <h2>6. Delivery Verification</h2>
              <p>
                For security purposes, all deliveries require:
              </p>
              <ul>
                <li>6-digit OTP sent to your registered mobile number</li>
                <li>OTP must be provided to delivery personnel</li>
                <li>Only after OTP verification, order will be handed over</li>
              </ul>

              <h2>7. Failed Delivery</h2>
              <p>
                If delivery fails due to:
              </p>
              <ul>
                <li>Incorrect address provided</li>
                <li>Customer unavailable</li>
                <li>Refused to provide OTP</li>
              </ul>
              <p>
                We will attempt redelivery once. Additional charges may apply for subsequent delivery attempts.
              </p>

              <h2>8. Order Tracking</h2>
              <p>
                You can track your order status through:
              </p>
              <ul>
                <li>Order confirmation page</li>
                <li>Email notifications</li>
                <li>SMS updates</li>
                <li>Customer dashboard (if logged in)</li>
              </ul>

              <h2>9. Damaged During Delivery</h2>
              <p>
                If you receive damaged products:
              </p>
              <ul>
                <li>Do not accept the delivery</li>
                <li>Inform delivery personnel immediately</li>
                <li>Contact customer support within 1 hour</li>
                <li>We will arrange replacement at no additional cost</li>
              </ul>

              <h2>10. Contact for Delivery Issues</h2>
              <p>
                For any delivery-related queries or issues, please contact our customer support through the 
                information provided on our website.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
