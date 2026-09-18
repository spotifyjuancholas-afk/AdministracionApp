import { StyleSheet, Text, View } from 'react-native';

export default function EstudiantesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estudiantes</Text>
      <Text style={styles.subtitle}>
        Registro, cohortes, pagos, asistencia, carnet y certificados.
      </Text>
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
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    color: '#6B7280',
  },
});