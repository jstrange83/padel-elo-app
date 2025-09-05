// src/components/Hero.tsx
export default function Hero() {
  return (
    <section className="relative isolate">
      {/* Hero-billede fra /public */}
      <img
        src="/Padelholdet.jpg"
        alt="Padelholdet – fællesskab og rangliste"
        className="h-[260px] w-full object-cover sm:h-[340px] md:h-[420px]"
        loading="eager"
        fetchPriority="high"
      />

      {/* Mørk overlay for bedre tekstkontrast */}
      <div className="absolute inset-0 bg-black/45" />

      {/* Tekst ovenpå billedet */}
      <div className="absolute inset-0 flex items-center">
        <div className="container-page px-4">
          <h1 className="text-white text-3xl sm:text-4xl font-bold tracking-tight">
            Padelholdet
          </h1>
          <p className="text-white/90 mt-2">
            Rangliste · kampe · bøder
          </p>
        </div>
      </div>
    </section>
  );
}
