export default function Hero() {
  return (
    <section
      className="relative h-[260px] md:h-[340px] w-full overflow-hidden"
      aria-label="Hero"
    >
      <img
        src="/hero.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="hero-overlay absolute inset-0"></div>
      <div className="relative z-10 h-full flex items-end">
        <div className="container-page pb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Velkommen til Padelholdet
          </h1>
          <p className="text-white/80 mt-2">
            Hold styr på rangliste, kampe og bøder – alt samlet ét sted.
          </p>
        </div>
      </div>
    </section>
  );
}
