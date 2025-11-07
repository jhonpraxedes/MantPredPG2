import React, { useEffect, useMemo, useState } from 'react';
import { PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { Tag, Space, Button, message, Card, Row, Col, Alert, Statistic } from 'antd';
import { WarningOutlined, CheckCircleOutlined, ExclamationCircleOutlined, DashboardOutlined } from '@ant-design/icons';
import HistorialModal from './HistoriaModal';
import TendenciasChart from './TendenciaChart';
import { 
  getMaquinaria, 
  getLatest, 
  Maquina as MaquinaDTO, 
  Lectura as LecturaDTO 
} from '@/services/apiBackend';

type Estado = 'OK' | 'ALERTA' | 'CRITICO';

type RowItem = MaquinaDTO & LecturaDTO & { id: string; estadoCalculado: Estado };

// 🔧 Función para evaluar estado basado en métricas
function evaluarEstado(temperatura?: number | null, vibracion?: number | null, presion_aceite?: number | null): Estado {
  const temp = temperatura ?? 0;
  const vib = vibracion ?? 0;
  const pres = presion_aceite ?? 0;
  
  // Evaluar críticos
  if (vib > 4.5 || temp > 120 || temp < 60 || pres < 150) {
    return 'CRITICO';
  }
  
  // Evaluar alertas
  if (vib > 2.5 || temp > 100 || temp < 80 || pres < 200 || pres > 350) {
    return 'ALERTA';
  }
  
  return 'OK';
}

const tagEstado = (e?: Estado | null) => {
  switch (e) {
    case 'CRITICO':
      return <Tag color="red">CRÍTICO</Tag>;
    case 'ALERTA':
      return <Tag color="orange">ALERTA</Tag>;
    case 'OK':
      return <Tag color="green">OK</Tag>;
    default:
      return <Tag color="gray">—</Tag>;
  }
};

const DashboardPage: React.FC = () => {
  const [maquinas, setMaquinas] = useState<MaquinaDTO[]>([]);
  const [lecturas, setLecturas] = useState<LecturaDTO[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados para el modal
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const rows: RowItem[] = useMemo(() => {
    const byId = new Map<string, LecturaDTO>();
    lecturas.forEach((l) => {
      if (l.maquinaria_id) byId.set(l.maquinaria_id, l);
    });

    return maquinas.map((m) => {
      const l = byId.get(m.id);
      
      // 🔧 Calcular estado si no existe
      const estadoCalculado = l?.estado 
        ? (l.estado.toUpperCase() as Estado)
        : evaluarEstado(l?.temperatura, l?.vibracion, l?.presion_aceite);
      
      return {
        ...m,
        ...l,
        id: m.id,
        estadoCalculado,
      } as RowItem;
    });
  }, [maquinas, lecturas]);

  // 🔧 Calcular KPIs basados en estados calculados
  const kpis = useMemo(() => {
    let ok = 0, alerta = 0, critico = 0;
    
    rows.forEach((r) => {
      const estado = r.estadoCalculado;
      
      if (estado === 'OK') {
        ok++;
      } else if (estado === 'ALERTA') {
        alerta++;
      } else if (estado === 'CRITICO') {
        critico++;
      }
    });
    
    return { 
      total: rows.length, 
      ok, 
      alerta, 
      critico 
    };
  }, [rows]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const [m, l] = await Promise.all([
          getMaquinaria(),
          getLatest(),
        ]);
        if (!mounted) return;
        setMaquinas(m);
        setLecturas(l);
      } catch (err: any) {
        console.error('Error cargando dashboard:', err);
        if (mounted) message.error('Error al cargar datos del dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    const interval = setInterval(() => {
      if (mounted) load();
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const columns: ProColumns<RowItem>[] = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      width: 240,
      fixed: 'left',
      render: (_dom: React.ReactNode, record: RowItem) => <b>{record.nombre}</b>,
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      width: 160,
      render: (_dom: React.ReactNode, record: RowItem) => {
        const color =
          record.tipo === 'Excavadora'
            ? 'blue'
            : record.tipo === 'Bulldozer'
            ? 'red'
            : record.tipo === 'Cargador frontal'
            ? 'orange'
            : 'green';
        return <Tag color={color}>{record.tipo}</Tag>;
      },
    },
    {
      title: 'N° Serie',
      dataIndex: 'numero_serie',
      width: 180,
      render: (_dom: React.ReactNode, record: RowItem) => record.numero_serie ?? '—',
    },
    {
      title: 'Motor',
      dataIndex: 'motor',
      width: 180,
      render: (_dom: React.ReactNode, record: RowItem) => record.motor ?? '—',
    },
    {
      title: 'Temp (°C)',
      dataIndex: 'temperatura',
      width: 120,
      render: (_dom: React.ReactNode, record: RowItem) => (record.temperatura !== null && record.temperatura !== undefined ? record.temperatura : '—'),
    },
    {
      title: 'Vibración (mm/s)',
      dataIndex: 'vibracion',
      width: 150,
      render: (_dom: React.ReactNode, record: RowItem) => (record.vibracion !== null && record.vibracion !== undefined ? record.vibracion : '—'),
    },
    {
      title: 'Aceite (bar)',
      dataIndex: 'presion_aceite',
      width: 130,
      render: (_dom: React.ReactNode, record: RowItem) => (record.presion_aceite !== null && record.presion_aceite !== undefined ? record.presion_aceite : '—'),
    },
    {
      title: 'Estado',
      dataIndex: 'estadoCalculado',
      width: 130,
      render: (_dom: React.ReactNode, record: RowItem) => tagEstado(record.estadoCalculado),
      filters: true,
      onFilter: (value: any, record: RowItem) => record.estadoCalculado === (value as Estado),
      valueEnum: {
        OK: { text: 'OK' },
        ALERTA: { text: 'ALERTA' },
        CRITICO: { text: 'CRÍTICO' },
      },
    },
    {
      title: 'Detalle',
      dataIndex: 'motivo',
      width: 320,
      render: (_dom: React.ReactNode, record: RowItem) => {
        const val = record.motivo ?? '';
        const short = val ? val.split(';')[0] : '—';
        return <span title={val}>{short}</span>;
      },
    },
    {
      title: 'Última lectura',
      dataIndex: 'ts',
      width: 180,
      render: (_dom: React.ReactNode, record: RowItem) => (record.ts ? new Date(record.ts).toLocaleString() : '—'),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_dom: React.ReactNode, record: RowItem) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setSelected({
                maquinaria_id: record.id,
                nombre: record.nombre,
                numero_serie: record.numero_serie,
                temperatura: record.temperatura,
                vibracion: record.vibracion,
                presion_aceite: record.presion_aceite,
                ts: record.ts,
                estado: record.estadoCalculado,
                motivo: record.motivo,
              });
              setOpen(true);
            }}
          >
            Historial
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: 'Dashboard de Maquinaria',
        subTitle: 'Estado en tiempo real (backend)',
      }}
    >
      {/* Banner de alerta si hay máquinas críticas */}
      {kpis.critico > 0 && (
        <Alert
          message={`⚠️ ${kpis.critico} máquina${kpis.critico > 1 ? 's' : ''} en estado CRÍTICO`}
          description="Requiere atención inmediata"
          type="error"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Tarjetas KPI */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Máquinas"
              value={kpis.total}
              prefix={<DashboardOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="OK"
              value={kpis.ok}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="ALERTA"
              value={kpis.alerta}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="CRÍTICO"
              value={kpis.critico}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Gráfica de tendencias */}
      <Card title="Tendencias de Métricas" style={{ marginBottom: 16 }}>
        <TendenciasChart rows={rows} />
      </Card>

      {/* Tabla de maquinaria */}
      <ProTable<RowItem>
        columns={columns}
        dataSource={rows}
        rowKey="id"
        loading={loading}
        search={false}
        pagination={{ pageSize: 8 }}
        scroll={{ x: 1400 }}
        toolBarRender={() => [
          <Space key="legend">
            <Tag color="green">OK</Tag>
            <Tag color="orange">ALERTA</Tag>
            <Tag color="red">CRÍTICO</Tag>
            <Button
              key="refresh"
              onClick={async () => {
                setLoading(true);
                try {
                  const [m, l] = await Promise.all([
                    getMaquinaria(),
                    getLatest(),
                  ]);
                  setMaquinas(m);
                  setLecturas(l);
                  message.success('Datos actualizados');
                } catch (err) {
                  message.error('Error al refrescar');
                } finally {
                  setLoading(false);
                }
              }}
            >
              Refrescar
            </Button>
          </Space>,
        ]}
        rowClassName={(record: RowItem) => {
          switch (record.estadoCalculado) {
            case 'CRITICO':
              return 'row-critical';
            case 'ALERTA':
              return 'row-alert';
            case 'OK':
            default:
              return '';
          }
        }}
      />
      <HistorialModal open={open} onClose={() => setOpen(false)} row={selected} />
    </PageContainer>
  );
};

export default DashboardPage;