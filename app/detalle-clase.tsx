import {
  obtenerPendientesPago
} from '@/utils/cobranza';
import { supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
export default function DetalleClaseScreen() {

  const params = useLocalSearchParams();
const [inscripciones, setInscripciones] = useState<any[]>([]);


  const claseId =
    typeof params.claseId === 'string'
      ? params.claseId
      : '';
const cohorteCursoId =
  typeof params.cohorteCursoId === 'string'
    ? params.cohorteCursoId
    : '';
  const numeroClase =
    typeof params.numeroClase === 'string'
      ? params.numeroClase
      : '';

  const curso =
    typeof params.curso === 'string'
      ? params.curso
      : 'Curso';

  const [estado, setEstado] = useState('pendiente');
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [fechaReal, setFechaReal] = useState('');
  const [motivoEstado, setMotivoEstado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [asistencias, setAsistencias] =
  useState<Record<number, string>>({});



const PRECIO_CLASE = 12;

const [pendientesPago, setPendientesPago] =
  useState<any[]>([]);

const [cargandoPendientes, setCargandoPendientes] =
  useState(false);

const totalPresentes = Object.values(asistencias).filter(
  (estado) => estado === 'presente'
).length;

const totalAusentes = Object.values(asistencias).filter(
  (estado) => estado === 'ausente'
).length;

const totalJustificados = Object.values(asistencias).filter(
  (estado) => estado === 'justificado'
).length;

  const estados = [
    'pendiente',
    'programada',
    'realizada',
    'no_realizada',
    'suspendida',
    'reprogramada',
    'cancelada',
  ];
useEffect(() => {
  async function cargarPendientes() {
    if (!cohorteCursoId || !numeroClase) {
      return;
    }

    setCargandoPendientes(true);

    try {
      const resultado = await obtenerPendientesPago({
        cohorteCursoId: Number(cohorteCursoId),
        numeroClaseActual: Number(numeroClase),
        precioClase: PRECIO_CLASE,
      });

      console.log(
        'PENDIENTES COBRANZA:',
        resultado
      );

      setPendientesPago(resultado);
    } catch (error) {
      console.log(
        'ERROR PENDIENTES COBRANZA:',
        error
      );

      setPendientesPago([]);
    } finally {
      setCargandoPendientes(false);
    }
  }

  cargarPendientes();
}, [cohorteCursoId, numeroClase]);

  useEffect(() => {
  cargarClase();

  async function cargarAsistencias() {
    if (!claseId) return;

    const { data: asistenciasData, error: asistenciasError } =
      await supabase
        .from('asistencias_estudiantes')
        .select(`
          inscripcion_id,
          estado
        `)
        .eq('clase_id', Number(claseId));

    if (asistenciasError) {
      console.log(
        'ERROR CARGANDO ASISTENCIAS:',
        asistenciasError.message
      );
      async function cargarPendientesPago() {
  if (!cohorteCursoId || !numeroClase) {
    return;
  }

  setCargandoPendientes(true);

  try {
    const numeroActual = Number(numeroClase);

    // 1. Buscar todas las clases hasta la clase actual
    const { data: clasesCurso, error: clasesError } =
      await supabase
        .from('clases')
        .select(`
          id,
          numero_clase
        `)
        .eq(
          'cohorte_curso_id',
          Number(cohorteCursoId)
        )
        .lte('numero_clase', numeroActual)
        .order('numero_clase');

    if (clasesError) {
      console.log(
        'ERROR CARGANDO CLASES PARA COBRANZA:',
        clasesError.message
      );

      return;
    }

    // 2. Buscar estudiantes inscritos en este curso
    const { data: inscritos, error: inscritosError } =
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
        .eq(
          'cohorte_curso_id',
          Number(cohorteCursoId)
        )
        .order('id');

    if (inscritosError) {
      console.log(
        'ERROR CARGANDO INSCRITOS PARA COBRANZA:',
        inscritosError.message
      );

      return;
    }

    if (
      !inscritos ||
      inscritos.length === 0 ||
      !clasesCurso ||
      clasesCurso.length === 0
    ) {
      setPendientesPago([]);
      return;
    }

    const inscripcionIds =
      inscritos.map((item: any) => item.id);

    const claseIds =
      clasesCurso.map((item: any) => item.id);

    // 3. Buscar todo lo que ya fue pagado/aplicado
    const { data: aplicaciones, error: aplicacionesError } =
      await supabase
        .from('pago_aplicaciones')
        .select(`
          inscripcion_id,
          clase_id,
          monto_aplicado
        `)
        .in(
          'inscripcion_id',
          inscripcionIds
        )
        .in(
          'clase_id',
          claseIds
        );

    if (aplicacionesError) {
      console.log(
        'ERROR CARGANDO PAGOS APLICADOS:',
        aplicacionesError.message
      );

      return;
    }

    // 4. Sumar pagos por estudiante + clase
    const montosPagados: Record<string, number> = {};

    (aplicaciones ?? []).forEach((item: any) => {
      if (
        item.inscripcion_id == null ||
        item.clase_id == null
      ) {
        return;
      }

      const clave =
        `${item.inscripcion_id}-${item.clase_id}`;

      const monto =
        Number(item.monto_aplicado ?? 0);

      montosPagados[clave] =
        (montosPagados[clave] ?? 0) + monto;
    });

    // 5. Detectar clases pendientes
    const resultado = inscritos
      .map((inscripcion: any) => {
        const anteriores: any[] = [];
        let actual: any = null;

        clasesCurso.forEach((clase: any) => {
          const clave =
            `${inscripcion.id}-${clase.id}`;

          const montoPagado =
            montosPagados[clave] ?? 0;

          const montoPendiente =
            Math.max(
              PRECIO_CLASE - montoPagado,
              0
            );

          // Ya pagó completamente esta clase
          if (montoPendiente <= 0) {
            return;
          }

          const pendiente = {
            claseId: clase.id,
            numero: clase.numero_clase,
            montoPagado,
            montoPendiente,
          };

          if (
            clase.numero_clase < numeroActual
          ) {
            anteriores.push(pendiente);
          }

          if (
            clase.numero_clase === numeroActual
          ) {
            actual = pendiente;
          }
        });

        if (
          anteriores.length === 0 &&
          !actual
        ) {
          return null;
        }

        const estudiante: any =
          inscripcion.estudiantes;

        const todosPendientes = [
          ...anteriores,
          ...(actual ? [actual] : []),
        ];

        const totalPendiente =
          todosPendientes.reduce(
            (total: number, item: any) =>
              total +
              Number(item.montoPendiente),
            0
          );

        return {
          inscripcionId: inscripcion.id,

          nombre:
            `${estudiante?.nombres ?? ''} ${
              estudiante?.apellidos ?? ''
            }`.trim() || 'Estudiante',

          cedula:
            estudiante?.cedula ?? '',

          anteriores,
          actual,
          totalPendiente,
        };
      })
      .filter(Boolean);

    console.log(
      'ESTUDIANTES POR PAGAR:',
      resultado
    );

    setPendientesPago(resultado);
  } catch (error) {
    console.log(
      'ERROR GENERAL CARGANDO PENDIENTES:',
      error
    );
  } finally {
    setCargandoPendientes(false);
  }
}
      return;
    }

    const mapa: Record<number, string> = {};

    (asistenciasData ?? []).forEach((item: any) => {
      mapa[item.inscripcion_id] = item.estado;
    });

    setAsistencias(mapa);
  }

  cargarAsistencias();
}, [claseId]);

  async function cargarClase() {
    const { data: inscripcionesData, error: inscripcionesError } =
  await supabase
    .from('inscripciones')
    .select(`
      id,
      estudiante_id,
      estado,
      estudiantes (
        nombres,
        apellidos,
        cedula
      )
    `)
    .eq('cohorte_curso_id', Number(cohorteCursoId))
    .order('id');

if (inscripcionesError) {
  console.log(
    'ERROR CARGANDO INSCRIPCIONES:',
    inscripcionesError.message
  );
} else {
    console.log('COHORTE CURSO ID:', cohorteCursoId);
  console.log('INSCRIPCIONES:', inscripcionesData);

  setInscripciones(inscripcionesData ?? []);
}
    if (!claseId) return;
console.log('INSCRIPCIONES DE LA CLASE:', inscripcionesData);
console.log('COHORTE CURSO ID:', cohorteCursoId);
    const { data, error } = await supabase
      .from('clases')
      .select(`
        id,
        numero_clase,
        fecha_programada,
        fecha_real,
        estado,
        motivo_estado,
        observaciones
      `)
      .eq('id', Number(claseId))
      .single();

    if (error) {
      console.log('ERROR CARGANDO CLASE:', error.message);
      return;
    }

    setEstado(data.estado ?? 'pendiente');
    setFechaProgramada(data.fecha_programada ?? '');
    setFechaReal(data.fecha_real ?? '');
    setMotivoEstado(data.motivo_estado ?? '');
    setObservaciones(data.observaciones ?? '');
  }

  async function guardarCambios() {
    if (!claseId) {
      alert('No se encontró la clase.');
      return;
    }

    setGuardando(true);

    const { error } = await supabase
      .from('clases')
      .update({
        estado,
        fecha_programada: fechaProgramada || null,
        fecha_real: fechaReal || null,
        motivo_estado: motivoEstado || null,
        observaciones: observaciones || null,
      })
      .eq('id', Number(claseId));

    setGuardando(false);

    if (error) {
      console.log('ERROR GUARDANDO CLASE:', error);
      alert('No se pudieron guardar los cambios.');
      return;
    }

    alert('Clase actualizada correctamente.');
  }
async function guardarAsistencia(
  
  inscripcionId: number,
  estadoAsistencia: 'presente' | 'ausente' | 'justificado'
  
) {
  if (!claseId) {
    alert('No se encontró la clase.');
    return;
  }

  const asistio = estadoAsistencia === 'presente';

  const { error } = await supabase
    .from('asistencias_estudiantes')
    .upsert(
      {
        clase_id: Number(claseId),
        inscripcion_id: inscripcionId,
        asistio,
        estado: estadoAsistencia,
      },
      {
        onConflict: 'clase_id,inscripcion_id',
      }
    );

  if (error) {
    console.log('ERROR GUARDANDO ASISTENCIA:', error);
    alert('No se pudo guardar la asistencia.');
    return;
  }
setAsistencias((prev) => ({
  ...prev,
  [inscripcionId]: estadoAsistencia,
}));
  alert('Asistencia guardada.');
}
  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color="#111827"
            />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.title}>
              Clase {numeroClase}
            </Text>

            <Text style={styles.subtitle}>
              {curso}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Estado de la clase
        </Text>

        <View style={styles.statesContainer}>
          {estados.map((item) => {
            const seleccionado = estado === item;

            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.stateButton,
                  seleccionado && styles.stateButtonSelected,
                ]}
                onPress={() => setEstado(item)}
              >
                <Text
                  style={[
                    styles.stateText,
                    seleccionado && styles.stateTextSelected,
                  ]}
                >
                  {item.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>
          Fecha programada
        </Text>

        <TextInput
          style={styles.input}
          placeholder="AAAA-MM-DD"
          placeholderTextColor="#9CA3AF"
          value={fechaProgramada}
          onChangeText={setFechaProgramada}
        />

        <Text style={styles.label}>
          Fecha real
        </Text>

        <TextInput
          style={styles.input}
          placeholder="AAAA-MM-DD"
          placeholderTextColor="#9CA3AF"
          value={fechaReal}
          onChangeText={setFechaReal}
        />

        <Text style={styles.label}>
          Motivo / novedad
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ej: Profesor ausente, suspensión, retraso..."
          placeholderTextColor="#9CA3AF"
          value={motivoEstado}
          onChangeText={setMotivoEstado}
        />

        <Text style={styles.label}>
          Observaciones
        </Text>

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Escribe cualquier detalle adicional"
          placeholderTextColor="#9CA3AF"
          value={observaciones}
          onChangeText={setObservaciones}
          multiline
        />
        <View style={styles.attendanceSummary}>
  <View style={styles.attendanceSummaryItem}>
    <Text style={styles.attendanceSummaryNumber}>
      {totalPresentes}
    </Text>
    <Text style={styles.attendanceSummaryLabel}>
      Presentes
    </Text>
  </View>

  <View style={styles.attendanceSummaryItem}>
    <Text style={styles.attendanceSummaryNumber}>
      {totalAusentes}
    </Text>
    <Text style={styles.attendanceSummaryLabel}>
      Ausentes
    </Text>
  </View>

  <View style={styles.attendanceSummaryItem}>
    <Text style={styles.attendanceSummaryNumber}>
      {totalJustificados}
    </Text>
    <Text style={styles.attendanceSummaryLabel}>
      Justificados
    </Text>
  </View>
</View>
<View style={styles.deudaSection}>
  <View style={styles.deudaHeader}>
    <View>
      <Text style={styles.deudaTitle}>
        Estudiantes por pagar
      </Text>

      <Text style={styles.deudaSubtitle}>
        Pendientes hasta la Clase {numeroClase}
      </Text>
    </View>

    <View style={styles.deudaCounter}>
      <Text style={styles.deudaCounterText}>
        {pendientesPago.length}
      </Text>
    </View>
  </View>

  {cargandoPendientes ? (
    <View style={styles.deudaMessage}>
      <Text style={styles.deudaMessageText}>
        Revisando pagos...
      </Text>
    </View>
  ) : pendientesPago.length === 0 ? (
    <View style={styles.deudaOk}>
      <Text style={styles.deudaOkText}>
        ✓ Todos los estudiantes están al día
      </Text>
    </View>
  ) : (
    pendientesPago.map((item) => (
      <View
        key={item.inscripcionId}
        style={styles.deudaCard}
      >
        <Text style={styles.deudaNombre}>
          {item.nombre}
        </Text>

        {!!item.cedula && (
          <Text style={styles.deudaCedula}>
            C.I. {item.cedula}
          </Text>
        )}

        {item.anteriores.length > 0 && (
          <Text style={styles.deudaAnterior}>
            Pendiente anterior:{' '}
            {item.anteriores
              .map(
  (clase: any) =>
    `Clase ${clase.numero}`
)
              .join(' · ')}
          </Text>
        )}

        {item.actual && (
          <Text style={styles.deudaActual}>
            Clase actual pendiente: Clase{' '}
            {item.actual.numero}
          </Text>
        )}

        <Text style={styles.deudaTotal}>
          Total pendiente: $
          {item.totalPendiente.toFixed(2)}
        </Text>

        <TouchableOpacity
          style={styles.deudaButton}
          onPress={() =>
            router.push({
              pathname: '/estado-cuenta',
              params: {
                inscripcionId: String(
                  item.inscripcionId
                ),
                cohorteCursoId: String(
                  cohorteCursoId
                ),
                estudiante: item.nombre,
                curso,
                numeroClaseActual: String(
                  numeroClase
                ),
              },
            })
          }
        >
          <Text style={styles.deudaButtonText}>
            Ver estado de cuenta
          <TouchableOpacity
  style={styles.deudaPayButton}
  onPress={() =>
    router.push({
      pathname: '/cargar-pago',
      params: {
        inscripcionId: String(
          item.inscripcionId
        ),
        cohorteCursoId: String(
          cohorteCursoId
        ),
        estudiante: item.nombre,
        curso,
        numeroClaseActual: String(
          numeroClase
        ),
      },
    })
  }
>
  <Text style={styles.deudaPayButtonText}>
    Cargar pago
  </Text>
</TouchableOpacity>  
          </Text>
          
        </TouchableOpacity>
      </View>
    ))
  )}
</View>
<Text style={styles.sectionTitle}>
  Asistencia
</Text>

<Text style={styles.sectionSubtitle}>
  Estudiantes inscritos en este curso
</Text>

{inscripciones.length === 0 ? (
  <View style={styles.emptyCard}>
    <Text style={styles.emptyText}>
      No hay estudiantes inscritos.
    </Text>
  </View>
) : (
  inscripciones.map((inscripcion: any) => {
    const estudiante: any = inscripcion.estudiantes;
const estadoActual = asistencias[inscripcion.id];

console.log(
  'ESTADO VISUAL:',
  inscripcion.id,
  estadoActual
);

    return (
      <View
        key={inscripcion.id}
        style={styles.studentCard}
      >
        <View style={styles.studentAvatar}>
          <Ionicons
            name="person-outline"
            size={21}
            color="#1565C0"
          />
        </View>

        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>
            {estudiante?.nombres ?? 'Estudiante'}{' '}
            {estudiante?.apellidos ?? ''}
          </Text>

          <Text style={styles.studentMeta}>
            {estudiante?.cedula
              ? `C.I. ${estudiante.cedula}`
              : 'Sin cédula'}
          </Text>
        </View>

<View style={styles.attendanceButtons}>
  <TouchableOpacity
    style={[
      styles.presentButton,
      estadoActual === 'presente' &&
        styles.presentButtonSelected,
    ]}
    onPress={() =>
      guardarAsistencia(
        inscripcion.id,
        'presente'
      )
    }
  >
    <Text
      style={[
        styles.presentButtonText,
        estadoActual === 'presente' &&
          styles.attendanceTextSelected,
      ]}
    >
      Presente
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[
      styles.absentButton,
      estadoActual === 'ausente' &&
        styles.absentButtonSelected,
    ]}
    onPress={() =>
      guardarAsistencia(
        inscripcion.id,
        'ausente'
      )
    }
  >
    <Text
      style={[
        styles.absentButtonText,
        estadoActual === 'ausente' &&
          styles.attendanceTextSelected,
      ]}
    >
      Ausente
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[
      styles.justifiedButton,
      estadoActual === 'justificado' &&
        styles.justifiedButtonSelected,
    ]}
    onPress={() =>
      guardarAsistencia(
        inscripcion.id,
        'justificado'
      )
    }
  >
    <Text
      style={[
        styles.justifiedButtonText,
        estadoActual === 'justificado' &&
          styles.attendanceTextSelected,
      ]}
    >
      Justificado
    </Text>
  </TouchableOpacity>
</View>
</View>
    );
  })
)}

        <TouchableOpacity
          style={[
            styles.saveButton,
            guardando && styles.saveButtonDisabled,
          ]}
          disabled={guardando}
          onPress={guardarCambios}
        >
          <Ionicons
            name="save-outline"
            size={20}
            color="#FFFFFF"
          />

          <Text style={styles.saveButtonText}>
            {guardando
              ? 'Guardando...'
              : 'Guardar cambios'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 58,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },

  statesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 22,
  },

  stateButton: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  stateButtonSelected: {
    backgroundColor: '#1565C0',
    borderColor: '#1565C0',
  },

  stateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
    textTransform: 'capitalize',
  },

  stateTextSelected: {
    color: '#FFFFFF',
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 14,
    marginBottom: 8,
  },

  input: {
    minHeight: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  saveButton: {
    height: 55,
    borderRadius: 15,
    backgroundColor: '#1565C0',
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSubtitle: {
  fontSize: 12,
  color: '#6B7280',
  marginTop: -6,
  marginBottom: 12,
},

studentCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 14,
  marginBottom: 10,
  flexDirection: 'row',
  alignItems: 'center',
},

studentAvatar: {
  width: 42,
  height: 42,
  borderRadius: 13,
  backgroundColor: '#EFF6FF',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 11,
},

studentInfo: {
  flex: 1,
},

studentName: {
  fontSize: 14,
  fontWeight: '800',
  color: '#111827',
},

studentMeta: {
  fontSize: 11,
  color: '#6B7280',
  marginTop: 3,
},

presentButton: {
  backgroundColor: '#ECFDF5',
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 12,
},

presentButtonText: {
  color: '#047857',
  fontSize: 11,
  fontWeight: '800',
},

emptyCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 18,
  marginBottom: 12,
},

