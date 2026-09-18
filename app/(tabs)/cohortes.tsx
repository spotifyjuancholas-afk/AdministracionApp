import { supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';





export default function CohortesScreen() {
  const [cohortes, setCohortes] = useState<any[]>([]);
  useEffect(() => {
  async function cargarCohortes() {
    const { data, error } = await supabase
      .from('cohortes')
      .select(`
        id,
        codigo,
        fecha_inicio,
        estado,
        sede_id,
        sedes (
          nombre
        )
      `)
      .order('fecha_inicio', { ascending: false });

    if (error) {
      console.log('ERROR COHORTES:', error.message);
      return;
    }

    const cohortesFormateadas = data.map((item: any) => ({
      id: item.id,
      sede: item.sedes?.nombre ?? '',
      nombre: item.codigo,
      inicio: item.fecha_inicio ?? 'Sin fecha',
      estado: item.estado,
      cursos: 0,
      estudiantes: 0,
      alertas: 0,
    }));

    setCohortes(cohortesFormateadas);

    console.log('COHORTES DESDE SUPABASE:', cohortesFormateadas);
  }

  cargarCohortes();
}, []);
  const [sedeSeleccionada, setSedeSeleccionada] =
    useState('Barcelona Miranda');
const [sedes, setSedes] = useState<string[]>([]);

useEffect(() => {
  async function cargarSedes() {
    const { data, error } = await supabase
      .from('sedes')
      .select('nombre')
      .eq('activa', true)
      .order('id');

    if (error) {
      console.log('ERROR SEDES:', error.message);
      return;
    }

    const nombres = data.map((item) => item.nombre);

    setSedes(nombres);

    console.log('SEDES DESDE SUPABASE:', nombres);
  }

  cargarSedes();
}, []);
  const cohortesFiltradas = cohortes.filter(
    (cohorte) => cohorte.sede === sedeSeleccionada
  );

  const totalEstudiantes = cohortesFiltradas.reduce(
    (total, cohorte) => total + cohorte.estudiantes,
    0
  );

  const totalAlertas = cohortesFiltradas.reduce(
    (total, cohorte) => total + cohorte.alertas,
    0
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ENCABEZADO */}

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Cohortes</Text>
            <Text style={styles.subtitle}>
              Organización académica por sede
            </Text>
          </View>

          <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/nueva-cohorte')}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* SELECCIÓN DE SEDE */}

        <Text style={styles.sectionLabel}>SEDE</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sedesContainer}
        >
          {sedes.map((sede) => {
            const activa = sede === sedeSeleccionada;

            return (
              <TouchableOpacity
                key={sede}
                style={[
                  styles.sedeButton,
                  activa && styles.sedeButtonActive,
                ]}
                onPress={() => setSedeSeleccionada(sede)}
              >
                <Text
                  style={[
                    styles.sedeText,
                    activa && styles.sedeTextActive,
                  ]}
                >
                  {sede}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* SEDE ACTUAL */}

        <View style={styles.selectedBranch}>
          <View style={styles.branchIcon}>
            <Ionicons
              name="business-outline"
              size={24}
              color="#1565C0"
            />
          </View>

          <View>
            <Text style={styles.branchSmall}>SEDE SELECCIONADA</Text>
            <Text style={styles.branchName}>
              {sedeSeleccionada}
            </Text>
          </View>
        </View>

        {/* RESUMEN */}

        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {cohortesFiltradas.length}
            </Text>
            <Text style={styles.summaryText}>Cohortes</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {totalEstudiantes}
            </Text>
            <Text style={styles.summaryText}>Estudiantes</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {totalAlertas}
            </Text>
            <Text style={styles.summaryText}>Alertas</Text>
          </View>
        </View>

        {/* COHORTES */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Cohortes de {sedeSeleccionada}
          </Text>

          <Text style={styles.count}>
            {cohortesFiltradas.length}
          </Text>
        </View>

        {cohortesFiltradas.map((cohorte) => (
          <TouchableOpacity
          key={cohorte.id}
          style={styles.card}
          activeOpacity={0.8}
          onPress={() =>
  router.push({
    pathname: '/detalle-cohorte',
    params: {
      id: String(cohorte.id),
      sede: cohorte.sede,
      cohorte: cohorte.nombre,
      estado: cohorte.estado,
      inicio: cohorte.inicio,
    },
  })
}
>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cohorteName}>
                  {cohorte.nombre}
                </Text>

                <Text style={styles.startDate}>
                  Inicio: {cohorte.inicio}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={22}
                color="#9CA3AF"
              />
            </View>

            <View style={styles.statusRow}>
              <View
                style={[
                  styles.status,
                  cohorte.estado === 'Activa'
                    ? styles.statusActive
                    : styles.statusUpcoming,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    cohorte.estado === 'Activa'
                      ? styles.statusActiveText
                      : styles.statusUpcomingText,
                  ]}
                >
                  {cohorte.estado}
                </Text>
              </View>
            </View>

            <View style={styles.cardStats}>
              <View style={styles.cardStat}>
                <Ionicons
                  name="book-outline"
                  size={18}
                  color="#6B7280"
                />
                <Text style={styles.cardStatNumber}>
                  {cohorte.cursos}
                </Text>
                <Text style={styles.cardStatLabel}>
                  cursos
                </Text>
              </View>

              <View style={styles.cardStat}>
                <Ionicons
                  name="people-outline"
                  size={18}
                  color="#6B7280"
                />
                <Text style={styles.cardStatNumber}>
                  {cohorte.estudiantes}
                </Text>
                <Text style={styles.cardStatLabel}>
                  estudiantes
                </Text>
              </View>

              <View style={styles.cardStat}>
                <Ionicons
                  name="warning-outline"
                  size={18}
                  color={
                    cohorte.alertas > 0 ? '#DC2626' : '#6B7280'
                  }
                />
                <Text style={styles.cardStatNumber}>
                  {cohorte.alertas}
                </Text>
                <Text style={styles.cardStatLabel}>
                  alertas
                </Text>
              </View>
            </View>

            <View style={styles.openHint}>
              <Text style={styles.openHintText}>
                Ver cursos de esta cohorte
              </Text>

              <Ionicons
                name="arrow-forward"
                size={17}
                color="#1565C0"
              />
            </View>
          </TouchableOpacity>
        ))}

        {cohortesFiltradas.length === 0 && (
          <View style={styles.empty}>
            <Ionicons
              name="calendar-outline"
              size={42}
              color="#9CA3AF"
            />

            <Text style={styles.emptyTitle}>
              No hay cohortes registradas
            </Text>

            <Text style={styles.emptyText}>
              Agrega la primera cohorte de {sedeSeleccionada}.
            </Text>
          </View>
        )}

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
    paddingTop: 60,
    paddingBottom: 30,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 3,
  },

  addButton: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#1565C0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionLabel: {
    marginTop: 26,
    marginBottom: 10,
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 1,
  },

  sedesContainer: {
    marginBottom: 18,
  },

  sedeButton: {
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 9,
  },

  sedeButtonActive: {
    backgroundColor: '#1565C0',
    borderColor: '#1565C0',
  },

  sedeText: {
    color: '#4B5563',
    fontWeight: '600',
  },

  sedeTextActive: {
    color: '#FFFFFF',
  },

  selectedBranch: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  branchIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  branchSmall: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
  },

  branchName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },

  summary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 25,
  },

  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },

  summaryNumber: {
    fontSize: 21,
    fontWeight: '800',
    color: '#111827',
  },

  summaryText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 3,
  },

  divider: {
    width: 1,
    height: 34,
    backgroundColor: '#E5E7EB',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  count: {
    marginLeft: 8,
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  cardTitleContainer: {
    flex: 1,
  },

  cohorteName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
  },

  startDate: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },

  statusRow: {
    marginTop: 13,
    flexDirection: 'row',
  },

  status: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 12,
  },

  statusActive: {
    backgroundColor: '#DCFCE7',
  },

  statusUpcoming: {
    backgroundColor: '#DBEAFE',
  },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  statusActiveText: {
    color: '#15803D',
  },

  statusUpcomingText: {
    color: '#1D4ED8',
  },

  cardStats: {
    flexDirection: 'row',
    marginTop: 19,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  cardStat: {
    flex: 1,
    alignItems: 'center',
  },

  cardStatNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginTop: 5,
  },

  cardStatLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 1,
  },

  openHint: {
    marginTop: 17,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  openHintText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1565C0',
  },

  empty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },

  emptyText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 5,
    textAlign: 'center',
  },
});