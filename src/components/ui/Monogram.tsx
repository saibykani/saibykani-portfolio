// Personal "SK" wordmark used in place of a logo (navbar, footer, CTA).
export default function Monogram({ className = "text-[28px]" }: { className?: string }) {
  return (
    <span className={`select-none font-outfit font-extrabold leading-none tracking-[-0.09em] text-white ${className}`} aria-label="Sai Krishna">
      S<span className="font-instrument font-normal italic tracking-normal">K</span>
    </span>
  );
}
