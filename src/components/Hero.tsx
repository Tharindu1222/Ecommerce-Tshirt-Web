export const Hero = () => {
  return (
    <div className="relative bg-black overflow-hidden h-[600px]">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src="https://imagedelivery.net/qF9i3w4xcSuenk3e-tiYOA/652bf2c4-ff03-445e-0053-63096ac46600/public"
          alt="Model wearing oversized black t-shirt"
          className="w-full h-full object-cover object-center opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto h-full flex items-center">
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-lg">
            <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl mb-6">
              <span className="block">ZANRU</span>
              <span className="block text-gray-300 text-3xl sm:text-4xl mt-2 font-medium">Oversized Comfort</span>
            </h1>
            <p className="mt-4 text-lg text-gray-300 sm:text-xl max-w-md leading-relaxed">
              Redefining streetwear with premium oversized t-shirts and hoodies. Designed for those who value ultimate comfort without compromising on style.
            </p>
            <div className="mt-8">
              <a
                href="#products"
                className="inline-flex items-center justify-center px-8 py-3 border border-white/20 text-base font-medium rounded-full text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
              >
                Shop Collection
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