emptyText: {
  color: '#6B7280',
  fontSize: 13,
  textAlign: 'center',
},

attendanceButtons: {
  flexDirection: 'row',
  gap: 6,
},

absentButton: {
  backgroundColor: '#FEF2F2',
  paddingHorizontal: 10,
  paddingVertical: 8,
  borderRadius: 12,
},

absentButtonText: {
  color: '#B91C1C',
  fontSize: 10,
  fontWeight: '800',
},

justifiedButton: {
  backgroundColor: '#FFFBEB',
  paddingHorizontal: 10,
  paddingVertical: 8,
  borderRadius: 12,
},

justifiedButtonText: {
  color: '#B45309',
  fontSize: 10,
  fontWeight: '800',
},
presentButtonSelected: {
  backgroundColor: '#059669',
},

absentButtonSelected: {
  backgroundColor: '#DC2626',
},

justifiedButtonSelected: {
  backgroundColor: '#D97706',
},

attendanceTextSelected: {
  color: '#FFFFFF',
},
attendanceSummary: {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  paddingVertical: 16,
  paddingHorizontal: 10,
  flexDirection: 'row',
  marginBottom: 18,
},

attendanceSummaryItem: {
  flex: 1,
  alignItems: 'center',
},

attendanceSummaryNumber: {
  fontSize: 22,
  fontWeight: '800',
  color: '#111827',
},

