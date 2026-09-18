import { StyleSheet, Text, View } from 'react-native';

export default function CobranzaScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cobranza</Text>
      <Text style={styles.subtitle}>
        Aquí registraremos pagos, comprobantes, clases y aportes.
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