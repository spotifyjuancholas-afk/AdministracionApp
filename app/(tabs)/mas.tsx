import { StyleSheet, Text, View } from 'react-native';

export default function MasScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Más</Text>

      <Text style={styles.item}>Gastos</Text>
      <Text style={styles.item}>Cuentas bancarias</Text>
      <Text style={styles.item}>Profesores</Text>
      <Text style={styles.item}>Personal y Nómina</Text>
      <Text style={styles.item}>Reportes</Text>
      <Text style={styles.item}>Carnets</Text>
      <Text style={styles.item}>Certificados</Text>
      <Text style={styles.item}>Configuración</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 20,
    paddingTop: 70,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 25,
  },
  item: {
    backgroundColor: '#FFFFFF',
    padding: 17,
    borderRadius: 14,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});