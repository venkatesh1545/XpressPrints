import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Printer, 
  Truck, 
  CheckCircle, 
  Clock,
  Star,
  FileText,
  Palette,
  Shield
} from 'lucide-react';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';

export default function Index() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Upload,
      title: 'Easy Upload',
      description: 'Drag & drop PDF and DOCX files with instant preview'
    },
    {
      icon: Palette,
      title: 'Custom Options',
      description: 'Choose colors, sides, paper size, and page-by-page settings'
    },
    {
      icon: Clock,
      title: '2-Hour Delivery',
      description: 'Fast processing and delivery within 2 hours'
    },
    {
      icon: Shield,
      title: 'Secure Payment',
      description: 'Online payment or cash on delivery with OTP verification'
    }
  ];

  const steps = [
    {
      step: 1,
      title: 'Upload Documents',
      description: 'Upload your PDF or DOCX files',
      icon: Upload
    },
    {
      step: 2,
      title: 'Customize Options',
      description: 'Select print settings and add-ons',
      icon: Printer
    },
    {
      step: 3,
      title: 'Place Order',
      description: 'Choose payment method and confirm',
      icon: CheckCircle
    },
    {
      step: 4,
      title: 'Fast Delivery',
      description: 'Get your prints delivered in 2 hours',
      icon: Truck
    }
  ];

  const pricing = [
        { 
            type: 'Black & White (1-39 pages)', 
            single: '₹2', 
            double: '₹3' 
        },
        { 
            type: 'Black & White (40+ pages)', 
            single: '₹1.5', 
            double: '₹2.5' 
        },
        { 
            type: 'Color Print', 
            single: '₹10', 
            double: '₹15' 
        },
        { 
            type: 'Spiral Binding', 
            single: '₹30', 
            double: '-' 
        },
        { 
            type: 'Record Binding', 
            single: '₹40', 
            double: '-' 
        }
    ];



  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
              🚀 Fast • Reliable • Affordable
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Professional Printing & 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                {' '}Xerox Services
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Upload your documents, customize print options, and get them delivered 
              to your doorstep within 2 hours. Quality printing made simple.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => navigate('/upload')}
              >
                <Upload className="mr-2 h-5 w-5" />
                Start Printing Now
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => navigate('/register')}
              >
                Create Account
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose PrintXpress?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of printing services with our modern, 
              user-friendly platform designed for students and professionals.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow border-0 bg-white">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <feature.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get your documents printed in just 4 simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-sm font-bold text-gray-900">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              No hidden charges. Pay only for what you print.
            </p>
          </div>
          
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 pb-4 border-b border-gray-200 font-semibold text-gray-900">
                  <div>Service</div>
                  <div className="text-center">Single Side</div>
                  <div className="text-center">Both Sides</div>
                </div>
                {pricing.map((item, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100 last:border-0">
                    <div className="font-medium text-gray-900">{item.type}</div>
                    <div className="text-center text-blue-600 font-semibold">{item.single}</div>
                    <div className="text-center text-blue-600 font-semibold">{item.double}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 text-center">
                  <Star className="inline h-4 w-4 mr-1" />
                  Free delivery within 1 hours • Minimum order: ₹5
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Print?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of students and professionals who trust PrintXpress 
              for their printing needs.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => navigate('/upload')}
            >
              <FileText className="mr-2 h-5 w-5" />
              Upload Your Documents
            </Button>
          </div>
        </div>
      </section>

      <MobileNav />
    </div>
  );
}