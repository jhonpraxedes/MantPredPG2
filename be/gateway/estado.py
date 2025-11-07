from typing import Literal, Tuple, List
Estado = Literal["OK", "ALERTA", "CRITICO"]
VIBRATION_THRESHOLDS = {"OK_MAX": 4.5, "ALERTA_MAX": 7.1}
TEMPERATURE_THRESHOLDS = {"OK_MAX": 90, "ALERTA_MAX": 115}
PRESSURE_THRESHOLDS = {
"OK_MIN": 120,
"OK_MAX": 300,
"ALERTA_RANGES": [
[100, 120],
[300, 350],
],
"CRITICO_LOW": 100,
"CRITICO_HIGH": 350,
}
def eval_vibracion(v: float) -> Estado:
if v > VIBRATION_THRESHOLDS["ALERTA_MAX"]:
return "CRITICO"
if v >= VIBRATION_THRESHOLDS["OK_MAX"]:
return "ALERTA"
return "OK"
def eval_temperatura(t: float) -> Estado:
if t > TEMPERATURE_THRESHOLDS["ALERTA_MAX"]:
return "CRITICO"
if t >= TEMPERATURE_THRESHOLDS["OK_MAX"]:
return "ALERTA"
return "OK"
def eval_presion(p: float) -> Estado:
if p < PRESSURE_THRESHOLDS["CRITICO_LOW"] or p >
PRESSURE_THRESHOLDS["CRITICO_HIGH"]:
return "CRITICO"
for mn, mx in PRESSURE_THRESHOLDS["ALERTA_RANGES"]:
if p >= mn and p <= mx:
return "ALERTA"
if p >= PRESSURE_THRESHOLDS["OK_MIN"] and p <=
PRESSURE_THRESHOLDS["OK_MAX"]:
return "OK"
return "ALERTA"
def estado_from_lectura(vibracion: float, temperatura: float, presion: float) -> Tuple[Estado,
List[str]]:
motivos: List[str] = []
ev = eval_vibracion(vibracion)
et = eval_temperatura(temperatura)
ep = eval_presion(presion)
if ev == "CRITICO": motivos.append(f"Vibración CRÍTICO ({vibracion})")
elif
ev == "ALERTA": motivos.append(f"Vibración ALERTA ({vibracion})")
if et == "CRITICO": motivos.append(f"Temperatura CRÍTICO ({temperatura}°C)")
elif et == "ALERTA": motivos.append(f"Temperatura ALERTA ({temperatura}°C)")
if ep == "CRITICO": motivos.append(f"Presión CRÍTICO ({presion} bar)")
elif ep == "ALERTA": motivos.append(f"Presión ALERTA ({presion} bar)")
if "CRÍTICO" in ";".join(motivos):
return "CRITICO", motivos or ["Métrica crítica"]
if "ALERTA" in ";".join(motivos):
return "ALERTA", motivos or ["Métrica en rango de alerta"]
return "OK", ["Todas las métricas en rango OK"]