import { supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function DetalleCursoScreen() {
  const params = useLocalSearchParams();

  const cohorteCursoId =
    typeof params.cohorteCursoId === 'string'
      ? params.cohorteCursoId
      : '';

  const nombre =
    typeof params.nombre === 'string'
      ? params.nombre
      : 'Curso';

  const dia =
    typeof params.dia === 'string'
      ? params.dia
      : '';

  const horaInicio =
    typeof params.horaInicio === 'string'
      ? params.horaInicio
      : '';

  const horaFin =
    typeof params.horaFin === 'string'
      ? params.horaFin
      : '';

  const totalClases =
    typeof params.totalClases === 'string'
      ? params.totalClases
      : '15';

  const [profesores, setProfesores] = useState<any[]>([]);
  const [profesorActualId, setProfesorActualId] =
    useState<number | null>(null);
const [clases, setClases] = useState<any[]>([]);
  const [profesorActualNombre, setProfesorActualNombre] =
    useState('Profesor por asignar');
const [tarifaPorAporte, setTarifaPorAporte] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
const [totalEstudiantes, setTotalEstudiantes] = useState(0);
  useEffect(() => {
    cargarDatos();
  }, [cohorteCursoId]);
useFocusEffect(
  useCallback(() => {
    cargarDatos();
  }, [cohorteCursoId])
);
  async function cargarDatos() {
    const { data: clasesData, error: clasesError } = await supabase
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
  .eq('cohorte_curso_id', Number(cohorteCursoId))
  .order('numero_clase');

if (clasesError) {
  console.log('ERROR CARGANDO CLASES:', clasesError.message);
} else {
  setClases(clasesData ?? []);
}
    if (!cohorteCursoId) return;

    const { data: cursoData, error: cursoError } =
      await supabase
        .from('cohorte_cursos')
        .select(`
  id,
  curso_id,
  profesor_id,
  profesores (
    nombre_completo
  )
`)
        .eq('id', Number(cohorteCursoId))
        .single();

    if (cursoError) {
      console.log(
        'ERROR CARGANDO CURSO:',
        cursoError.message
      );
    } else {
      setProfesorActualId(cursoData.profesor_id ?? null);

      const profesorRelacionado: any = cursoData.profesores;

setProfesorActualNombre(
  profesorRelacionado?.nombre_completo ??
    'Profesor por asignar'
);
if (cursoData.profesor_id && cursoData.curso_id) {
  const { data: tarifaData, error: tarifaError } = await supabase
    .from('profesor_cursos')
    .select('tarifa_por_aporte')
    .eq('profesor_id', cursoData.profesor_id)
    .eq('curso_id', cursoData.curso_id)
    .eq('activo', true)
    .order('fecha_desde', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (tarifaError) {
    console.log('ERROR CARGANDO TARIFA:', tarifaError.message);
    setTarifaPorAporte(null);
  } else {
    setTarifaPorAporte(
      tarifaData?.tarifa_por_aporte != null
        ? Number(tarifaData.tarifa_por_aporte)
        : null
    );
    const { count, error: estudiantesError } = await supabase
  .from('inscripciones')
  .select('id', { count: 'exact', head: true })
  .eq('cohorte_curso_id', Number(cohorteCursoId));

if (estudiantesError) {
  console.log(
    'ERROR CONTANDO ESTUDIANTES:',
    estudiantesError.message
  );
} else {
  setTotalEstudiantes(count ?? 0);
}
  }
} else {
  setTarifaPorAporte(null);
}
    }

    const { data: profesoresData, error: profesoresError } =
      await supabase
        .from('profesores')
        .select('id, nombre_completo, activo')
        .eq('activo', true)
        .order('nombre_completo');

    if (profesoresError) {
      console.log(
        'ERROR CARGANDO PROFESORES:',
        profesoresError.message
      );
      return;
    }

    setProfesores(profesoresData ?? []);
  }

  async function asignarProfesor(
    profesorId: number,
    nombreProfesor: string
  ) {
    if (!cohorteCursoId) {
      alert('No se encontró el curso.');
      return;
    }

    setGuardando(true);

    const { error } = await supabase
      .from('cohorte_cursos')
      .update({
        profesor_id: profesorId,
      })
      .eq('id', Number(cohorteCursoId));

    setGuardando(false);

    if (error) {
      console.log(
        'ERROR ASIGNANDO PROFESOR:',
        error
      );

      alert('No se pudo asignar el profesor.');
      return;
    }

    setProfesorActualId(profesorId);
    setProfesorActualNombre(nombreProfesor);

    alert('Profesor asignado correctamente.');
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
            <Text style={styles.title}>{nombre}</Text>

            <Text style={styles.subtitle}>
              {dia} · {horaInicio.slice(0, 5)} -{' '}
              {horaFin.slice(0, 5)}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.smallLabel}>
            PROFESOR ACTUAL
          </Text>

          <View style={styles.teacherRow}>
            <View style={styles.teacherIcon}>
              <Ionicons
                name="person-outline"
                size={22}
                color="#1565C0"
              />
            </View>

            <View style={styles.teacherInfo}>
              <Text style={styles.teacherName}>
  {profesorActualNombre}
</Text>

<Text style={styles.teacherHelper}>
  {tarifaPorAporte !== null
    ? `Tarifa por aporte: ${tarifaPorAporte}`
    : 'Tarifa por aporte no configurada'}
</Text>
            </View>
          </View>
        </View>



{/* ================= CLASES ================= */}

<Text style={styles.sectionTitle}>
  Clases
</Text>

<Text style={styles.sectionSubtitle}>
  Control de las 15 clases del curso
</Text>

{clases.map((clase) => (
  <TouchableOpacity
    key={clase.id}
    style={styles.claseCard}
    onPress={() =>
  router.push({
    pathname: '/detalle-clase',
    params: {
  claseId: String(clase.id),
  numeroClase: String(clase.numero_clase),
  curso: nombre,
  cohorteCursoId: String(cohorteCursoId),
},
  })
}
  >
    <View style={styles.claseNumero}>
      <Text style={styles.claseNumeroText}>
        {clase.numero_clase}
      </Text>
    </View>

    <View style={styles.claseContent}>
      <Text style={styles.claseTitle}>
        Clase {clase.numero_clase}
      </Text>

      <Text style={styles.claseInfo}>
        {clase.fecha_programada
          ? `Fecha: ${clase.fecha_programada}`
          : 'Fecha pendiente'}
      </Text>
    </View>

    <View style={styles.claseEstado}>
      <Text style={styles.claseEstadoText}>
        {clase.estado}
      </Text>
    </View>

    <Ionicons
      name="chevron-forward"
      size={20}
      color="#9CA3AF"
    />
  </TouchableOpacity>
))}


        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {totalClases}
            </Text>
            <Text style={styles.summaryLabel}>
              Clases
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {totalEstudiantes}
            </Text>

            <Text style={styles.summaryLabel}>
              Estudiantes
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              0
            </Text>

            <Text style={styles.summaryLabel}>
              Aportes
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Asignar profesor
        </Text>

        <Text style={styles.sectionSubtitle}>
          Selecciona un profesor activo
        </Text>

        {profesores.map((profesor) => {
          const seleccionado =
            profesorActualId === profesor.id;

          return (
            <TouchableOpacity
              key={profesor.id}
              style={[
                styles.profesorCard,
                seleccionado &&
                  styles.profesorCardSelected,
              ]}
              disabled={guardando}
              onPress={() =>
                asignarProfesor(
                  profesor.id,
                  profesor.nombre_completo
                )
              }
            >
              <View style={styles.profesorAvatar}>
                <Ionicons
                  name="person"
                  size={19}
                  color={
                    seleccionado
                      ? '#FFFFFF'
                      : '#1565C0'
                  }
                />
              </View>

              <View style={styles.profesorContent}>
                <Text style={styles.profesorName}>
                  {profesor.nombre_completo}
                </Text>

                <Text style={styles.profesorText}>
                  {seleccionado
                    ? 'Profesor asignado'
                    : 'Tocar para asignar'}
                </Text>
              </View>

              {seleccionado && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color="#1565C0"
                />
              )}
            </TouchableOpacity>
          );
        })}

        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={22}
            color="#1565C0"
          />

          <Text style={styles.infoText}>
            La tarifa por aporte depende de la combinación
            profesor + curso. La conectaremos en el siguiente
            paso.
          </Text>
        </View>
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
    marginBottom: 25,
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
    fontSize: 25,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    marginBottom: 14,
  },

  smallLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  teacherIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  teacherInfo: {
    flex: 1,
  },

  teacherName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  teacherHelper: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 3,
  },

  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },

  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },

  summaryNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },

  summaryLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 3,
  },

  divider: {
    width: 1,
    height: 33,
    backgroundColor: '#E5E7EB',
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
  },

  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
    marginBottom: 14,
  },

  profesorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },

  profesorCardSelected: {
    borderColor: '#1565C0',
    backgroundColor: '#EFF6FF',
  },

  profesorAvatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  profesorContent: {
    flex: 1,
  },

  profesorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  profesorText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 3,
  },

  infoBox: {
    marginTop: 18,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
  },

  infoText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 11,
    lineHeight: 17,
    color: '#4B5563',
  },
  claseCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 14,
  marginBottom: 10,
  flexDirection: 'row',
  alignItems: 'center',
},
claseNumero: {
  width: 42,
  height: 42,
  borderRadius: 13,
  backgroundColor: '#EFF6FF',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 12,
},

claseNumeroText: {
  fontSize: 16,
  fontWeight: '800',
  color: '#1565C0',
},

claseContent: {
  flex: 1,
},

claseTitle: {
  fontSize: 14,
  fontWeight: '800',
  color: '#111827',
},

claseInfo: {
  fontSize: 11,
  color: '#6B7280',
  marginTop: 3,
},

claseEstado: {
  backgroundColor: '#F3F4F6',
  paddingHorizontal: 9,
  paddingVertical: 5,
  borderRadius: 10,
  marginRight: 8,
},

claseEstadoText: {
  fontSize: 10,
  fontWeight: '700',
  color: '#4B5563',
},

});