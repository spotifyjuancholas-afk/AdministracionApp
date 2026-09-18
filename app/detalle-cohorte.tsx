import { supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';



export default function DetalleCohorteScreen() {
const params = useLocalSearchParams();

const cohorteId =
  typeof params.id === 'string'
    ? params.id
    : '';

const [cursos, setCursos] = useState<any[]>([]);

useEffect(() => {
  if (!cohorteId) return;

  async function cargarCursos() {
    
      const { data, error } = await supabase
  .from('cohorte_cursos')
  .select(`
    id,
    dia_semana,
    hora_inicio,
    hora_fin,
    estado,
    total_clases,
    profesor_id,
    cursos (
      nombre
    ),
    profesores (
      nombre_completo
    )
  `)
  .eq('cohorte_id', Number(cohorteId))
  .order('id');
      

    if (error) {
      console.log('ERROR CARGANDO CURSOS:', error.message);
      return;
    }

    setCursos(data ?? []);
    console.log('CURSOS DE LA COHORTE:', data);
  }

  cargarCursos();
}, [cohorteId]);
  typeof params.id === 'string'
    ? params.id
    : '';
  const sede =
    typeof params.sede === 'string'
      ? params.sede
      : 'Sede';

  const cohorte =
    typeof params.cohorte === 'string'
      ? params.cohorte
      : 'Cohorte';

  const estado =
    typeof params.estado === 'string'
      ? params.estado
      : 'Planificada';

  const inicio =
    typeof params.inicio === 'string'
      ? params.inicio
      : 'Sin fecha';

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* CABECERA */}

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
            <Text style={styles.smallTitle}>
              {sede}
            </Text>

            <Text style={styles.title}>
              {cohorte}
            </Text>
          </View>

          <TouchableOpacity style={styles.editButton}>
            <Ionicons
              name="create-outline"
              size={21}
              color="#1565C0"
            />
          </TouchableOpacity>
        </View>

        {/* INFORMACIÓN */}

        <View style={styles.infoCard}>
          <View style={styles.infoTop}>
            <View>
              <Text style={styles.label}>
                FECHA PREVISTA DE INICIO
              </Text>

              <Text style={styles.infoValue}>
                {inicio}
              </Text>
            </View>

            <View style={styles.status}>
              <Text style={styles.statusText}>
                {estado}
              </Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.infoRow}>
            <View style={styles.infoStat}>
  <Text style={styles.infoNumber}>
    {cursos.length}
  </Text>
  <Text style={styles.infoStatLabel}>
    Cursos
  </Text>
</View>

            <View style={styles.verticalDivider} />

            <View style={styles.infoStat}>
              <Text style={styles.infoNumber}>
                0
              </Text>
              <Text style={styles.infoStatLabel}>
                Estudiantes
              </Text>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.infoStat}>
              <Text style={styles.infoNumber}>
                0
              </Text>
              <Text style={styles.infoStatLabel}>
                Alertas
              </Text>
            </View>
          </View>
        </View>

        {/* CURSOS */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Cursos
            </Text>

            <Text style={styles.sectionSubtitle}>
              Cursos pertenecientes a esta cohorte
            </Text>
          </View>

          <TouchableOpacity
  style={styles.addCourse}
  onPress={() =>
    router.push({
      pathname: '/nuevo-curso',
      params: {
        cohorteId: cohorteId,
        sede: sede,
        cohorte: cohorte,
      },
    })
  }
>
            <Ionicons
              name="add"
              size={23}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {cursos.map((curso: any) => (
  <TouchableOpacity
    key={curso.id}
    style={styles.courseCard}
    activeOpacity={0.8}
    onPress={() =>
      router.push({
        pathname: '/detalle-curso',
        params: {
          cohorteCursoId: String(curso.id),
          nombre: curso.cursos?.nombre ?? 'Curso',
          dia: curso.dia_semana ?? '',
          horaInicio: curso.hora_inicio ?? '',
          horaFin: curso.hora_fin ?? '',
          totalClases: String(curso.total_clases ?? 15),
        },
      })
    }
  >
            <View style={styles.courseHeader}>
              <View style={styles.courseIcon}>
                <Ionicons
                  name="book-outline"
                  size={22}
                  color="#1565C0"
                />
              </View>

              <View style={styles.courseTitleContainer}>
                <Text style={styles.courseTitle}>
  {curso.cursos?.nombre ?? 'Curso'}
</Text>

                <Text style={styles.courseSchedule}>
  {curso.dia_semana} · {curso.hora_inicio?.slice(0, 5)} - {curso.hora_fin?.slice(0, 5)}
</Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={21}
                color="#9CA3AF"
              />
            </View>

            <View style={styles.teacherRow}>
              <Ionicons
                name="person-outline"
                size={17}
                color="#6B7280"
              />

              <Text style={styles.teacherText}>
  {curso.profesores?.nombre_completo ?? 'Profesor por asignar'}
</Text>
            </View>

            <View style={styles.courseBottom}>
              <View style={styles.courseStat}>
                <Ionicons
                  name="people-outline"
                  size={17}
                  color="#6B7280"
                />

                <Text style={styles.courseStatText}>
  0 estudiantes
</Text>
              </View>

              <View style={styles.progress}>
                <Text style={styles.progressText}>
                  Clase {curso.claseActual}/15
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* ALERTAS */}

        <View style={styles.alertBox}>
          <Ionicons
            name="information-circle-outline"
            size={23}
            color="#1565C0"
          />

          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>
              Control académico
            </Text>

            <Text style={styles.alertText}>
              Desde aquí posteriormente podrás reportar
              retrasos, suspensiones y clases no realizadas.
            </Text>
          </View>
        </View>

        <View style={{ height: 30 }} />
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
    paddingBottom: 30,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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

  smallTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginTop: 1,
  },

  editButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
  },

  infoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  label: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '800',
    letterSpacing: 0.8,
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
  infoValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
  },

  status: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 12,
  },

  statusText: {
    color: '#1D4ED8',
    fontSize: 10,
    fontWeight: '800',
  },

  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 18,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoStat: {
    flex: 1,
    alignItems: 'center',
  },

  infoNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },

  infoStatLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },

  verticalDivider: {
    width: 1,
    height: 33,
    backgroundColor: '#E5E7EB',
  },

  sectionHeader: {
    marginTop: 28,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },

  sectionSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 3,
  },

  addCourse: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#1565C0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },

  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  courseIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  courseTitleContainer: {
    flex: 1,
  },

  courseTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  courseSchedule: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 3,
  },

  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },

  teacherText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 7,
  },

  courseBottom: {
    marginTop: 15,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  courseStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  courseStatText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 6,
  },

  progress: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  progressText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B5563',
  },

  alertBox: {
    marginTop: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 17,
    padding: 16,
    flexDirection: 'row',
  },

  alertContent: {
    flex: 1,
    marginLeft: 10,
  },

  alertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1D4ED8',
  },

  alertText: {
    fontSize: 11,
    color: '#4B5563',
    lineHeight: 17,
    marginTop: 3,
  },
});