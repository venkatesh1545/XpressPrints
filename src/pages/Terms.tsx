import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-sm text-gray-600 mb-4">
                Last Updated: October 27, 2025
              </p>

              <h2>1. Introduction</h2>
              <p>
                This document is an electronic record in terms of Information Technology Act, 2000 and rules 
                thereunder as applicable and the amended provisions pertaining to electronic records in various 
                statutes as amended by the Information Technology Act, 2000.
              </p>

              <p>
                The Platform is owned by <strong>XpressPrints</strong>, with its registered office at Rajahmundry, 
                Andhra Pradesh, India (hereinafter referred to as 'Platform Owner', 'we', 'us', 'our').
              </p>

              <h2>2. Agreement to Terms</h2>
              <p>
                Your use of the Platform and services are governed by the following terms and conditions. 
                By accessing or using the Platform, you agree to be bound by these Terms of Use.
              </p>

              <h2>3. User Obligations</h2>
              <ul>
                <li>To access and use the Services, you agree to provide true, accurate and complete information 
                    to us during and after registration.</li>
                <li>You shall be responsible for all acts done through the use of your registered account.</li>
                <li>Your use of our Services and the Platform is solely at your own risk and discretion.</li>
              </ul>

              <h2>4. Intellectual Property</h2>
              <p>
                The contents of the Platform and Services are proprietary to us. You will not have any authority 
                to claim any intellectual property rights, title, or interest in its contents including design, 
                layout, look and graphics.
              </p>

              <h2>5. Payment Terms</h2>
              <p>
                You agree to pay us the charges associated with availing the Services. All prices are in Indian 
                Rupees (INR) and include applicable taxes.
              </p>

              <h2>6. Prohibited Activities</h2>
              <p>
                You agree not to use the Platform and/or Services for any purpose that is unlawful, illegal or 
                forbidden by these Terms, or Indian or local laws.
              </p>

              <h2>7. Limitation of Liability</h2>
              <p>
                Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, 
                performance, completeness or suitability of the information and materials offered on this website.
              </p>

              <h2>8. Indemnification</h2>
              <p>
                You shall indemnify and hold harmless Platform Owner, its affiliates, and their respective officers, 
                directors, agents, and employees, from any claim or demand made by any third party arising out of 
                your breach of these Terms.
              </p>

              <h2>9. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of India. All disputes 
                shall be subject to the exclusive jurisdiction of courts in Rajahmundry, Andhra Pradesh.
              </p>

              <h2>10. Contact Information</h2>
              <p>
                For any queries regarding these Terms, please contact us through the information provided on our website.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
