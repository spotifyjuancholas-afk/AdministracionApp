import { supabase } from '@/utils/supabase';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  useEffect(() => {
  async function probarSupabase() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.log('SUPABASE ERROR:', error.message);
    } else {
      console.log('SUPABASE CONECTADO:', data);
    }
  }

  probarSupabase();
}, []);
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ENCABEZADO */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Panel administrativo</Text>
          <Text style={styles.title}>Dashboard</Text>
        </View>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>A</Text>
        </View>
      </View>

      {/* SUCURSAL ACTIVA */}
      <TouchableOpacity style={styles.branchSelector}>
        <View>
          <Text style={styles.smallLabel}>SUCURSAL ACTIVA</Text>
          <Text style={styles.branchName}>Sucursal Principal</Text>
        </View>
        <Text style={styles.arrow}>⌄</Text>
      </TouchableOpacity>

      {/* RESUMEN */}
      <Text style={styles.sectionTitle}>Resumen</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryIcon}>💰</Text>
          <Text style={styles.summaryLabel}>Saldo disponible</Text>
          <Text style={styles.summaryAmount}>$0.00</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryIcon}>📉</Text>
          <Text style={styles.summaryLabel}>Gastos del mes</Text>
          <Text style={styles.summaryAmount}>$0.00</Text>
        </View>
      </View>

      <View style={styles.attendanceCard}>
        <View>
          <Text style={styles.summaryLabel}>Asistencia de hoy</Text>
          <Text style={styles.attendanceNumber}>0 / 0</Text>
          <Text style={styles.attendanceText}>empleados presentes</Text>
        </View>

        <Text style={styles.bigIcon}>👥</Text>
      </View>

      {/* MÓDULOS */}
      <Text style={styles.sectionTitle}>Administración</Text>

      <View style={styles.grid}>
        <MenuCard icon="🏢" title="Sucursales" />
        <MenuCard icon="💸" title="Gastos" />
        <MenuCard icon="🏦" title="Cuentas" />
        <MenuCard icon="👤" title="Empleados" />
        <MenuCard icon="🕐" title="Asistencia" />
        <MenuCard icon="📊" title="Reportes" />
      </View>

      {/* ACTIVIDAD */}
      <Text style={styles.sectionTitle}>Actividad reciente</Text>

      <View style={styles.activityCard}>
        <View style={styles.activityIcon}>
          <Text>📋</Text>
        </View>

        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>Sin movimientos todavía</Text>
          <Text style={styles.activityDescription}>
            Tus últimas operaciones aparecerán aquí.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function MenuCard({ icon, title }: { icon: string; title: string }) {
  return (
    <TouchableOpacity style={styles.menuCard}>
      <View style={styles.menuIcon}>
        <Text style={styles.menuEmoji}>{icon}</Text>
      </View>

      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  welcome: {
    fontSize: 14,
    color: '#6B7280',
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  branchSelector: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },

  smallLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },

  branchName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 5,
  },

  arrow: {
    color: '#FFFFFF',
    fontSize: 25,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
    marginTop: 4,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    minHeight: 135,
  },

  summaryIcon: {
    fontSize: 23,
    marginBottom: 12,
  },

  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },

  summaryAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginTop: 5,
  },

  attendanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  attendanceNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginTop: 5,
  },

  attendanceText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },

  bigIcon: {
    fontSize: 34,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  menuCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    minHeight: 130,
    justifyContent: 'space-between',
  },

  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuEmoji: {
    fontSize: 21,
  },

  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },

  menuArrow: {
    position: 'absolute',
    right: 15,
    bottom: 12,
    fontSize: 23,
    color: '#9CA3AF',
  },

  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  activityContent: {
    flex: 1,
  },

  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  activityDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 3,
  },
});