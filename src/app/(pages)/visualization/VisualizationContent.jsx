// src/app/(pages)/visualization/VisualizationContent.jsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Download, Info, Clock, AlertCircle, Network, Calendar, BarChart3, FileText } from 'lucide-react';
import { GanttAlgorithm } from '@/lib/gantt';
import { PERTAlgorithm } from '@/lib/pert';

// Composant pour les onglets
const TabButton = ({ active, onClick, icon: Icon, label, count }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${
      active
        ? 'bg-white text-blue-600 shadow-lg scale-105'
        : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
    {count !== undefined && (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
        active ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600'
      }`}>
        {count}
      </span>
    )}
  </button>
);

// Composant SVG pour le graphe PERT
const PERTGraph = ({ pertData }) => {
  const svgRef = useRef();

  const pert = new PERTAlgorithm([]);
  pert.nodes = new Map(pertData.nodes.map(node => [node.id, node]));
  pert.edges = pertData.edges;

  const positions = pert.calculateNodePositions();
  const dimensions = pert.getSVGDimensions(positions);

  return (
    <div className="w-full min-w-max">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="bg-white rounded-xl"
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#374151" />
          </marker>
          <marker id="arrowhead-critical" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#dc2626" />
          </marker>
        </defs>

        {pertData.edges.map((edge, index) => {
          const fromPos = positions.get(edge.from);
          const toPos = positions.get(edge.to);
          if (!fromPos || !toPos) return null;

          const isCritical = edge.isCritical;
          const strokeColor = isCritical ? '#dc2626' : '#374151';
          const strokeWidth = isCritical ? 3 : 2;
          const isDummy = edge.isDummy;

          return (
            <g key={index}>
              <line
                x1={fromPos.x + 30} y1={fromPos.y}
                x2={toPos.x - 30} y2={toPos.y}
                stroke={strokeColor} strokeWidth={strokeWidth}
                strokeDasharray={isDummy ? "5,5" : "none"}
                markerEnd={isCritical ? "url(#arrowhead-critical)" : "url(#arrowhead)"}
              />
              {edge.task && (
                <g>
                  <rect
                    x={(fromPos.x + toPos.x) / 2 - 20} y={(fromPos.y + toPos.y) / 2 - 15}
                    width="40" height="20"
                    fill={isCritical ? '#fecaca' : '#dbeafe'}
                    stroke={isCritical ? '#dc2626' : '#3b82f6'} rx="3"
                  />
                  <text x={(fromPos.x + toPos.x) / 2} y={(fromPos.y + toPos.y) / 2 - 3}
                        textAnchor="middle" fontSize="10" fontWeight="bold"
                        fill={isCritical ? '#dc2626' : '#1e40af'}>
                    {edge.task.id}
                  </text>
                  <text x={(fromPos.x + toPos.x) / 2} y={(fromPos.y + toPos.y) / 2 + 8}
                        textAnchor="middle" fontSize="8"
                        fill={isCritical ? '#dc2626' : '#1e40af'}>
                    ({edge.duration})
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {pertData.nodes.map((node) => {
          const pos = positions.get(node.id);
          if (!pos) return null;

          const isCritical = node.isCritical;
          const strokeColor = isCritical ? '#dc2626' : '#6b7280';
          const fillColor = isCritical ? '#fef2f2' : '#ffffff';

          return (
            <g key={node.id}>
              <circle cx={pos.x} cy={pos.y} r="30" fill={fillColor} stroke={strokeColor} strokeWidth={isCritical ? 3 : 2} />
              <line x1={pos.x - 20} y1={pos.y} x2={pos.x + 20} y2={pos.y} stroke="#6b7280" strokeWidth="1" />
              <text x={pos.x} y={pos.y - 8} textAnchor="middle" fontSize="12" fontWeight="bold"
                    fill={isCritical ? '#dc2626' : '#059669'}>
                {node.earliestTime}
              </text>
              <text x={pos.x} y={pos.y + 15} textAnchor="middle" fontSize="12" fontWeight="bold"
                    fill={isCritical ? '#dc2626' : '#ea580c'}>
                {node.latestTime}
              </text>
              <text x={pos.x} y={pos.y + 50} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#374151">
                {node.nodeNumber}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default function VisualizationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('gantt');
  const [ganttData, setGanttData] = useState(null);
  const [pertData, setPertData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const tasksData = JSON.parse(dataParam);
        setTasks(tasksData);

        // Calculer les données Gantt
        const gantt = new GanttAlgorithm(tasksData);
        const ganttResult = gantt.calculate();
        setGanttData(ganttResult);

        // Calculer les données PERT
        const pert = new PERTAlgorithm(tasksData);
        const pertResult = pert.calculate();
        setPertData(pertResult);

        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du calcul des diagrammes:', error);
        setLoading(false);
      }
    }
  }, [searchParams]);

  const downloadCSV = () => {
    if (!ganttData) return;
    const gantt = new GanttAlgorithm(tasks);
    const csv = gantt.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gantt_diagram.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    if (!pertData) return;
    const pert = new PERTAlgorithm(tasks);
    const exportData = pert.exportData();
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pert_diagram.json';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTimelineScale = () => {
    if (!ganttData) return [];
    const maxDuration = ganttData.projectDuration;
    return Array.from({ length: maxDuration + 1 }, (_, i) => i);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Génération des diagrammes</h2>
          <p className="text-slate-600">Calcul des plannings et chemins critiques...</p>
        </div>
      </div>
    );
  }

  if (!ganttData || !pertData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">Impossible de générer les diagrammes</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const timelineScale = getTimelineScale();
  const criticalTasksCount = ganttData.criticalTasks.length;
  const totalDuration = ganttData.projectDuration;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="bg-white p-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 group"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:text-slate-800" />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Analyse du projet</h1>
                <p className="text-slate-600">Durée totale: {totalDuration} jours • {tasks.length} tâches • {criticalTasksCount} critiques</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={downloadCSV}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-md"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={downloadJSON}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md"
              >
                <Download className="w-4 h-4" />
                JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Statistiques du projet */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-slate-800">Durée totale</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">{totalDuration}</p>
            <p className="text-sm text-slate-600">jours</p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-slate-800">Tâches totales</span>
            </div>
            <p className="text-3xl font-bold text-emerald-600">{tasks.length}</p>
            <p className="text-sm text-slate-600">tâches</p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-slate-800">Tâches critiques</span>
            </div>
            <p className="text-3xl font-bold text-red-600">{criticalTasksCount}</p>
            <p className="text-sm text-slate-600">sans marge</p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                <Network className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-slate-800">Efficacité</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">{Math.round((criticalTasksCount / tasks.length) * 100)}</p>
            <p className="text-sm text-slate-600">% critique</p>
          </div>
        </div>

        {/* Onglets */}
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-2 rounded-2xl mb-8">
          <div className="flex gap-2 overflow-x-auto">
            <TabButton
              active={activeTab === 'gantt'}
              onClick={() => setActiveTab('gantt')}
              icon={Calendar}
              label="Diagramme de Gantt"
            />
            <TabButton
              active={activeTab === 'pert'}
              onClick={() => setActiveTab('pert')}
              icon={Network}
              label="Diagramme PERT"
              count={pertData.nodes.length}
            />
            <TabButton
              active={activeTab === 'metrics'}
              onClick={() => setActiveTab('metrics')}
              icon={FileText}
              label="Métriques détaillées"
            />
          </div>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'gantt' && (
          <div className="space-y-8">
            {/* Diagramme de Gantt */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-semibold text-slate-800">Planification temporelle</h2>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-max">
                  <div className="flex mb-4">
                    <div className="w-64 flex-shrink-0"></div>
                    <div className="flex">
                      {timelineScale.map(day => (
                        <div key={day} className="w-8 text-center text-sm font-medium text-slate-600 border-l border-slate-200">
                          {day}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {ganttData.schedule.map((task, index) => (
                      <div key={task.id} className="flex items-center">
                        <div className="w-64 flex-shrink-0 pr-4">
                          <div className="flex items-center gap-3 mb-1">
                            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                              task.isCritical
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {task.id}
                            </span>
                            <span className="text-sm font-medium text-slate-800 truncate">
                              {task.name}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            {task.duration}j • Début: J{task.start}
                          </div>
                        </div>

                        <div className="flex relative">
                          {timelineScale.map(day => (
                            <div key={day} className="w-8 h-10 border-l border-slate-200 relative">
                              {day >= task.start && day < task.end && (
                                <div
                                  className={`h-6 rounded-md mx-0.5 mt-2 shadow-sm ${
                                    task.isCritical
                                      ? 'bg-red-500'
                                      : 'bg-blue-500'
                                  }`}
                                  title={`${task.name} (${task.duration}j)`}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span className="text-slate-600">Chemin critique</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span className="text-slate-600">Tâches normales</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pert' && (
          <div className="space-y-8">
            {/* Légende PERT */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
              <h3 className="text-xl font-semibold text-slate-800 mb-6">Légende du diagramme PERT</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-slate-400 bg-white flex flex-col items-center justify-center text-xs">
                    <div className="text-emerald-600 font-bold">10</div>
                    <div className="border-t border-slate-300 w-6 my-0.5"></div>
                    <div className="text-orange-600 font-bold">15</div>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-slate-800">Nœud normal</p>
                    <p className="text-slate-600">Tôt / Tard</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-red-500 bg-red-50 flex flex-col items-center justify-center text-xs">
                    <div className="text-red-600 font-bold">10</div>
                    <div className="border-t border-slate-300 w-6 my-0.5"></div>
                    <div className="text-red-600 font-bold">10</div>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-slate-800">Nœud critique</p>
                    <p className="text-slate-600">Marge nulle</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded font-semibold text-sm">A (5)</div>
                  <div className="text-sm">
                    <p className="font-semibold text-slate-800">Tâche normale</p>
                    <p className="text-slate-600">ID (durée)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 text-red-800 px-3 py-1 rounded font-semibold text-sm">B (3)</div>
                  <div className="text-sm">
                    <p className="font-semibold text-slate-800">Tâche critique</p>
                    <p className="text-slate-600">Sans marge</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagramme PERT */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <Network className="w-6 h-6 text-emerald-600" />
                <h2 className="text-2xl font-semibold text-slate-800">Réseau PERT</h2>
              </div>

              <div className="w-full overflow-auto border border-slate-200 rounded-xl bg-slate-50" style={{ maxHeight: '600px' }}>
                <PERTGraph pertData={pertData} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-slate-800">Métriques détaillées</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-4 text-left font-semibold text-slate-800">Tâche</th>
                    <th className="px-4 py-4 text-left font-semibold text-slate-800">Nom</th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-800">Durée</th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-800">Début tôt</th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-800">Début tard</th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-800">Fin tôt</th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-800">Fin tard</th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-800">Marge totale</th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-800">Marge libre</th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-800">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {ganttData.taskMetrics.map((task, index) => (
                    <tr key={task.id} className={`border-t border-slate-200 ${task.isCritical ? 'bg-red-50' : 'hover:bg-slate-50'} transition-colors`}>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                          task.isCritical
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {task.id}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-800">{task.name}</td>
                      <td className="px-4 py-4 text-center font-semibold">{task.duration}</td>
                      <td className="px-4 py-4 text-center">{task.earliestStart}</td>
                      <td className="px-4 py-4 text-center">{task.latestStart}</td>
                      <td className="px-4 py-4 text-center">{task.earliestFinish}</td>
                      <td className="px-4 py-4 text-center">{task.latestFinish}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`font-semibold ${task.totalSlack === 0 ? 'text-red-600' : 'text-slate-600'}`}>
                          {task.totalSlack}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`font-semibold ${task.freeSlack === 0 ? 'text-red-600' : 'text-slate-600'}`}>
                          {task.freeSlack}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {task.isCritical ? (
                          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold">
                            Critique
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}