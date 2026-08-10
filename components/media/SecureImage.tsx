import Image from "next/image";

export function SecureImage({ src, alt, className, landscape = false }: { src: string; alt: string; className?: string; landscape?: boolean }) {
  return <Image src={src} alt={alt} className={className} width={landscape ? 1536 : 1024} height={1024} unoptimized />;
}
