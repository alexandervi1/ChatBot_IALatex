/**
 * LaTeX Templates Index
 * 
 * Central registry for all available LaTeX templates.
 * Add new templates by importing and adding to the array.
 */
import { articuloBasico } from './articulo-basico';
import { presentacionBeamer } from './presentacion-beamer';
import { curriculumVitae } from './curriculum-vitae';
import { tesisReporte } from './tesis-reporte';
import { tareaUniversitaria } from './tarea-universitaria';
import { articuloMatematicasAMS } from './articulo-matematicas-ams';
import { libroBook } from './libro-book';
import { cartaFormal } from './carta-formal';
import { informeTecnico } from './informe-tecnico';
import { tesisGrado } from './tesis-grado';

/** Template structure for LaTeX documents */
export interface LaTeXTemplate {
  name: string;
  category: string;
  description: string;
  content: string;
}

/** All available LaTeX templates organized by category */
export const latexTemplates: LaTeXTemplate[] = [
  // Academic Templates
  articuloBasico,
  articuloMatematicasAMS,
  tesisReporte,
  tesisGrado,
  tareaUniversitaria,

  // Professional Templates
  curriculumVitae,
  cartaFormal,

  // Reports & Books
  informeTecnico,
  libroBook,

  // Presentations
  presentacionBeamer,
];