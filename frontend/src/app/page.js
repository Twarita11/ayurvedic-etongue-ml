import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen pt-16 px-6 bg-green-50 flex items-center justify-center">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-5xl font-extrabold leading-tight text-green-900 mb-6 font-playfair">
            Herbal Quality Analyzer
          </h1>
          <p className="text-lg md:text-xl text-green-800 leading-relaxed mb-10 font-montserrat">
            Use AI-powered e-tongue sensors to analyze taste, dilution and
            quality of herbal products with confidence and precision.
          </p>
          <Link
            href="/analysis"
            className="inline-block px-8 py-4 bg-green-700 hover:bg-green-800 text-white rounded-full font-normal text-lg shadow-lg transition"
          >
            Start Your Analysis
          </Link>
        </div>

        <div className="flex justify-center">
          <Image
            src="/herb-illustration2.png"
            alt="Herbal Leaf Illustration"
            width={500}
            height={500}
            className="max-w-full h-auto"
          />
        </div>
      </div>
    </div>
  );
}
