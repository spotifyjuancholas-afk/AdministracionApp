import { supabase } from './supabase';

export type ClasePendiente = {
  claseId: number;
  numero: number;
  montoPagado: number;
  montoPendiente: number;
};

export type EstudiantePendiente = {
  inscripcionId: number;
  estudianteId: number | null;
  nombre: string;
  cedula: string;
  anteriores: ClasePendiente[];
  actual: ClasePendiente | null;
  totalPendiente: number;
};

type ObtenerPendientesParams = {
  cohorteCursoId: number;
  numeroClaseActual: number;
  precioClase: number;
};

export async function obtenerPendientesPago({
  cohorteCursoId,
  numeroClaseActual,
  precioClase,
}: ObtenerPendientesParams): Promise<EstudiantePendiente[]> {
  // 1. Clases que ya deberían estar pagadas
  const { data: clases, error: clasesError } =
    await supabase
      .from('clases')
      .select(`
        id,
        numero_clase
      `)
      .eq('cohorte_curso_id', cohorteCursoId)
      .lte('numero_clase', numeroClaseActual)
      .order('numero_clase');

  if (clasesError) {
    throw new Error(
      `Error cargando clases: ${clasesError.message}`
    );
  }

  if (!clases || clases.length === 0) {
    return [];
  }

  // 2. Estudiantes inscritos en ese curso
  const { data: inscripciones, error: inscripcionesError } =
    await supabase
      .from('inscripciones')
      .select(`
        id,
        estudiante_id,
        estudiantes (
          nombres,
          apellidos,
          cedula
        )
      `)
      .eq('cohorte_curso_id', cohorteCursoId)
      .order('id');

  if (inscripcionesError) {
    throw new Error(
      `Error cargando inscripciones: ${inscripcionesError.message}`
    );
  }

  if (!inscripciones || inscripciones.length === 0) {
    return [];
  }

  const inscripcionIds =
    inscripciones.map((item: any) => Number(item.id));

  const claseIds =
    clases.map((item: any) => Number(item.id));

  // 3. Todo lo que ya se aplicó como pago
  const { data: aplicaciones, error: aplicacionesError } =
    await supabase
      .from('pago_aplicaciones')
      .select(`
        inscripcion_id,
        clase_id,
        monto_aplicado
      `)
      .in('inscripcion_id', inscripcionIds)
      .in('clase_id', claseIds);

  if (aplicacionesError) {
    throw new Error(
      `Error cargando pagos aplicados: ${aplicacionesError.message}`
    );
  }

  // 4. Sumamos cuánto tiene pagado cada estudiante por cada clase
  const pagadoPorClase: Record<string, number> = {};

  (aplicaciones ?? []).forEach((aplicacion: any) => {
    if (
      aplicacion.inscripcion_id == null ||
      aplicacion.clase_id == null
    ) {
      return;
    }

    const clave =
      `${aplicacion.inscripcion_id}-${aplicacion.clase_id}`;

    pagadoPorClase[clave] =
      (pagadoPorClase[clave] ?? 0) +
      Number(aplicacion.monto_aplicado ?? 0);
  });

  // 5. Construimos la deuda de cada estudiante
  const resultado: EstudiantePendiente[] = [];

  inscripciones.forEach((inscripcion: any) => {
    const anteriores: ClasePendiente[] = [];
    let actual: ClasePendiente | null = null;

    clases.forEach((clase: any) => {
      const numero = Number(clase.numero_clase);
      const claseId = Number(clase.id);

      const clave =
        `${inscripcion.id}-${claseId}`;

      const montoPagado =
        pagadoPorClase[clave] ?? 0;

      const montoPendiente =
        Math.max(
          precioClase - montoPagado,
          0
        );

      // Esta clase ya está completamente pagada
      if (montoPendiente <= 0) {
        return;
      }

      const deuda: ClasePendiente = {
        claseId,
        numero,
        montoPagado,
        montoPendiente,
      };

      if (numero < numeroClaseActual) {
        anteriores.push(deuda);
      }

      if (numero === numeroClaseActual) {
        actual = deuda;
      }
    });

    if (
      anteriores.length === 0 &&
      actual === null
    ) {
      return;
    }

    const estudiante: any =
      inscripcion.estudiantes;

    const todasLasDeudas = [
      ...anteriores,
      ...(actual ? [actual] : []),
    ];

    const totalPendiente =
      todasLasDeudas.reduce(
        (total, deuda) =>
          total + deuda.montoPendiente,
        0
      );

    resultado.push({
      inscripcionId: Number(inscripcion.id),

      estudianteId:
        inscripcion.estudiante_id != null
          ? Number(inscripcion.estudiante_id)
          : null,

      nombre:
        `${estudiante?.nombres ?? ''} ${
          estudiante?.apellidos ?? ''
        }`.trim() || 'Estudiante',

      cedula:
        estudiante?.cedula ?? '',

      anteriores,
      actual,
      totalPendiente,
    });
  });

  return resultado;
}