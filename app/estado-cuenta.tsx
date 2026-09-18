import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { supabase } from '@/utils/supabase';

const PRECIO_CLASE = 12;

export default function EstadoCuentaScreen() {
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

  const [clases, setClases] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarEstadoCuenta();
  }, [inscripcionId, cohorteCursoId]);

  async function cargarEstadoCuenta() {
    if (!inscripcionId || !cohorteCursoId) {
      setCargando(false);
      return;
    }

    setCargando(true);

    try {
      const { data: clasesData, error: clasesError } =
        await supabase
          .from('clases')
          .select(`
            id,
            numero_clase,
            estado,
            fecha_programada
          `)
          .eq(
            'cohorte_curso_id',
            Number(cohorteCursoId)
          )
          .order('numero_clase');

      if (clasesError) {
        console.log(
          'ERROR CARGANDO CLASES:',
          clasesError.message
        );
        return;
      }

      const claseIds =
        (clasesData ?? []).map(
          (clase: any) => clase.id
        );

      let aplicaciones: any[] = [];

      if (claseIds.length > 0) {
        const {
          data: aplicacionesData,
          error: aplicacionesError,
        } = await supabase
          .from('pago_aplicaciones')
          .select(`
            id,
            clase_id,
            monto_aplicado,
            tipo_concepto
          `)
          .eq(
            'inscripcion_id',
            Number(inscripcionId)
          )
          .in('clase_id', claseIds);

        if (aplicacionesError) {
          console.log(
            'ERROR CARGANDO PAGOS:',
            aplicacionesError.message
          );
          return;
        }

        aplicaciones = aplicacionesData ?? [];
      }

      const pagosPorClase: Record<number, number> = {};

      aplicaciones.forEach((aplicacion: any) => {
        if (aplicacion.clase_id == null) {
          return;
        }

        const claseId = Number(
          aplicacion.clase_id
        );

        pagosPorClase[claseId] =
          (pagosPorClase[claseId] ?? 0) +
          Number(
            aplicacion.monto_aplicado ?? 0
          );
      });

      const resultado =
        (clasesData ?? []).map(
          (clase: any) => {
            const pagado =
              pagosPorClase[clase.id] ?? 0;

            const esFutura =
              Number(clase.numero_clase) >
              numeroClaseActual;

            let estadoPago:
              | 'pagada'
              | 'parcial'
              | 'pendiente'
              | 'proxima';

            if (esFutura) {
              estadoPago = 'proxima';
            } else if (
              pagado >= PRECIO_CLASE
            ) {
              estadoPago = 'pagada';
            } else if (pagado > 0) {
              estadoPago = 'parcial';
            } else {
              estadoPago = 'pendiente';
            }

            const pendiente =
              esFutura
                ? 0
                : Math.max(
                    PRECIO_CLASE - pagado,
                    0
                  );

            return {
              ...clase,
              pagado,
              pendiente,
              estadoPago,
            };
          }
        );

      setClases(resultado);
    } catch (error) {
      console.log(
        'ERROR ESTADO DE CUENTA:',
        error
      );
    } finally {
      setCargando(false);
    }
  }

  const clasesVencidas =
    clases.filter(
      (clase) =>
        clase.estadoPago !== 'proxima'
    );

  const totalPagado =
    clasesVencidas.reduce(
      (total, clase) =>
        total + Number(clase.pagado),
      0
    );

  const totalPendiente =
    clasesVencidas.reduce(
      (total, clase) =>
        total + Number(clase.pendiente),
      0
    );

  const clasesPagadas =
    clases.filter(
      (clase) =>
        clase.estadoPago === 'pagada'
    ).length;

  const clasesPendientes =
    clases.filter(
      (clase) =>
        clase.estadoPago === 'pendiente' ||
        clase.estadoPago === 'parcial'
    ).length;

  if (cargando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          Cargando estado de cuenta...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.studentHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {estudiante
              .charAt(0)
              .toUpperCase()}
          </Text>
        </View>

        <View style={styles.studentHeaderInfo}>
          <Text style={styles.studentName}>
            {estudiante}
          </Text>

          <Text style={styles.courseName}>
            {curso}
          </Text>

          <Text style={styles.currentClass}>
            Clase actual: {numeroClaseActual}
          </Text>
        </View>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            ${totalPagado.toFixed(2)}
          </Text>
          <Text style={styles.summaryLabel}>
            Pagado
          </Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            ${totalPendiente.toFixed(2)}
          </Text>
          <Text style={styles.summaryLabel}>
            Pendiente
          </Text>
        </View>
      </View>

      <View style={styles.secondarySummary}>
        <Text style={styles.secondaryText}>
          {clasesPagadas} pagadas
        </Text>

        <Text style={styles.secondaryDot}>
          •
        </Text>

        <Text style={styles.secondaryText}>
          {clasesPendientes} pendientes
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        Estado por clase
      </Text>

      {clases.map((clase: any) => {
        return (
          <View
            key={clase.id}
            style={styles.classCard}
          >
            <View style={styles.classNumber}>
              <Text style={styles.classNumberText}>
                {clase.numero_clase}
              </Text>
            </View>

            <View style={styles.classInfo}>
              <Text style={styles.classTitle}>
                Clase {clase.numero_clase}
              </Text>

              {clase.estadoPago ===
                'pagada' && (
                <Text style={styles.paidText}>
                  ✓ Pagada · $
                  {Number(
                    clase.pagado
                  ).toFixed(2)}
                </Text>
              )}

              {clase.estadoPago ===
                'parcial' && (
                <Text
                  style={styles.partialText}
                >
                  Pago parcial · $
                  {Number(
                    clase.pagado
                  ).toFixed(2)}{' '}
                  de ${PRECIO_CLASE.toFixed(2)}
                </Text>
              )}

              {clase.estadoPago ===
                'pendiente' && (
                <Text
                  style={styles.pendingText}
                >
                  Pendiente · $
                  {Number(
                    clase.pendiente
                  ).toFixed(2)}
                </Text>
              )}

              {clase.estadoPago ===
                'proxima' && (
                <Text
                  style={styles.futureText}
                >
                  Próxima
                </Text>
              )}
            </View>

            <View>
              {clase.estadoPago ===
                'pagada' && (
                <View style={styles.badgePaid}>
                  <Text
                    style={styles.badgePaidText}
                  >
                    PAGADA
                  </Text>
                </View>
              )}

              {clase.estadoPago ===
                'parcial' && (
                <View
                  style={styles.badgePartial}
                >
                  <Text
                    style={
                      styles.badgePartialText
                    }
                  >
                    PARCIAL
                  </Text>
                </View>
              )}

              {clase.estadoPago ===
                'pendiente' && (
                <View
                  style={styles.badgePending}
                >
                  <Text
                    style={
                      styles.badgePendingText
                    }
                  >
                    DEBE
                  </Text>
                </View>
              )}

              {clase.estadoPago ===
                'proxima' && (
                <View
                  style={styles.badgeFuture}
                >
                  <Text
                    style={
                      styles.badgeFutureText
                    }
                  >
                    PRÓXIMA
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
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

  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  avatarText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1565C0',
  },

  studentHeaderInfo: {
    flex: 1,
  },

  studentName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },

  courseName: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },

  currentClass: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1565C0',
    marginTop: 4,
  },

  summary: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
  },

  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },

  summaryNumber: {
    fontSize: 21,
    fontWeight: '900',
    color: '#111827',
  },

  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },

  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },

  secondarySummary: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },

  secondaryText: {
    fontSize: 11,
    color: '#6B7280',
  },

  secondaryDot: {
    marginHorizontal: 8,
    color: '#9CA3AF',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 12,
  },

  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },

  classNumber: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  classNumberText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },

  classInfo: {
    flex: 1,
  },

  classTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  paidText: {
    fontSize: 11,
    color: '#059669',
    marginTop: 4,
  },

  partialText: {
    fontSize: 11,
    color: '#D97706',
    marginTop: 4,
  },

  pendingText: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 4,
  },

  futureText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },

  badgePaid: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  badgePaidText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#059669',
  },

  badgePartial: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  badgePartialText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#D97706',
  },

  badgePending: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  badgePendingText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#DC2626',
  },

  badgeFuture: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  badgeFutureText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#6B7280',
  },
});