attendanceSummaryLabel: {
  fontSize: 11,
  color: '#6B7280',
  marginTop: 3,
  
},
pendingSection: {
  marginBottom: 22,
},

pendingHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
},

pendingTitle: {
  fontSize: 18,
  fontWeight: '800',
  color: '#111827',
},

pendingSubtitle: {
  fontSize: 11,
  color: '#6B7280',
  marginTop: 2,
},

pendingCounter: {
  minWidth: 34,
  height: 34,
  borderRadius: 17,
  backgroundColor: '#FEE2E2',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 8,
},

pendingCounterText: {
  fontSize: 14,
  fontWeight: '800',
  color: '#B91C1C',
},

pendingCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 15,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: '#FECACA',
},

pendingStudentName: {
  fontSize: 15,
  fontWeight: '800',
  color: '#111827',
},

pendingCedula: {
  fontSize: 11,
  color: '#6B7280',
  marginTop: 3,
  marginBottom: 9,
},

pendingPrevious: {
  fontSize: 12,
  fontWeight: '700',
  color: '#B91C1C',
  marginBottom: 5,
},

pendingCurrent: {
  fontSize: 12,
  fontWeight: '700',
  color: '#D97706',
  marginBottom: 5,
},

pendingAmount: {
  fontSize: 13,
  fontWeight: '800',
  color: '#111827',
  marginTop: 5,
},

