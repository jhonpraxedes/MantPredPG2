import React, { useEffect, useState } from "react";
import { Modal, Tabs, Select, Alert } from "antd";
import { getHistory, getPredict } from "@/services/apiBackend";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer,
} from "recharts";

interface HistorialModalProps {
  open: boolean;
  onClose: () => void;
  row: any;
}

interface HistoryPoint {
  ts: string;
  temperatura: number | null;
  vibracion: number | null;
  presion_aceite: number | null;
}

interface ForecastPoint {
  ts: string;
  value: number;
  series: "history" | "forecast";
}

export default function HistorialModal({ open, onClose, row }: HistorialModalProps) {
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [metric, setMetric] = useState<"temperatura" | "vibracion" | "presion_aceite">("temperatura");

  useEffect(() => {
    if (!open || !row) return;
    getHistory(row.maquinaria_id).then((data: any[]) => {
      setHistory(
        data.map((d: any) => ({
          ts: new Date(d.ts).toLocaleTimeString(),
          temperatura: d.temperatura,
          vibracion: d.vibracion,
          presion_aceite: d.presion_aceite,
        }))
      );
    });
  }, [open, row]);

  useEffect(() => {
    if (!open || !row) return;
    getPredict(row.maquinaria_id, metric).then((res: any) => {
      const h: ForecastPoint[] = res.history.map((d: any) => ({ 
        ts: new Date(d.ts).toLocaleTimeString(), 
        value: d.value, 
        series: "history" as const
      }));
      const f: ForecastPoint[] = res.forecast.map((d: any) => ({ 
        ts: new Date(d.ts).toLocaleTimeString(), 
        value: d.value, 
        series: "forecast" as const
      }));
      setForecast([...h, ...f]);
    });
  }, [open, row, metric]);

  if (!row) return null;

  return (
    <Modal open={open} onCancel={onClose} onOk={onClose} width={900} title={`Historial - ${row.nombre ?? ''}`}>
      {row.estado && (
        <Alert
          style={{ marginBottom: 12 }}
          type={row.estado === "CRITICO" ? "error" : row.estado === "ALERTA" ? "warning" : "success"}
          message={`Estado actual: ${row.estado}`}
          description={row.motivo ?? ""}
          showIcon
        />
      )}
      <Tabs
        defaultActiveKey="h"
        items={[
          {
            key: "h",
            label: "Histórico",
            children: (
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ts" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="temperatura" stroke="#d32f2f" dot={false} />
                    <Line type="monotone" dataKey="vibracion" stroke="#1976d2" dot={false} />
                    <Line type="monotone" dataKey="presion_aceite" stroke="#388e3c" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ),
          },
          {
            key: "p",
            label: "Predicción",
            children: (
              <>
                <Select value={metric} onChange={(v) => setMetric(v)} style={{ marginBottom: 8, width: 200 }}>
                  <Select.Option value="temperatura">Temperatura</Select.Option>
                  <Select.Option value="vibracion">Vibración</Select.Option>
                  <Select.Option value="presion_aceite">Presión</Select.Option>
                </Select>
                <div style={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer>
                    <LineChart data={forecast}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ts" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        dataKey="value" 
                        stroke="#1976d2" 
                        data={forecast.filter((d) => d.series === "history")} 
                        name="Histórico" 
                        dot={false}
                      />
                      <Line 
                        dataKey="value" 
                        stroke="#1976d2" 
                        strokeDasharray="5 5" 
                        data={forecast.filter((d) => d.series === "forecast")} 
                        name="Forecast" 
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ),
          },
        ]}
      />
    </Modal>
  );
}