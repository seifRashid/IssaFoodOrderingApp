import { ChefHat, Phone, MapPin, Clock, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-850 mt-12" id="main-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-amber-600 text-white p-1.5 rounded-lg">
                <ChefHat className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold tracking-wider text-white font-sans">
                Issa Kitchen
              </span>
            </div>
            <p className="text-sm text-stone-400 font-sans">
              Deliciously fresh, warm food made with hand-selected local ingredients. Perfect taste, affordable prices, and exceptional speedy service.
            </p>
          </div>

          {/* Column 2: Hours */}
          <div className="space-y-4">
            <h3 className="text-white text-sm font-black uppercase tracking-widest font-sans">
              Kitchen Hours
            </h3>
            <ul className="space-y-2 text-sm text-stone-450 font-mono">
              <li className="flex justify-between">
                <span>Mon - Fri:</span>
                <span className="text-amber-500">7:00 AM - 10:00 PM</span>
              </li>
              <li className="flex justify-between">
                <span>Sat - Sun:</span>
                <span className="text-amber-500">8:00 AM - 11:00 PM</span>
              </li>
              <li className="text-xs text-amber-650 bg-amber-950/40 p-2 rounded border border-amber-900/30">
                Delivery and pickup close 30 minutes before kitchen hours end.
              </li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div className="space-y-4">
            <h3 className="text-white text-sm font-black uppercase tracking-widest font-sans">
              Get in Touch
            </h3>
            <ul className="space-y-3.5 text-sm text-stone-400">
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="font-mono">+254 711 000000 / +254 722 123456</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Issa Kitchen HQ</strong><br />
                  Kilimani Area, Yaya Center Gate 3,<br />
                  Nairobi, Kenya
                </span>
              </li>
            </ul>
          </div>

          {/* Column 4: Quality Commitment */}
          <div className="space-y-4">
            <h3 className="text-white text-sm font-black uppercase tracking-widest font-sans">
              Our Commitment
            </h3>
            <p className="text-sm text-stone-450 font-sans">
              We design our service for extreme simplicity so that elderly and non-technical clients can place food orders effortlessly on any smartphone.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 bg-stone-800 text-stone-200 text-xs px-3 py-1.5 rounded-lg border border-stone-700/60 font-semibold font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Avg Deliver: 15 - 25 Mins
              </span>
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-stone-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-stone-550 gap-4">
          <p>© 2026 Issa Kitchen Ltd. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for supreme accessibility and production readiness.
          </p>
        </div>
      </div>
    </footer>
  );
}
