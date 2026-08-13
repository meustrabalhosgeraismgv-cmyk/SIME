import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarX,
} from 'lucide-react';
import { calendarService } from '../../services/api';

const NIVEIS = [
  { value: '', label: 'Todos' },
  { value: 'pre_escolar', label: 'Pré-Escolar' },
  { value: 'ensino_primario', label: 'Primário' },
  { value: 'ensino_medio', label: 'Médio' },
];

const TIPO_STYLE = {
  inicio: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  fim: 'bg-red-100 text-red-700 border-red-200',
  ferias: 'bg-orange-100 text-orange-700 border-orange-200',
  exame: 'bg-purple-100 text-purple-700 border-purple-200',
  evento: 'bg-blue-100 text-blue-700 border-blue-200',
};

const TIPO_DOT = {
  inicio: 'bg-emerald-500',
  fim: 'bg-red-500',
  ferias: 'bg-orange-500',
  exame: 'bg-purple-500',
  evento: 'bg-blue-500',
};

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DAY_NAMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function isDateInRange(date, start, end) {
  return date >= start && date <= end;
}

function getAnoLectivo() {
  const now = new Date();
  const year = now.getFullYear();
  if (now.getMonth() >= 8) {
    return `${year}/${year + 1}`;
  }
  return `${year - 1}/${year}`;
}

export default function CalendarioPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [nivelFiltro, setNivelFiltro] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await calendarService.getAll();
      setEvents(response.data || []);
    } catch (err) {
      console.error('Erro ao carregar calendário:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push({ day: null, key: `empty-${i}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({ day: d, key: `day-${d}` });
  }

  const filteredEvents = nivelFiltro
    ? events.filter(e => !e.nivel || e.nivel === nivelFiltro)
    : events;

  const sortedEvents = [...filteredEvents].sort(
    (a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime()
  );

  const upcomingEvents = sortedEvents.filter((ev) => new Date(ev.data_fim || ev.data_inicio) >= now);
  const pastEvents = sortedEvents.filter((ev) => new Date(ev.data_fim || ev.data_inicio) < now);

  function getEventForDay(date) {
    return filteredEvents.find((ev) => {
      const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const s = new Date(ev.data_inicio);
      s.setHours(0, 0, 0, 0);
      if (ev.data_fim) {
        const e = new Date(ev.data_fim);
        e.setHours(23, 59, 59, 999);
        return isDateInRange(d, s, e);
      }
      return d.getTime() === s.getTime();
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden rounded-b-xl px-4 sm:px-8 py-20 flex flex-col items-center justify-center text-center min-h-[380px]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0061a4] via-[#0074bd] to-[#00497d]" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-4">
          <span className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm">
            Sector Educativo de Angola
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Calendário Escolar{' '}
            <span className="block bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent">
              {getAnoLectivo()}
            </span>
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Consulte as datas importantes, períodos letivos, férias e exames do ano lectivo em curso.
          </p>
        </div>
      </section>

      {/* ===== FILTROS ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {NIVEIS.map(n => (
            <button key={n.value} onClick={() => setNivelFiltro(n.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm ${
                nivelFiltro === n.value
                  ? 'bg-[#0061a4] text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}>
              {n.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== CALENDAR + EVENTS ===== */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-4" />
              <p className="text-gray-500">A carregar calendário...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm ring-1 ring-gray-100">
              <CalendarX className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Sem eventos registados
              </h3>
              <p className="text-sm text-gray-500 text-center max-w-md">
                {nivelFiltro
                  ? `Nenhum evento encontrado para o nível ${NIVEIS.find(n => n.value === nivelFiltro)?.label || nivelFiltro}.`
                  : 'O calendário escolar ainda não foi configurado. Os eventos serão disponibilizados assim que forem definidos pelo administrador.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-5">
              {/* Calendar Grid */}
              <div className="lg:col-span-3">
                <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
                  <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <button onClick={prevMonth}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition hover:bg-gray-200">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-xl font-bold text-gray-900">
                      {MONTH_NAMES[month]} {year}
                    </h2>
                    <button onClick={nextMonth}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition hover:bg-gray-200">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="p-4">
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {DAY_NAMES.map((name) => (
                        <div key={name} className="text-center text-xs font-semibold text-gray-400 py-2">
                          {name}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map(({ day, key }) => {
                        if (day === null) {
                          return <div key={key} className="h-12 sm:h-14" />;
                        }

                        const cellDate = new Date(year, month, day);
                        const event = getEventForDay(cellDate);
                        const isToday = isCurrentMonth && now.getDate() === day;

                        return (
                          <div key={key}
                            className={`relative flex flex-col items-center justify-start rounded-xl p-1 transition ${
                              event
                                ? 'bg-indigo-50 ring-1 ring-indigo-200'
                                : isToday
                                ? 'bg-yellow-50 ring-1 ring-yellow-200'
                                : 'hover:bg-gray-50'
                            }`}>
                            <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                              isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'
                            }`}>
                              {day}
                            </span>
                            {event && (
                              <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${TIPO_DOT[event.tipo] || 'bg-gray-400'}`}
                                title={event.titulo} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Events List */}
              <div className="lg:col-span-2 space-y-6">
                {/* Legend */}
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Legenda</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(TIPO_STYLE).map(([tipo]) => (
                      <div key={tipo} className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${TIPO_DOT[tipo]}`} />
                        <span className="text-xs text-gray-600 capitalize">{tipo}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Events */}
                {upcomingEvents.length > 0 && (
                  <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="h-4 w-4 text-indigo-500" />
                      <h3 className="text-sm font-semibold text-gray-900">Próximos Eventos</h3>
                    </div>
                    <div className="space-y-3">
                      {upcomingEvents.map((ev, idx) => (
                        <div key={idx} className={`flex items-start gap-3 rounded-xl border p-3 ${TIPO_STYLE[ev.tipo] || TIPO_STYLE.evento}`}>
                          <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${TIPO_DOT[ev.tipo] || 'bg-gray-400'}`} />
                          <div>
                            <p className="text-sm font-semibold">{ev.titulo}</p>
                            <p className="text-xs opacity-80">{ev.data_inicio}{ev.data_fim ? ` a ${ev.data_fim}` : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Events */}
                {pastEvents.length > 0 && (
                  <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 opacity-80">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <h3 className="text-sm font-semibold text-gray-900">Eventos Passados</h3>
                    </div>
                    <div className="space-y-3">
                      {pastEvents.map((ev, idx) => (
                        <div key={idx} className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-gray-400" />
                          <div>
                            <p className="text-sm font-semibold text-gray-500 line-through">{ev.titulo}</p>
                            <p className="text-xs text-gray-400">{ev.data_inicio}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
