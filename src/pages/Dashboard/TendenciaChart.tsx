import React, { useState } from 'react';
import { Select } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';
import DashboardPage from '.';

interface TendenciasChartProps {
  rows: any[];
}

export default function TendenciasChart({ rows }: TendenciasChartProps) {
  const [metric, setMetric] = useState<'temperatura' | 'vibracion' | 'presion_aceite'>('temperatura');

  const data = rows.map((r) => ({
    nombre: r.nombre?.substring(0, 20) || 'Sin nombre',
    valor: r[metric] ?? 0,
  }));

  const metricLabels = {
    temperatura: 'Temperatura (°C)',
    vibracion: 'Vibración (mm/s)',
    presion_aceite: 'Presión Aceite (bar)',
  };

  return (
    <div>
      <Select value={metric} onChange={(v) => setMetric(v)} style={{ marginBottom: 16, width: 200 }}>
        <Select.Option value="temperatura">Temperatura</Select.Option>
        <Select.Option value="vibracion">Vibración</Select.Option>
        <Select.Option value="presion_aceite">Presión Aceite</Select.Option>
      </Select>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="nombre" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="valor" fill="#1890ff" name={metricLabels[metric]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}