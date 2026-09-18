import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '@/utils/supabase';

const PRECIO_CLASE = 12;

export default function CargarPagoScreen() {
  const params = useLocalSearchParams();

  const inscripcionId =
    typeof params.inscripcionId === 'string'
      ? params.inscripcionId
      : '';

  const cohorteCursoId =
    typeof params.cohorteCursoId === 'string'
      ? params.cohorteCursoId
      : '';

  const estudiante =
    typeof params.estudiante === 'string'
      ? params.estudiante
      : 'Estudiante';

  const curso =
    typeof params.curso === 'string'
      ? params.curso
      : 'Curso';

  const numeroClaseActual =
    typeof params.numeroClaseActual === 'string'
      ? Number(params.numeroClaseActual)
      : 1;

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [sedeId, setSedeId] = useState<number | null>(null);

  const [deudas, setDeudas] = useState<any[]>([]);
  const [seleccionadas, setSeleccionadas] =
    useState<number[]>([]);

  const [metodoPago, setMetodoPago] =
    useState('pago_movil');

  const [moneda, setMoneda] =
    useState('USD');
    const requiereReferencia =
  metodoPago === 'pago_movil' ||
  metodoPago === 'transferencia';

  const [referencia, setReferencia] =
    useState('');

  const [observaciones, setObservaciones] =
    useState('');

  useEffect(() => {
    cargarDeudas();
  }, [inscripcionId, cohorteCursoId]);

  async function cargarDeudas() {
    if (!inscripcionId || !cohorteCursoId) {
      setCargando(false);
      return;
    }

    setCargando(true);

    try {
      // 1. Datos de la inscripción
      const {
        data: inscripcion,
        error: inscripcionError,
      } = await supabase
        .from('inscripciones')
        .select(`
          id,
          sede_id
        `)
        .eq('id', Number(inscripcionId))
        .single();

      if (inscripcionError) {
        console.log(
          'ERROR CARGANDO INSCRIPCIÓN:',
          inscripcionError.message
        );
        return;
      }

      setSedeId(
        inscripcion?.sede_id != null
          ? Number(inscripcion.sede_id)
          : null
      );

      // 2. Clases hasta la clase actual
      const {
        data: clases,
        error: clasesError,
      } = await supabase
        .from('clases')
        .select(`
          id,
          numero_clase
        `)
        .eq(
          'cohorte_curso_id',
          Number(cohorteCursoId)
        )
        .lte(
          'numero_clase',
          numeroClaseActual
        )
        .order('numero_clase');

      if (clasesError) {
        console.log(
          'ERROR CARGANDO CLASES:',
          clasesError.message
        );
        return;
      }

      if (!clases || clases.length === 0) {
        setDeudas([]);
        return;
      }

      const claseIds =
        clases.map((clase: any) =>
          Number(clase.id)
        );

      // 3. Pagos aplicados anteriormente
      const {
        data: aplicaciones,
        error: aplicacionesError,
      } = await supabase
        .from('pago_aplicaciones')
        .select(`
          clase_id,
          monto_aplicado
        `)
        .eq(
          'inscripcion_id',
          Number(inscripcionId)
        )
        .in('clase_id', claseIds);

      if (aplicacionesError) {
        console.log(
          'ERROR CARGANDO APLICACIONES:',
          aplicacionesError.message
        );
        return;
      }

      const pagadoPorClase:
        Record<number, number> = {};

      (aplicaciones ?? []).forEach(
        (aplicacion: any) => {
          if (aplicacion.clase_id == null) {
            return;
          }

          const claseId =
            Number(aplicacion.clase_id);

          pagadoPorClase[claseId] =
            (pagadoPorClase[claseId] ?? 0) +
            Number(
              aplicacion.monto_aplicado ?? 0
            );
        }
      );

      const pendientes =
        clases
          .map((clase: any) => {
            const pagado =
              pagadoPorClase[
                Number(clase.id)
              ] ?? 0;

            const pendiente =
              Math.max(
                PRECIO_CLASE - pagado,
                0
              );

            return {
              claseId: Number(clase.id),
              numeroClase:
                Number(clase.numero_clase),
              pagado,
              pendiente,
            };
          })
          .filter(
            (clase: any) =>
              clase.pendiente > 0
          );

      setDeudas(pendientes);

      // Seleccionamos todas por defecto
      setSeleccionadas(
        pendientes.map(
          (clase: any) =>
            clase.claseId
        )
      );
    } catch (error) {
      console.log(
        'ERROR GENERAL CARGANDO DEUDAS:',
        error
      );
    } finally {
      setCargando(false);
    }
  }

  function alternarClase(claseId: number) {
    setSeleccionadas((prev) => {
      if (prev.includes(claseId)) {
        return prev.filter(
          (id) => id !== claseId
        );
      }

      return [...prev, claseId];
    });
  }

  const clasesSeleccionadas =
    deudas.filter((clase) =>
      seleccionadas.includes(
        clase.claseId
      )
    );

  const totalAplicar =
    clasesSeleccionadas.reduce(
      (total, clase) =>
        total +
        Number(clase.pendiente),
      0
    );

  async function guardarPago() {
    if (seleccionadas.length === 0) {
      alert(
        'Selecciona al menos una clase.'
      );
      return;
    }

   if (
  requiereReferencia &&
  !referencia.trim()
) {
  alert(
    'Ingresa la referencia del pago.'
  );
  return;
}

    if (!sedeId) {
      alert(
        'No se encontró la sede de la inscripción.'
      );
      return;
    }

    setGuardando(true);

    try {
      // Evitar registrar dos veces
      // la misma referencia
      if (requiereReferencia) {
  const {
    data: pagoExistente,
    error: buscarError,
  } = await supabase
    .from('pagos_estudiantes')
    .select('id')
    .eq(
      'referencia',
      referencia.trim()
    )
    .maybeSingle();

  if (buscarError) {
    console.log(
      'ERROR VERIFICANDO REFERENCIA:',
      buscarError.message
    );
  }

  if (pagoExistente) {
    alert(
      'Esta referencia ya fue registrada anteriormente.'
    );
    return;
  }
}

     

      

      // 1. Crear movimiento principal
      const {
        data: pago,
        error: pagoError,
      } = await supabase
        .from('pagos_estudiantes')
        .insert({
          sede_id: sedeId,
          metodo_pago: metodoPago,
          monto_total: totalAplicar,
            moneda: metodoPago === 'efectivo_divisa' ? 'USD' : 'BS',
          referencia:
  requiereReferencia
    ? referencia.trim()
    : null,
          fecha_pago:
            new Date().toISOString(),
          observaciones:
            observaciones.trim() ||
            null,
        })
        .select('id')
        .single();

      if (pagoError) {
  console.log('========== ERROR GUARDANDO PAGO ==========');
  console.log('MESSAGE:', pagoError.message);
  console.log('CODE:', pagoError.code);
  console.log('DETAILS:', pagoError.details);
  console.log('HINT:', pagoError.hint);
  console.log('ERROR COMPLETO:', pagoError);

  alert(
    `No se pudo registrar el pago.\n\n${pagoError.message}`
  );

  return;
}

      // 2. Aplicar el pago a las clases
      const aplicaciones =
        clasesSeleccionadas.map(
          (clase) => ({
            pago_id: pago.id,
            inscripcion_id:
              Number(inscripcionId),
            clase_id:
              clase.claseId,
            tipo_concepto: 'aporte_clase',
            monto_aplicado:
              clase.pendiente,
            genera_aporte_profesor:
              true,
          })
        );

      const {
        error: aplicacionesError,
      } = await supabase
        .from('pago_aplicaciones')
        .insert(aplicaciones);

      if (aplicacionesError) {
        console.log(
          'ERROR APLICANDO PAGO:',
          aplicacionesError
        );

        alert(
          'El pago fue registrado, pero hubo un problema aplicándolo a las clases.'
        );
        return;
      }

      alert(
        `Pago registrado correctamente por $${totalAplicar.toFixed(
          2
        )}.`
      );

      router.back();
    } catch (error) {
      console.log(
        'ERROR GENERAL GUARDANDO PAGO:',
        error
      );

      alert(
        'Ocurrió un error al guardar el pago.'
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Cargando deuda...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
    >
      <Text style={styles.title}>
        Cargar pago
      </Text>

      <Text style={styles.student}>
        {estudiante}
      </Text>

      <Text style={styles.course}>
        {curso}
      </Text>

      <Text style={styles.sectionTitle}>
        Clases a pagar
      </Text>

      {deudas.length === 0 ? (
        <View style={styles.okCard}>
          <Text style={styles.okText}>
            ✓ El estudiante no tiene
            clases pendientes.
          </Text>
        </View>
      ) : (
        deudas.map((clase) => {
          const activa =
            seleccionadas.includes(
              clase.claseId
            );

          return (
            <TouchableOpacity
              key={clase.claseId}
              style={[
                styles.classCard,
                activa &&
                  styles.classCardSelected,
              ]}
              onPress={() =>
                alternarClase(
                  clase.claseId
                )
              }
            >
              <View
                style={[
                  styles.checkbox,
                  activa &&
                    styles.checkboxSelected,
                ]}
              >
                <Text
                  style={
                    styles.checkboxText
                  }
                >
                  {activa ? '✓' : ''}
                </Text>
              </View>

              <View style={styles.classInfo}>
                <Text
                  style={styles.classTitle}
                >
                  Clase{' '}
                  {clase.numeroClase}
                </Text>

                {clase.pagado > 0 && (
                  <Text
                    style={styles.partial}
                  >
                    Pagado anteriormente: $
                    {clase.pagado.toFixed(
                      2
                    )}
                  </Text>
                )}
              </View>

              <Text
                style={styles.amount}
              >
                $
                {clase.pendiente.toFixed(
                  2
                )}
              </Text>
            </TouchableOpacity>
          );
        })
      )}

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>
          Total a aplicar
        </Text>

        <Text style={styles.totalAmount}>
          ${totalAplicar.toFixed(2)}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        Método de pago
      </Text>

      <View style={styles.options}>
        {[
          ['pago_movil', 'Pago Móvil'],
          ['transferencia', 'Transferencia'],
          ['efectivo', 'Efectivo'],
        ].map(([valor, texto]) => (
          <TouchableOpacity
            key={valor}
            style={[
              styles.option,
              metodoPago === valor &&
                styles.optionSelected,
            ]}
            onPress={() =>
              setMetodoPago(valor)
            }
          >
            <Text
              style={[
                styles.optionText,
                metodoPago === valor &&
                  styles.optionTextSelected,
              ]}
            >
              {texto}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>
        Moneda
      </Text>

      <View style={styles.options}>
        {['USD', 'VES'].map(
          (valor) => (
            <TouchableOpacity
              key={valor}
              style={[
                styles.option,
                moneda === valor &&
                  styles.optionSelected,
              ]}
              onPress={() =>
                setMoneda(valor)
              }
            >
              <Text
                style={[
                  styles.optionText,
                  moneda === valor &&
                    styles.optionTextSelected,
                ]}
              >
                {valor}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {requiereReferencia && (
  <>
    {requiereReferencia && (
  <>
    <Text style={styles.inputLabel}>
      Referencia / últimos dígitos
    </Text>

    <TextInput
      style={styles.input}
      value={referencia}
      onChangeText={setReferencia}
      placeholder="Ej: 684821"
      keyboardType="numeric"
    />
  </>
)}
  </>
)}

      <Text style={styles.inputLabel}>
        Observaciones
      </Text>

      <TextInput
        style={[
          styles.input,
          styles.textArea,
        ]}
        value={observaciones}
        onChangeText={
          setObservaciones
        }
        placeholder="Opcional"
        multiline
      />

      <TouchableOpacity
        style={[
          styles.saveButton,
          (guardando ||
            seleccionadas.length ===
              0) &&
            styles.saveButtonDisabled,
        ]}
        disabled={
          guardando ||
          seleccionadas.length === 0
        }
        onPress={guardarPago}
      >
        <Text
          style={styles.saveButtonText}
        >
          {guardando
            ? 'Guardando...'
            : `Registrar pago · $${totalAplicar.toFixed(
                2
              )}`}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },

  content: {
    padding: 18,
    paddingBottom: 50,
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 10,
    color: '#6B7280',
  },

  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111827',
  },

  student: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 16,
  },

  course: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginTop: 18,
    marginBottom: 10,
  },

  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 15,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  classCardSelected: {
    borderColor: '#1565C0',
    backgroundColor: '#EFF6FF',
  },

  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  checkboxSelected: {
    backgroundColor: '#1565C0',
    borderColor: '#1565C0',
  },

  checkboxText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  classInfo: {
    flex: 1,
  },

  classTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  partial: {
    fontSize: 10,
    color: '#D97706',
    marginTop: 3,
  },

  amount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
  },

  totalCard: {
    marginTop: 10,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  totalLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  totalAmount: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },

  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  option: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 11,
  },

  optionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1565C0',
  },

  optionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },

  optionTextSelected: {
    color: '#1565C0',
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginTop: 18,
    marginBottom: 7,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },

  textArea: {
    minHeight: 85,
    textAlignVertical: 'top',
  },

  saveButton: {
    marginTop: 26,
    backgroundColor: '#1565C0',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },

  saveButtonDisabled: {
    opacity: 0.5,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  okCard: {
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 14,
  },

  okText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});