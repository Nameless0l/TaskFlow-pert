'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Download, Info, Clock, AlertCircle } from 'lucide-react';
import { GanttAlgorithm } from '@/lib/gantt';

export default function GanttPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ganttData, setGanttData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const tasksData = JSON.parse(dataParam);
        setTasks(tasksData);

        const gantt = new GanttAlgorithm(tasksData);
        const result = gantt.calculate();
        setGanttData(result);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du calcul du diagramme de Gantt:', error);
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

  const getTimelineScale = () => {
    if (!ganttData) return [];
    const maxDuration = ganttData.projectDuration;
    return Array.from({ length: maxDuration + 1 }, (_, i) => i);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Génération du diagramme de Gantt...</p>
        </div>
      </div>
    );
  }

  if (!ganttData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">Impossible de générer le diagramme de Gantt</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <button
              onClick={() => router.push('/')}
              className="bg-white p-2 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Diagramme de Gantt</h1>
              <p className="text-gray-600">Durée totale du projet: {ganttData.projectDuration} jours</p>
            </div>
          </div>
          <button
            onClick={downloadCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
        </div>

        {/* Statistiques du projet */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-800">Durée totale</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{ganttData.projectDuration} jours</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-800">Nombre de tâches</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{ganttData.schedule.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-gray-800">Tâches critiques</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{ganttData.criticalTasks.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gray-800">Chemin critique</span>
            </div>
            <p className="text-sm font-bold text-purple-600">
              {ganttData.criticalTasks.map(t => t.id).join(' → ')}
            </p>
          </div>
        </div>

        {/* Diagramme de Gantt */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Diagramme de Gantt</h2>

          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* En-tête de timeline */}
              <div className="flex mb-4">
                <div className="w-48 flex-shrink-0"></div>
                <div className="flex">
                  {timelineScale.map(day => (
                    <div key={day} className="w-8 text-center text-sm font-medium text-gray-600 border-l border-gray-200">
                      {day}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tâches */}
              <div className="space-y-2">
                {ganttData.schedule.map((task, index) => (
                  <div key={task.id} className="flex items-center">
                    {/* Informations de la tâche */}
                    <div className="w-48 flex-shrink-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          task.isCritical
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {task.id}
                        </span>
                        <span className="text-sm font-medium text-gray-800 truncate">
                          {task.name}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {task.duration}j • Début: {task.start}
                      </div>
                    </div>

                    {/* Barre de Gantt */}
                    <div className="flex relative">
                      {timelineScale.map(day => (
                        <div key={day} className="w-8 h-8 border-l border-gray-200 relative">
                          {day >= task.start && day < task.end && (
                            <div
                              className={`h-6 rounded-sm mx-0.5 mt-1 ${
                                task.isCritical
                                  ? 'bg-red-500 shadow-md'
                                  : 'shadow-sm'
                              }`}
                              style={{
                                backgroundColor: task.isCritical ? '#EF4444' : task.color,
                                opacity: task.isCritical ? 1 : 0.8
                              }}
                              title={`${task.name} (${task.duration}j)`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Légende du chemin critique */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-gray-600">Chemin critique</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-gray-600">Tâches normales</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau des métriques */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Métriques des tâches</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Tâche</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Nom</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-800">Durée</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-800">Début au plus tôt</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-800">Début au plus tard</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-800">Fin au plus tôt</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-800">Fin au plus tard</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-800">Marge totale</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-800">Marge libre</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-800">Critique</th>
                </tr>
              </thead>
              <tbody>
                {ganttData.taskMetrics.map((task, index) => (
                  <tr key={task.id} className={`border-t ${task.isCritical ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        task.isCritical
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {task.id}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{task.name}</td>
                    <td className="px-4 py-3 text-center">{task.duration}</td>
                    <td className="px-4 py-3 text-center">{task.earliestStart}</td>
                    <td className="px-4 py-3 text-center">{task.latestStart}</td>
                    <td className="px-4 py-3 text-center">{task.earliestFinish}</td>
                    <td className="px-4 py-3 text-center">{task.latestFinish}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={task.totalSlack === 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                        {task.totalSlack}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={task.freeSlack === 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                        {task.freeSlack}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {task.isCritical ? (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">
                          Oui
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                          Non
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}