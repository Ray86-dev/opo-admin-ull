export type BloqueId = 1 | 2 | 3 | 4

export interface Bloque {
  id: BloqueId
  romano: string
  nombre: string
  corto: string
  /** clase de color definida en index.css (bloque-1 … bloque-4) */
  color: string
  hex: string
}

export interface NormaRef {
  archivo: string
  nombre: string
}

export interface Tema {
  id: string
  bloque: BloqueId
  num: number
  titulo: string
  epigrafe: string
  normas: string[]
}

export const BLOQUES: Bloque[] = [
  { id: 1, romano: 'I', nombre: 'Derecho Administrativo', corto: 'Derecho Adm.', color: 'bloque-1', hex: '#2f5bd3' },
  { id: 2, romano: 'II', nombre: 'Gestión de Recursos Humanos', corto: 'RRHH', color: 'bloque-2', hex: '#0f9488' },
  { id: 3, romano: 'III', nombre: 'Gestión Financiera', corto: 'Financiera', color: 'bloque-3', hex: '#d97706' },
  { id: 4, romano: 'IV', nombre: 'Gestión Universitaria', corto: 'Universitaria', color: 'bloque-4', hex: '#b1437a' },
]

/** PDFs oficiales disponibles en /normativa */
export const NORMAS: Record<string, NormaRef & { boe?: string; grupo: string }> = {
  bases: { archivo: '00a_Bases_Convocatoria_Escala_Administrativa_ULL_2026.pdf', nombre: 'Bases de la convocatoria (BOC nº 166, 19/08/2026)', boe: 'https://www.gobiernodecanarias.org/boc/2026/166/2984.html', grupo: 'Convocatoria' },
  ce: { archivo: '00_Constitucion_Espanola_1978.pdf', nombre: 'Constitución Española de 1978', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-1978-31229', grupo: 'Derecho Administrativo' },
  gobierno: { archivo: '01_Ley_50-1997_del_Gobierno.pdf', nombre: 'Ley 50/1997, del Gobierno', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-1997-25336', grupo: 'Derecho Administrativo' },
  lrjsp: { archivo: '02_Ley_40-2015_Regimen_Juridico_Sector_Publico.pdf', nombre: 'Ley 40/2015, de Régimen Jurídico del Sector Público', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-10566', grupo: 'Derecho Administrativo' },
  lpac: { archivo: '03_Ley_39-2015_Procedimiento_Administrativo_Comun.pdf', nombre: 'Ley 39/2015, del Procedimiento Administrativo Común', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-10565', grupo: 'Derecho Administrativo' },
  ljca: { archivo: '04_Ley_29-1998_Jurisdiccion_Contencioso-administrativa.pdf', nombre: 'Ley 29/1998, de la Jurisdicción Contencioso-administrativa', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-1998-16718', grupo: 'Derecho Administrativo' },
  lcsp: { archivo: '05_Ley_9-2017_Contratos_Sector_Publico.pdf', nombre: 'Ley 9/2017, de Contratos del Sector Público', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-2017-12902', grupo: 'Derecho Administrativo' },
  transparencia: { archivo: '06_Ley_19-2013_Transparencia.pdf', nombre: 'Ley 19/2013, de transparencia, acceso a la información pública y buen gobierno', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-2013-12887', grupo: 'Derecho Administrativo' },
  lopdgdd: { archivo: '07_LO_3-2018_Proteccion_Datos_LOPDGDD.pdf', nombre: 'LO 3/2018, de Protección de Datos Personales (LOPDGDD)', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673', grupo: 'Derecho Administrativo' },
  rgpd: { archivo: '08_Reglamento_UE_2016-679_RGPD.pdf', nombre: 'Reglamento (UE) 2016/679 (RGPD)', boe: 'https://www.boe.es/buscar/doc.php?id=DOUE-L-2016-80807', grupo: 'Derecho Administrativo' },
  aeull: { archivo: '09_ULL_Reglamento_Administracion_Electronica_2025.pdf', nombre: 'Reglamento de Administración Electrónica de la ULL (2025)', boe: 'https://www.ull.es/portal/normativa/normativa/reglamento-por-el-que-se-regula-la-administracion-electronica-de-la-universidad-de-la-laguna/', grupo: 'Universidad de La Laguna' },
  trebep: { archivo: '10_RDLeg_5-2015_TREBEP.pdf', nombre: 'RDLeg 5/2015, Estatuto Básico del Empleado Público (TREBEP)', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-11719', grupo: 'Recursos Humanos' },
  l30_84: { archivo: '11_Ley_30-1984_Reforma_Funcion_Publica.pdf', nombre: 'Ley 30/1984, de medidas para la reforma de la Función Pública', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-1984-17387', grupo: 'Recursos Humanos' },
  fpcan: { archivo: '12_Ley_2-1987_Funcion_Publica_Canaria.pdf', nombre: 'Ley 2/1987, de la Función Pública Canaria', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-1987-11921', grupo: 'Recursos Humanos' },
  rd364: { archivo: '13_RD_364-1995_Reglamento_Ingreso_Provision.pdf', nombre: 'RD 364/1995, Reglamento General de Ingreso y Provisión', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-1995-8729', grupo: 'Recursos Humanos' },
  l2_2025: { archivo: '13b_Ley_2-2025_Canarias_Temporalidad_Empleo_Publico.pdf', nombre: 'Ley 2/2025 de Canarias, de reducción de la temporalidad en el empleo público', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-2025-15655', grupo: 'Recursos Humanos' },
  rd365: { archivo: '14_RD_365-1995_Situaciones_Administrativas.pdf', nombre: 'RD 365/1995, Reglamento de Situaciones Administrativas', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-1995-8730', grupo: 'Recursos Humanos' },
  incompat: { archivo: '15_Ley_53-1984_Incompatibilidades.pdf', nombre: 'Ley 53/1984, de Incompatibilidades', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-1985-151', grupo: 'Recursos Humanos' },
  disciplinario: { archivo: '16_RD_33-1986_Regimen_Disciplinario.pdf', nombre: 'RD 33/1986, Reglamento de Régimen Disciplinario', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-1986-1216', grupo: 'Recursos Humanos' },
  lgss: { archivo: '17_RDLeg_8-2015_Ley_General_Seguridad_Social.pdf', nombre: 'RDLeg 8/2015, Ley General de la Seguridad Social', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-11724', grupo: 'Recursos Humanos' },
  muface: { archivo: '18_RDLeg_4-2000_Seguridad_Social_Funcionarios_MUFACE.pdf', nombre: 'RDLeg 4/2000, Seguridad Social de los Funcionarios Civiles (MUFACE)', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-2000-12140', grupo: 'Recursos Humanos' },
  pasivas: { archivo: '19_RDLeg_670-1987_Clases_Pasivas.pdf', nombre: 'RDLeg 670/1987, Ley de Clases Pasivas del Estado', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-1987-12636', grupo: 'Recursos Humanos' },
  et: { archivo: '20_RDLeg_2-2015_Estatuto_Trabajadores.pdf', nombre: 'RDLeg 2/2015, Estatuto de los Trabajadores', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430', grupo: 'Recursos Humanos' },
  igualdad: { archivo: '21_LO_3-2007_Igualdad_Mujeres_Hombres.pdf', nombre: 'LO 3/2007, para la igualdad efectiva de mujeres y hombres', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-2007-6115', grupo: 'Recursos Humanos' },
  convenio: { archivo: '22_II_Convenio_Colectivo_PAS_Laboral_Universidades_Canarias_2013.pdf', nombre: 'Convenio Colectivo del PAS Laboral de las Universidades Públicas Canarias (BOC 18/11/2013)', boe: 'https://www.gobiernodecanarias.org/boc/2013/222/004.html', grupo: 'Recursos Humanos' },
  delegacion: { archivo: '23_ULL_Resolucion_Delegacion_Competencias_2023.pdf', nombre: 'ULL · Resolución de 12/05/2023 de delegación de competencias y suplencias', boe: 'https://www.gobiernodecanarias.org/boc/2023/101/', grupo: 'Universidad de La Laguna' },
  lgp: { archivo: '30_Ley_47-2003_General_Presupuestaria.pdf', nombre: 'Ley 47/2003, General Presupuestaria', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-2003-21614', grupo: 'Gestión Financiera' },
  rd462: { archivo: '31_RD_462-2002_Indemnizaciones_Razon_Servicio.pdf', nombre: 'RD 462/2002, sobre indemnizaciones por razón del servicio', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-2002-10337', grupo: 'Gestión Financiera' },
  rd1086: { archivo: '32_RD_1086-1989_Retribuciones_Profesorado_Universitario.pdf', nombre: 'RD 1086/1989, sobre retribuciones del profesorado universitario', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-1989-21967', grupo: 'Gestión Financiera' },
  presupuesto: { archivo: '33_ULL_Presupuesto_2026_BOC.pdf', nombre: 'ULL · Presupuesto 2026 (BOC)', boe: 'https://www.gobiernodecanarias.org/boc/2025/256/4426.html', grupo: 'Universidad de La Laguna' },
  bep: { archivo: '34_ULL_Bases_Ejecucion_Presupuesto_2026.pdf', nombre: 'ULL · Bases de ejecución del presupuesto 2026', boe: 'https://www.ull.es/portal/normativa/normativa/bases-de-ejecucion-del-presupuesto-de-la-universidad-de-la-laguna-2026/', grupo: 'Universidad de La Laguna' },
  d251: { archivo: '35_Decreto_251-1997_Indemnizaciones_Razon_Servicio_Canarias.pdf', nombre: 'Decreto 251/1997, Reglamento de indemnizaciones por razón del servicio (Canarias)', grupo: 'Gestión Financiera' },
  d140: { archivo: '36_Decreto_140-2002_PDI_Contratado_Complementos_Retributivos_Canarias.pdf', nombre: 'Decreto 140/2002, PDI contratado y complementos retributivos (Canarias)', boe: 'https://www.gobiernodecanarias.org/boc/2002/139/002.html', grupo: 'Gestión Financiera' },
  losu: { archivo: '40_LO_2-2023_Sistema_Universitario_LOSU.pdf', nombre: 'LO 2/2023, del Sistema Universitario (LOSU)', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-2023-7500', grupo: 'Gestión Universitaria' },
  rd822: { archivo: '41_RD_822-2021_Ensenanzas_Universitarias.pdf', nombre: 'RD 822/2021, organización de las enseñanzas universitarias', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-2021-15781', grupo: 'Gestión Universitaria' },
  l11_2003: { archivo: '42_Ley_11-2003_Consejos_Sociales_Canarias.pdf', nombre: 'Ley 11/2003, sobre Consejos Sociales y Coordinación del Sistema Universitario de Canarias', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-2003-10625', grupo: 'Gestión Universitaria' },
  ciencia: { archivo: '43_Ley_14-2011_Ciencia_Tecnologia_Innovacion.pdf', nombre: 'Ley 14/2011, de la Ciencia, la Tecnología y la Innovación', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-2011-9617', grupo: 'Gestión Universitaria' },
  epipf: { archivo: '44_RD_103-2019_Estatuto_Personal_Investigador_Formacion.pdf', nombre: 'RD 103/2019, Estatuto del personal investigador predoctoral en formación', boe: 'https://www.boe.es/buscar/act.php?id=BOE-A-2019-3700', grupo: 'Gestión Universitaria' },
  estatutos: { archivo: '45_Decreto_66-2022_Estatutos_ULL.pdf', nombre: 'Decreto 66/2022, Estatutos de la Universidad de La Laguna', boe: 'https://www.ull.es/portal/normativa/normativa/estatutos-de-la-universidad-de-la-laguna/', grupo: 'Universidad de La Laguna' },
  csocial: { archivo: '46_Decreto_215-2017_Reglamento_Consejo_Social_ULL.pdf', nombre: 'Decreto 215/2017, Reglamento del Consejo Social de la ULL', boe: 'https://www.ull.es/portal/consejo-social/normativa/', grupo: 'Universidad de La Laguna' },
}

export const TEMAS: Tema[] = [
  // BLOQUE I
  { id: '1-01', bloque: 1, num: 1, titulo: 'Fuentes del Derecho Administrativo', epigrafe: 'Las fuentes del derecho administrativo. La jerarquía de las fuentes. La ley. Las disposiciones del Ejecutivo con fuerza de ley: decreto-ley y decreto legislativo. El reglamento: concepto, clases y límites. Otras fuentes del derecho administrativo.', normas: ['ce', 'gobierno', 'lpac'] },
  { id: '1-02', bloque: 1, num: 2, titulo: 'Ley 40/2015: órganos, competencia y relaciones', epigrafe: 'Ley 40/2015, de 1 octubre, de Régimen Jurídico del Sector Público. Ámbito de aplicación y principios. Órganos administrativos y competencia. Órganos colegiados. La abstención y recusación. Relaciones Interadministrativas: principios generales de las relaciones interadministrativas.', normas: ['lrjsp'] },
  { id: '1-03', bloque: 1, num: 3, titulo: 'Administración electrónica (Ley 40/2015 y Reglamento ULL)', epigrafe: 'Funcionamiento electrónico del Sector Público en la Ley 40/2015, de 1 octubre. El Reglamento por el que se regula la administración electrónica en la Universidad de La Laguna, aprobado por el Consejo de Gobierno en sesión de 4 de febrero de 2025.', normas: ['lrjsp', 'aeull'] },
  { id: '1-04', bloque: 1, num: 4, titulo: 'Ley 39/2015 (I): interesados y actividad', epigrafe: 'La Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas (I): disposiciones generales. Los interesados en el procedimiento. La actividad de las Administraciones Públicas.', normas: ['lpac'] },
  { id: '1-05', bloque: 1, num: 5, titulo: 'Ley 39/2015 (II): actos y procedimiento', epigrafe: 'La Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas (II): los actos administrativos: requisitos, eficacia, nulidad y anulabilidad. Disposiciones sobre el procedimiento administrativo común.', normas: ['lpac'] },
  { id: '1-06', bloque: 1, num: 6, titulo: 'Ley 39/2015 (III): revisión, recursos y contencioso', epigrafe: 'La Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas (III): revisión de los actos en vía administrativa. Los recursos administrativos: concepto y clases. El recurso contencioso-administrativo: ámbito, capacidad, legitimación y postulación. Actividad administrativa impugnable.', normas: ['lpac', 'ljca'] },
  { id: '1-07', bloque: 1, num: 7, titulo: 'Responsabilidad patrimonial', epigrafe: 'La responsabilidad patrimonial de las Administraciones Públicas. Especialidades del procedimiento responsabilidad patrimonial.', normas: ['lrjsp', 'lpac', 'ce'] },
  { id: '1-08', bloque: 1, num: 8, titulo: 'Contratos del Sector Público (I)', epigrafe: 'La Ley 9/2017, de 8 de noviembre, de Contratos del Sector Público. Los Contratos del Sector Público. Objeto y ámbito de aplicación. Tipos de Contrato. Disposiciones generales de la contratación. Las partes del contrato. Objeto, presupuesto base de licitación, valor estimado, precio del contrato, garantías.', normas: ['lcsp'] },
  { id: '1-09', bloque: 1, num: 9, titulo: 'Contratos del Sector Público (II)', epigrafe: 'La Ley 9/2017, de 8 de noviembre, de Contratos del Sector Público. Preparación y procedimientos de adjudicación de los contratos. Efectos, cumplimiento y modificación de los contratos administrativos. Extinción. Régimen de invalidez de los procedimientos de contratación. El procedimiento de contratación administrativa y las fases de ejecución del gasto.', normas: ['lcsp', 'lgp', 'bep'] },
  { id: '1-10', bloque: 1, num: 10, titulo: 'Transparencia y acceso a la información', epigrafe: 'La Ley 19/2013, de 9 de diciembre, de transparencia, acceso a la información pública, y buen gobierno: objeto. Ámbito subjetivo de aplicación. Publicidad activa. Derecho de acceso a la información pública.', normas: ['transparencia'] },
  { id: '1-11', bloque: 1, num: 11, titulo: 'Protección de datos (RGPD y LOPDGDD)', epigrafe: 'La protección de datos. Régimen jurídico. El Reglamento UE 2016/679, de 27 de abril, relativo a la protección de las personas físicas en lo que respecta al tratamiento de datos personales y a la libre circulación de estos datos, y la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales. Principios y derechos. Obligaciones. El Delegado de Protección de Datos en las Administraciones públicas. La Agencia Española de Protección de Datos.', normas: ['rgpd', 'lopdgdd'] },
  // BLOQUE II
  { id: '2-01', bloque: 2, num: 1, titulo: 'Personal al servicio de las AAPP y competencias en la ULL', epigrafe: 'El personal al servicio de las Administraciones públicas. Régimen jurídico. El texto refundido del Estatuto Básico del Empleado Público y demás normativa vigente. Clases de personal. Las competencias en materia de personal en la Universidad de La Laguna.', normas: ['trebep', 'fpcan', 'l2_2025', 'estatutos', 'delegacion'] },
  { id: '2-02', bloque: 2, num: 2, titulo: 'El personal funcionario: derechos, deberes, carrera y situaciones', epigrafe: 'El personal funcionario al servicio de las Administraciones Públicas. Derechos y Deberes. Código de conducta de los empleados públicos. Adquisición y pérdida de la relación de servicio. Sistemas selectivos y provisión de puestos de trabajo. Ordenación de la actividad profesional. Situaciones Administrativas.', normas: ['trebep', 'rd364', 'rd365', 'fpcan'] },
  { id: '2-03', bloque: 2, num: 3, titulo: 'Incompatibilidades y régimen disciplinario', epigrafe: 'Las Incompatibilidades del personal al servicio de las Administraciones públicas. Régimen disciplinario: faltas, sanciones y procedimiento.', normas: ['incompat', 'trebep', 'disciplinario'] },
  { id: '2-04', bloque: 2, num: 4, titulo: 'Seguridad Social, MUFACE y derechos pasivos', epigrafe: 'El régimen general de la Seguridad Social: afiliación, altas y bajas, variaciones, cotizaciones y prestaciones. La MUFACE: concepto y clases de prestaciones. Derechos pasivos.', normas: ['lgss', 'muface', 'pasivas'] },
  { id: '2-05', bloque: 2, num: 5, titulo: 'Personal laboral y Convenio Colectivo', epigrafe: 'El Personal Laboral al servicio de la Administración Pública. Régimen jurídico. El Convenio Colectivo de Personal Laboral de las Universidades Públicas Canarias.', normas: ['trebep', 'et', 'convenio'] },
  { id: '2-06', bloque: 2, num: 6, titulo: 'Igualdad efectiva de mujeres y hombres', epigrafe: 'La Ley Orgánica 3/2007, de 22 de marzo, para la igualdad efectiva de mujeres y hombres. El principio de igualdad y la tutela contra la discriminación. Políticas públicas para la igualdad. Principio de igualdad en el empleo público.', normas: ['igualdad', 'trebep'] },
  // BLOQUE III
  { id: '3-01', bloque: 3, num: 1, titulo: 'Presupuesto de la ULL (I)', epigrafe: 'El Presupuesto de la Universidad de La Laguna (I). Régimen económico y financiero. Régimen jurídico y principios aplicables. Las bases de ejecución del presupuesto. Estructura presupuestaria. Elaboración y aprobación. Modificaciones presupuestarias.', normas: ['bep', 'presupuesto', 'losu', 'l11_2003', 'lgp'] },
  { id: '3-02', bloque: 3, num: 2, titulo: 'Presupuesto de la ULL (II): ejecución del gasto', epigrafe: 'El Presupuesto de la Universidad de La Laguna (II). Concepto de Gasto Público. Procedimiento General de ejecución del Gasto Público: fases del procedimiento de la gestión del presupuesto y del pago. Documentos contables que intervienen. Anticipos de caja fija y pagos a justificar. El control interno.', normas: ['bep', 'lgp'] },
  { id: '3-03', bloque: 3, num: 3, titulo: 'Retribuciones del PTGAS e indemnizaciones', epigrafe: 'El régimen retributivo del personal de administración y servicios: funcionario y laboral. Las indemnizaciones por razón del servicio.', normas: ['trebep', 'l30_84', 'convenio', 'rd462', 'd251', 'bep'] },
  { id: '3-04', bloque: 3, num: 4, titulo: 'Retribuciones del profesorado', epigrafe: 'El régimen retributivo de los funcionarios docentes de la Universidad de La Laguna y del profesorado contratado de la Universidad de La Laguna.', normas: ['rd1086', 'd140', 'losu'] },
  // BLOQUE IV
  { id: '4-01', bloque: 4, num: 1, titulo: 'LOSU (I): autonomía, estructura y gobernanza', epigrafe: 'La Ley Orgánica 2/2023, de 22 de marzo, del Sistema Universitario (I): funciones del sistema universitario y autonomía de las universidades. Creación y reconocimiento de las universidades y calidad del sistema universitario. Régimen Jurídico y estructura de las universidades públicas. Gobernanza y representación en las universidades públicas. Cooperación, coordinación y participación en el sistema universitario. Acreditación.', normas: ['losu'] },
  { id: '4-02', bloque: 4, num: 2, titulo: 'LOSU (II): enseñanzas, títulos e investigación', epigrafe: 'La Ley Orgánica 2/2023, de 22 de marzo, del Sistema Universitario (II): organización de enseñanzas. Los Títulos universitarios. Investigación y transferencia e intercambio del conocimiento e innovación.', normas: ['losu'] },
  { id: '4-03', bloque: 4, num: 3, titulo: 'LOSU (III): estudiantado, PDI y PTGAS', epigrafe: 'La Ley Orgánica 2/2023, de 22 de marzo, del Sistema Universitario (III): el estudiantado en el sistema universitario. Personal docente e investigador. Personal técnico, de gestión y de administración y servicios.', normas: ['losu'] },
  { id: '4-04', bloque: 4, num: 4, titulo: 'Estatutos ULL (I): comunidad y órganos de gobierno', epigrafe: 'Estatutos de la Universidad de La Laguna (I): naturaleza, principios y funciones. La Comunidad universitaria: estudiantado, profesorado y personal de administración y servicios. Órganos de Gobierno y representación. Régimen electoral.', normas: ['estatutos', 'losu'] },
  { id: '4-05', bloque: 4, num: 5, titulo: 'Estatutos ULL (II): estudio, investigación y servicios', epigrafe: 'Estatutos de la Universidad de La Laguna (II): funciones universitarias: del estudio y de la investigación. Las relaciones con la sociedad, la extensión universitaria. Los servicios universitarios.', normas: ['estatutos'] },
  { id: '4-06', bloque: 4, num: 6, titulo: 'RD 822/2021: enseñanzas universitarias', epigrafe: 'El Real Decreto 822/2021, de 28 de septiembre, por el que se establece la organización de las enseñanzas universitarias y del procedimiento de aseguramiento de su calidad: disposiciones generales. Organización de las enseñanzas universitarias. Organización básica de las enseñanzas universitarias oficiales de Grado y de Máster. Verificación y acreditación de títulos.', normas: ['rd822'] },
  { id: '4-07', bloque: 4, num: 7, titulo: 'El Consejo Social de la ULL', epigrafe: 'El Consejo Social de la Universidad de La Laguna: normativa reguladora, naturaleza, régimen, funciones y competencias. Composición y funcionamiento.', normas: ['l11_2003', 'csocial', 'losu', 'estatutos'] },
  { id: '4-08', bloque: 4, num: 8, titulo: 'Personal investigador', epigrafe: 'El personal investigador. Modalidades contractuales de la Ley de la Ciencia, la Tecnología y la Innovación. El Estatuto del Personal Investigador en Formación.', normas: ['ciencia', 'epipf', 'losu'] },
]

export const temaById = (id: string) => TEMAS.find((t) => t.id === id)
export const bloqueById = (id: number) => BLOQUES.find((b) => b.id === id)!
export const temaLabel = (t: Tema) => `Tema ${bloqueById(t.bloque).romano}.${t.num}`
