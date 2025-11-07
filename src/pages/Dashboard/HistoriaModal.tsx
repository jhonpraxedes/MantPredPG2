// src/pages/dasboard/HistoriaModal.tsx
import { getHistory } from '@/services/apiBackend';
import { Alert, Modal, Spin, Table } from 'antd';
import React, { useEffect, useState } from 'react';

const HistorialModal: React.FC<{
  open: boolean;
  onClose: () => void;
  row: any;
}> = ({ open, onClose, row }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !row?.maquinaria_id) return;

    const loadHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const history = await getHistory(row.maquinaria_id, 50);
        setData(history);
      } catch (err: any) {
        console.error('Error cargando historial:', err);
        setError('Error al cargar el historial');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [open, row?.maquinaria_id]);

  const columns = [
    {
      title: 'Fecha',
      dataIndex: 'ts',
      render: (ts: string) => (ts ? new Date(ts).toLocaleString() : '—'),
    },
    {
      title: 'Temperatura (°C)',
      dataIndex: 'temperatura',
      render: (val: number) => val ?? '—',
    },
    {
      title: 'Vibración (mm/s)',
      dataIndex: 'vibracion',
      render: (val: number) => val ?? '—',
    },
    {
      title: 'Presión Aceite (bar)',
      dataIndex: 'presion_aceite',
      render: (val: number) => val ?? '—',
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      render: (val: string) => val ?? '—',
    },
  ];

  return (
    <Modal
      title={`Historial - ${row?.nombre || row?.numero_serie || 'Máquina'}`}
      open={open}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Spin spinning={loading}>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ y: 400 }}
        />
      </Spin>
    </Modal>
  );
};

export default HistorialModal;
