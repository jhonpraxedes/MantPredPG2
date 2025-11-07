// src/pages/dasboard/TendenciaChart.tsx
import { Card, Empty } from 'antd';
import React from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const TendenciasChart: React.FC<{ rows: any[] }> = ({ rows }) => {
  // Preparar datos para gráfica (últimos 10 registros)
  const chartData = React.useMemo(() => {
    if (!rows || rows.length === 0) return [];

    return rows.slice(0, 10).map((row) => ({
      name: row.nombre || row.numero_serie || row.id,
      temperatura: row.temperatura,
      vibracion: row.vibracion,
      presion_aceite: row.presion_aceite,
      timestamp: row.ts ? new Date(row.ts).toLocaleTimeString() : '—',
    }));
  }, [rows]);

  if (chartData.length === 0) {
    return (
      <Card title="Tendencias de Métricas">
        <Empty description="No hay datos para mostrar" />
      </Card>
    );
  }

  return (
    <Card title="Tendencias de Métricas" style={{ marginBottom: 16 }}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="temperatura"
            stroke="#8884d8"
            name="Temperatura (°C)"
          />
          <Line
            type="monotone"
            dataKey="vibracion"
            stroke="#82ca9d"
            name="Vibración (mm/s)"
          />
          <Line
            type="monotone"
            dataKey="presion_aceite"
            stroke="#ffc658"
            name="Presión Aceite (bar)"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default TendenciasChart;
