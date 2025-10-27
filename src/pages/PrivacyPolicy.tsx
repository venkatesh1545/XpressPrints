import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-sm text-gray-600 mb-4">
                Last Updated: October 27, 2025
              </p>

              <h2>1. Introduction</h2>
              <p>
                This Privacy Policy describes how XpressPrints ("we", "us", "our") collects, uses, shares, protects 
                or otherwise processes your information/personal data through our website https://xpress-prints-7mm4.vercel.app/.
              </p>

              <p>
                By visiting this Platform, providing your information or availing any product/service, you expressly 
                agree to be bound by this Privacy Policy and agree to be governed by the laws of India.
              </p>

              <h2>2. Information We Collect</h2>
              <p>We collect personal data when you:</p>
              <ul>
                <li>Sign up or register on our Platform</li>
                <li>Place an order or use our services</li>
                <li>Contact our customer support</li>
                <li>Browse our website</li>
              </ul>

              <p>Information collected includes:</p>
              <ul>
                <li>Name, email address, phone number</li>
                <li>Delivery address</li>
                <li>Payment information (processed securely through payment gateways)</li>
                <li>Documents uploaded for printing</li>
                <li>Usage data and preferences</li>
              </ul>

              <h2>3. How We Use Your Information</h2>
              <p>We use your personal data to:</p>
              <ul>
                <li>Process and fulfill your orders</li>
                <li>Communicate about your orders and services</li>
                <li>Improve our services and customer experience</li>
                <li>Send promotional offers (with your consent)</li>
                <li>Detect and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>

              <h2>4. Information Sharing</h2>
              <p>We may share your information with:</p>
              <ul>
                <li>Payment processors (PhonePe, Razorpay, etc.)</li>
                <li>Delivery partners for order fulfillment</li>
                <li>Service providers who assist our operations</li>
                <li>Law enforcement when required by law</li>
              </ul>

              <p>
                We do not sell your personal information to third parties.
              </p>

              <h2>5. Data Security</h2>
              <p>
                We implement reasonable security measures to protect your personal data from unauthorized access, 
                disclosure, alteration, or destruction. However, no internet transmission is completely secure.
              </p>

              <h2>6. Data Retention</h2>
              <p>
                We retain your personal data for as long as necessary to fulfill the purposes outlined in this policy, 
                comply with legal obligations, resolve disputes, and enforce agreements.
              </p>

              <h2>7. Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your account</li>
                <li>Opt-out of promotional communications</li>
                <li>Withdraw consent for data processing</li>
              </ul>

              <h2>8. Cookies</h2>
              <p>
                We use cookies to enhance your browsing experience, analyze site usage, and assist in marketing efforts. 
                You can manage cookie preferences through your browser settings.
              </p>

              <h2>9. Changes to Privacy Policy</h2>
              <p>
                We may update this Privacy Policy periodically. We will notify you of significant changes through email 
                or website notification.
              </p>

              <h2>10. Contact Us</h2>
              <p>
                For any privacy-related queries or to exercise your rights, please contact us through the information 
                provided on our website.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
