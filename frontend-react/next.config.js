/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone para Docker optimizado
  // Reduce el tamaño de la imagen y mejora el tiempo de build
  output: 'standalone',

  // Habilitar compresión
  compress: true,

  // Optimizar imágenes
  images: {
    unoptimized: true, // Para deployment estático
  },
};

module.exports = nextConfig;