pendingEmpty: {
  backgroundColor: '#F9FAFB',
  borderRadius: 14,
  padding: 16,
},

pendingEmptyText: {
  fontSize: 12,
  color: '#6B7280',
  textAlign: 'center',
},

pendingOk: {
  backgroundColor: '#ECFDF5',
  borderRadius: 14,
  padding: 16,
},

pendingOkText: {
  fontSize: 12,
  fontWeight: '700',
  color: '#047857',
  textAlign: 'center',
},
accountButton: {
  marginTop: 12,
  backgroundColor: '#EFF6FF',
  paddingVertical: 11,
  borderRadius: 11,
  alignItems: 'center',
},

accountButtonText: {
  fontSize: 12,
  fontWeight: '800',
  color: '#1565C0',
},
deudaSection: {
  marginBottom: 24,
},

deudaHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
},

deudaTitle: {
  fontSize: 18,
  fontWeight: '800',
  color: '#111827',
},

deudaSubtitle: {
  fontSize: 11,
  color: '#6B7280',
  marginTop: 3,
},

deudaCounter: {
  minWidth: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: '#FEE2E2',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 8,
},

deudaCounterText: {
  fontSize: 15,
  fontWeight: '900',
  color: '#B91C1C',
},

deudaCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#FECACA',
  padding: 15,
  marginBottom: 10,
},

