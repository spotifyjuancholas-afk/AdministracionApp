import { supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';



const estados = [
  'Planificada',
  'Próxima a iniciar',
  'Activa',
  'Inicio retrasado',
  'Suspendida',
];

export default function NuevaCohorteScreen() {
  const [sede, setSede] = useState('');
  const [nombre, setNombre] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [estado, setEstado] = useState('Planificada');
const [sedes, setSedes] = useState<string[]>([]);

useEffect(() => {
  async function cargarSedes() {
    const { data, error } = await supabase
      .from('sedes')
      .select('nombre')
      .eq('activa', true)
      .order('id');

    if (error) {
      console.log('ERROR CARGANDO SEDES:', error.message);
      return;
    }

    setSedes(data.map((item) => item.nombre));
  }

  cargarSedes();
}, []);
async function crearCohorte() {
  
  try {
    if (!sede || !nombre.trim() || !fechaInicio.trim()) {
      alert('Completa todos los campos obligatorios.');
      return;
    }

    // Buscar el ID real de la sede seleccionada
    const { data: sedeData, error: sedeError } = await supabase
      .from('sedes')
      .select('id')
      .eq('nombre', sede)
      .single();

    if (sedeError || !sedeData) {
      console.log('ERROR BUSCANDO SEDE:', sedeError);
      alert('No se pudo encontrar la sede.');
      return;
    }

    // Convertir DD/MM/AAAA a AAAA-MM-DD
    const partesFecha = fechaInicio.split('/');

    if (partesFecha.length !== 3) {
      alert('La fecha debe tener formato DD/MM/AAAA.');
      return;
    }

    const [dia, mes, anio] = partesFecha;
    const fechaSQL = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;

    // Traducir los estados de la pantalla a los estados de la BD
    const mapaEstados: Record<string, string> = {
      Planificada: 'planificada',
      'Próxima a iniciar': 'planificada',
      Activa: 'activa',
      'Inicio retrasado': 'retrasada',
      Suspendida: 'suspendida',
    };

    const { data, error } = await supabase
      .from('cohortes')
      .insert({
        sede_id: sedeData.id,
        codigo: nombre.trim(),
        fecha_inicio: fechaSQL,
        estado: mapaEstados[estado] ?? 'planificada',
      })
      .select()
      .single();

    if (error) {
      console.log('ERROR CREANDO COHORTE:', error);

      if (error.code === '23505') {
        alert('Ya existe una cohorte con ese nombre en esta sede.');
      } else {
        alert('No se pudo crear la cohorte.');
      }

      return;
    }

    console.log('COHORTE CREADA:', data);

    alert('Cohorte creada correctamente.');

    router.back();
  } catch (error) {
    console.log('ERROR GENERAL:', error);
    alert('Ocurrió un error inesperado.');
  }
}
 useEffect(() => {
  async function cargarSedes() {
    const { data, error } = await supabase
      .from('sedes')
      .select('nombre')
      .eq('activa', true)
      .order('id');

    if (error) {
      console.log('ERROR CARGANDO SEDES:', error.message);
      return;
    }

    setSedes(data.map((item) => item.nombre));
  }

  cargarSedes();
}, []);
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
            <Ionicons name="arrow-back" size={23} color="#111827" />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.title}>Nueva Cohorte</Text>
            <Text style={styles.subtitle}>
              Crea una cohorte para una sede
            </Text>
          </View>
        </View>

        {/* SEDE */}

        <Text style={styles.label}>Sede *</Text>

        <View style={styles.optionsContainer}>
          {sedes.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.option,
                sede === item && styles.optionSelected,
              ]}
              onPress={() => setSede(item)}
            >
              <Ionicons
                name="business-outline"
                size={17}
                color={sede === item ? '#1565C0' : '#6B7280'}
              />

              <Text
                style={[
                  styles.optionText,
                  sede === item && styles.optionTextSelected,
                ]}
              >
                {item}
              </Text>

              {sede === item && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#1565C0"
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* NOMBRE */}

        <Text style={styles.label}>Nombre de la cohorte *</Text>

        <TextInput
          style={styles.input}
          placeholder="Ej: Septiembre 2026"
          placeholderTextColor="#9CA3AF"
          value={nombre}
          onChangeText={setNombre}
        />

        <Text style={styles.helper}>
          Este nombre pertenece únicamente a la sede seleccionada.
        </Text>

        {/* FECHA */}

        <Text style={styles.label}>Fecha prevista de inicio *</Text>

        <View style={styles.inputWithIcon}>
          <Ionicons
            name="calendar-outline"
            size={20}
            color="#6B7280"
          />

          <TextInput
            style={styles.dateInput}
            placeholder="DD/MM/AAAA"
            placeholderTextColor="#9CA3AF"
            value={fechaInicio}
            onChangeText={setFechaInicio}
            keyboardType="numeric"
          />
        </View>

        {/* ESTADO */}

        <Text style={styles.label}>Estado inicial</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {estados.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.statusButton,
                estado === item && styles.statusButtonSelected,
              ]}
              onPress={() => setEstado(item)}
            >
              <Text
                style={[
                  styles.statusText,
                  estado === item && styles.statusTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* CURSOS */}

        <View style={styles.coursesBox}>
          <View style={styles.coursesHeader}>
            <View>
              <Text style={styles.coursesTitle}>Cursos</Text>
              <Text style={styles.coursesSubtitle}>
                Los agregaremos después de crear la cohorte.
              </Text>
            </View>

            <View style={styles.courseIcon}>
              <Ionicons
                name="book-outline"
                size={22}
                color="#1565C0"
              />
            </View>
          </View>

          <Text style={styles.courseExplanation}>
            Cada curso podrá tener su propio horario, profesor,
            estudiantes y 15 clases.
          </Text>
        </View>

        {/* BOTÓN */}

        <TouchableOpacity
          style={[
            styles.createButton,
            (!sede || !nombre || !fechaInicio) &&
              styles.createButtonDisabled,
          ]}
          disabled={!sede || !nombre || !fechaInicio}
          onPress={crearCohorte}
            
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={21}
            color="#FFFFFF"
          />

          <Text style={styles.createButtonText}>
            Crear cohorte
          </Text>
        </TouchableOpacity>

        <Text style={styles.required}>
          * Campos obligatorios
        </Text>
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
    marginTop: 2,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 9,
    marginTop: 20,
  },

  optionsContainer: {
    gap: 8,
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
  },

  optionSelected: {
    borderColor: '#1565C0',
    backgroundColor: '#EFF6FF',
  },

  optionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginLeft: 9,
  },

  optionTextSelected: {
    color: '#1565C0',
  },

  input: {
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  helper: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
  },

  inputWithIcon: {
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  dateInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#111827',
  },

  statusButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },

  statusButtonSelected: {
    backgroundColor: '#1565C0',
    borderColor: '#1565C0',
  },

  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },

  statusTextSelected: {
    color: '#FFFFFF',
  },

  coursesBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    marginTop: 30,
  },

  coursesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  coursesTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },

  coursesSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 3,
  },

  courseIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  courseExplanation: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginTop: 15,
  },

  createButton: {
    height: 55,
    backgroundColor: '#1565C0',
    borderRadius: 15,
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  createButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },

  createButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  required: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 10,
  },
});