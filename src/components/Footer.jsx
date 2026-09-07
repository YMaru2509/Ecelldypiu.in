import { Link, useLocation } from 'react-router-dom';
import {
  Mail,
  MapPin,
  Instagram,
  Linkedin,
  Zap,
  MessageCircle,
} from 'lucide-react';

// socialLinks defined for Footer
const socialLinks = [
  {
    icon: Instagram,
    href: 'https://www.instagram.com/ecell.dypiu?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
    label: 'Instagram',
  },
  {
    icon: Linkedin,
    href: 'https://www.linkedin.com/company/ecell-dypiu/posts/?feedView=all',
    label: 'LinkedIn',
  },
  {
    icon: MessageCircle,
    href: 'https://chat.whatsapp.com/LlZrAibpCEdBrnpDwrGaQT?mode=wwt',
    label: 'WhatsApp Community',
  },
];
const Footer = () => {
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  if (location.pathname === '/ourlinks' || location.pathname.startsWith('/s/')) {
    return null;
  }

  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Events', path: '/events' },
    { name: 'Team', path: '/team' },
    { name: 'Our Links', path: '/ourlinks' },
  ];

  // re-use exported socialLinks
  // (kept here so Footer still renders correctly and values are centralized)

  return (
    <footer className="bg-black text-white" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img
                src="/logonew.png"
                alt="E-Cell"
                className="h-16 w-auto"
              />
              <span className="text-white font-bold text-2xl tracking-wide">ECELL DYPIU</span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md font-body">
              Fostering entrepreneurship and innovation at D Y Patil International University.
              Join us in building the next generation of entrepreneurs and innovators.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-300"
                >
                  <social.icon className="w-5 h-5 text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    className="text-gray-300 hover:text-blue-400 transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}

              <li>
                <Link
                  to="/contact"
                  className="text-gray-300 hover:text-purple-400 transition-colors duration-300"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/apply"
                  className="text-gray-300 hover:text-brand-yellow transition-colors duration-300"
                >
                  Join the Team
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <p className="text-gray-300 text-sm">
                  D Y Patil International University,
                  Pune, Maharashtra, India
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <a
                  href="mailto:Ecell@dypiu.ac.in"
                  className="text-gray-300 hover:text-purple-400 transition-colors duration-300"
                >
                  Ecell@dypiu.ac.in
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {currentYear} E-Cell DYPIU. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <p className="text-gray-400 text-sm">
              Made with ❤️ by <a href="https://www.linkedin.com/in/yash-kumar-tripathi-998457306/" target="_blank" rel="noopener noreferrer" className="text-brand-yellow hover:text-white transition-colors">Yash Tripathi</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;