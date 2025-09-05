// src/components/Hero.tsx
export default function Hero() {
  return (
    <section className="relative isolate">
      <img
  src="/Padelholdet.jpg"
  alt="Padelholdet"
  className="absolute inset-0 w-full h-full object-cover"
/>
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 flex items-center">
        <div className="container-page px-4">
          <h1 className="text-white text-3xl sm:text-4xl font-bold tracking-tight">
            Padelholdet
          </h1>
          <p className="text-white/90 mt-2">Rangliste · kampe · bøder</p>
        </div>
      </div>
    </section>
  );
}