deudaNombre: {
  fontSize: 15,
  fontWeight: '800',
  color: '#111827',
},

deudaCedula: {
  fontSize: 11,
  color: '#6B7280',
  marginTop: 3,
  marginBottom: 9,
},

deudaAnterior: {
  fontSize: 12,
  fontWeight: '700',
  color: '#B91C1C',
  marginBottom: 5,
},

deudaActual: {
  fontSize: 12,
  fontWeight: '700',
  color: '#D97706',
  marginBottom: 5,
},

deudaTotal: {
  fontSize: 14,
  fontWeight: '900',
  color: '#111827',
  marginTop: 5,
},

deudaButton: {
  marginTop: 12,
  backgroundColor: '#EFF6FF',
  borderRadius: 11,
  paddingVertical: 11,
  alignItems: 'center',
},

deudaButtonText: {
  fontSize: 12,
  fontWeight: '800',
  color: '#1565C0',
},

deudaMessage: {
  backgroundColor: '#F9FAFB',
  borderRadius: 14,
  padding: 15,
},

deudaMessageText: {
  fontSize: 12,
  color: '#6B7280',
  textAlign: 'center',
},

deudaOk: {
  backgroundColor: '#ECFDF5',
  borderRadius: 14,
  padding: 15,
},

deudaOkText: {
  fontSize: 12,
  fontWeight: '700',
  color: '#047857',
  textAlign: 'center',
},
deudaPayButton: {
  marginTop: 8,
  backgroundColor: '#1565C0',
  borderRadius: 11,
  paddingVertical: 12,
  alignItems: 'center',
},

deudaPayButtonText: {
  color: '#FFFFFF',
  fontSize: 12,
  fontWeight: '800',
},
});