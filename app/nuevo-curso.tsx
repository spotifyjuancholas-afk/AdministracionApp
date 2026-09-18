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

export default function NuevoCursoScreen() {
  const params = useLocalSearchParams();

  const cohorteId =
    typeof params.cohorteId === 'string' ? params.cohorteId : '';

  const sede =
    typeof params.sede === 'string' ? params.sede : '';

  const cohorte =
    typeof params.cohorte === 'string' ? params.cohorte : '';

  const [cursos, setCursos] = useState<any[]>([]);
  const [cursoId, setCursoId] = useState<number | null>(null);
  const [nuevoCurso, setNuevoCurso] = useState('');

  const [diaSemana, setDiaSemana] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');

  const [guardando, setGuardando] = useState(false);

  const dias = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo',
  ];

  useEffect(() => {
    cargarCursos();
  }, []);

  async function cargarCursos() {
    const { data, error } = await supabase
      .from('cursos')
      .select('id, nombre')
      .eq('activo', true)
      .order('nombre');

    if (error) {
      console.log('ERROR CARGANDO CURSOS:', error.message);
      return;
    }

    setCursos(data ?? []);
  }

  async function crearCursoCatalogo() {
    if (!nuevoCurso.trim()) {
      alert('Escribe el nombre del curso.');
      return;
    }

    const { data, error } = await supabase
      .from('cursos')
      .insert({
        nombre: nuevoCurso.trim(),
      })
      .select()
      .single();

    if (error) {
      console.log('ERROR CREANDO CURSO:', error);

      if (error.code === '23505') {
        alert('Ese curso ya existe.');
      } else {
        alert('No se pudo crear el curso.');
      }

      return;
    }

    setCursos((actuales) =>
      [...actuales, data].sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
      )
    );

    setCursoId(data.id);
    setNuevoCurso('');

    alert('Curso agregado al catálogo.');
  }

  async function guardarCursoEnCohorte() {
    if (!cohorteId) {
      alert('No se encontró la cohorte.');
      return;
    }

    if (!cursoId) {
      alert('Selecciona un curso.');
      return;
    }

    if (!diaSemana) {
      alert('Selecciona el día.');
      return;
    }

    if (!horaInicio.trim() || !horaFin.trim()) {
      alert('Completa el horario.');
      return;
    }

    setGuardando(true);

    const { data, error } = await supabase
      .from('cohorte_cursos')
      .insert({
        cohorte_id: Number(cohorteId),
        curso_id: cursoId,
        dia_semana: diaSemana.toLowerCase(),
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        estado: 'planificado',
        total_clases: 15,
      })
      .select()
      .single();

    setGuardando(false);

    if (error) {
      console.log('ERROR GUARDANDO CURSO:', error);

      if (error.code === '23505') {
        alert('Ese curso con ese horario ya existe en esta cohorte.');
      } else {
        alert('No se pudo agregar el curso a la cohorte.');
      }

      return;
    }

    console.log('CURSO AGREGADO A COHORTE:', data);

    alert('Curso agregado correctamente.');

    router.back();
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
            <Text style={styles.title}>Nuevo Curso</Text>
            <Text style={styles.subtitle}>
              {sede} · {cohorte}
            </Text>
          </View>
        </View>

        <Text style={styles.label}>Curso *</Text>

        {cursos.map((curso) => {
          const seleccionado = cursoId === curso.id;

          return (
            <TouchableOpacity
              key={curso.id}
              style={[
                styles.option,
                seleccionado && styles.optionSelected,
              ]}
              onPress={() => setCursoId(curso.id)}
            >
              <Ionicons
                name="book-outline"
                size={18}
                color={seleccionado ? '#1565C0' : '#6B7280'}
              />

              <Text
                style={[
                  styles.optionText,
                  seleccionado && styles.optionTextSelected,
                ]}
              >
                {curso.nombre}
              </Text>

              {seleccionado && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#1565C0"
                />
              )}
            </TouchableOpacity>
          );
        })}

        <View style={styles.newCourseBox}>
          <Text style={styles.newCourseTitle}>
            ¿El curso no existe?
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ej: Asistente de Farmacia"
            placeholderTextColor="#9CA3AF"
            value={nuevoCurso}
            onChangeText={setNuevoCurso}
          />

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={crearCursoCatalogo}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color="#1565C0"
            />

            <Text style={styles.secondaryButtonText}>
              Agregar al catálogo
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Día de clases *</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {dias.map((dia) => {
            const seleccionado = diaSemana === dia;

            return (
              <TouchableOpacity
                key={dia}
                style={[
                  styles.dayButton,
                  seleccionado && styles.dayButtonSelected,
                ]}
                onPress={() => setDiaSemana(dia)}
              >
                <Text
                  style={[
                    styles.dayText,
                    seleccionado && styles.dayTextSelected,
                  ]}
                >
                  {dia}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.label}>Hora de inicio *</Text>

        <TextInput
          style={styles.input}
          placeholder="Ej: 08:00"
          placeholderTextColor="#9CA3AF"
          value={horaInicio}
          onChangeText={setHoraInicio}
        />

        <Text style={styles.label}>Hora de finalización *</Text>

        <TextInput
          style={styles.input}
          placeholder="Ej: 12:00"
          placeholderTextColor="#9CA3AF"
          value={horaFin}
          onChangeText={setHoraFin}
        />

        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={22}
            color="#1565C0"
          />

          <Text style={styles.infoText}>
            Este curso tendrá 15 clases. El profesor se podrá
            asignar después y podrá cambiarse conservando el historial.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            guardando && styles.saveButtonDisabled,
          ]}
          disabled={guardando}
          onPress={guardarCursoEnCohorte}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={21}
            color="#FFFFFF"
          />

          <Text style={styles.saveButtonText}>
            {guardando ? 'Guardando...' : 'Agregar curso'}
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
    paddingBottom: 45,
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
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 20,
    marginBottom: 9,
  },

  option: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  optionSelected: {
    borderColor: '#1565C0',
    backgroundColor: '#EFF6FF',
  },

  optionText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },

  optionTextSelected: {
    color: '#1565C0',
  },

  newCourseBox: {
    marginTop: 12,
    padding: 16,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
  },

  newCourseTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 11,
  },

  input: {
    height: 53,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  secondaryButton: {
    marginTop: 10,
    height: 46,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  secondaryButtonText: {
    color: '#1565C0',
    fontSize: 13,
    fontWeight: '800',
  },

  dayButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },

  dayButtonSelected: {
    backgroundColor: '#1565C0',
    borderColor: '#1565C0',
  },

  dayText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '600',
  },

  dayTextSelected: {
    color: '#FFFFFF',
  },

  infoBox: {
    marginTop: 25,
    padding: 15,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    flexDirection: 'row',
  },

  infoText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 11,
    lineHeight: 17,
    color: '#4B5563',
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
});