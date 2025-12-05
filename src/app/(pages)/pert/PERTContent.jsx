'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Download, Info, Clock, AlertCircle, Network } from 'lucide-react';
import { PERTAlgorithm } from '@/lib/pert';

// Composant SVG pour le graphe PERT
const PERTGraph = ({ pertData }) => {
  const svgRef = useRef();

  // Utiliser l'algorithme pour calculer les positions
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
        className="bg-white"
      >
        {/* Définition des marqueurs pour les flèches */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#374151"
            />
          </marker>
          <marker
            id="arrowhead-critical"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#dc2626"
            />
          </marker>
        </defs>

        {/* Dessiner les arêtes */}
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
              {/* Ligne */}
              <line
                x1={fromPos.x + 30}
                y1={fromPos.y}
                x2={toPos.x - 30}
                y2={toPos.y}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={isDummy ? "5,5" : "none"}
                markerEnd={isCritical ? "url(#arrowhead-critical)" : "url(#arrowhead)"}
              />

              {/* Étiquette de la tâche */}
              {edge.task && (
                <g>
                  <rect
                    x={(fromPos.x + toPos.x) / 2 - 20}
                    y={(fromPos.y + toPos.y) / 2 - 15}
                    width="40"
                    height="20"
                    fill={isCritical ? '#fecaca' : '#dbeafe'}
                    stroke={isCritical ? '#dc2626' : '#3b82f6'}
                    rx="3"
                  />
                  <text
                    x={(fromPos.x + toPos.x) / 2}
                    y={(fromPos.y + toPos.y) / 2 - 3}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill={isCritical ? '#dc2626' : '#1e40af'}
                  >
                    {edge.task.id}
                  </text>
                  <text
                    x={(fromPos.x + toPos.x) / 2}
                    y={(fromPos.y + toPos.y) / 2 + 8}
                    textAnchor="middle"
                    fontSize="8"
                    fill={isCritical ? '#dc2626' : '#1e40af'}
                  >
                    ({edge.duration})
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Dessiner les nœuds */}
        {pertData.nodes.map((node) => {
          const pos = positions.get(node.id);
          if (!pos) return null;

          const isCritical = node.isCritical;
          const strokeColor = isCritical ? '#dc2626' : '#6b7280';
          const fillColor = isCritical ? '#fef2f2' : '#ffffff';
          
          // Calculer les marges
          const totalSlack = node.latestTime - node.earliestTime;
          const freeSlack = node.freeSlack || 0;

          return (
            <g key={node.id}>
              {/* Rectangle du nœud (divisé en 4 sections) */}
              <rect
                x={pos.x - 40}
                y={pos.y - 30}
                width="80"
                height="60"
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={isCritical ? 3 : 2}
                rx="4"
              />

              {/* Lignes de séparation (croix) */}
              <line
                x1={pos.x - 40}
                y1={pos.y}
                x2={pos.x + 40}
                y2={pos.y}
                stroke="#6b7280"
                strokeWidth="1"
              />
              <line
                x1={pos.x}
                y1={pos.y - 30}
                x2={pos.x}
                y2={pos.y + 30}
                stroke="#6b7280"
                strokeWidth="1"
              />

              {/* Date au plus tôt (haut gauche) */}
              <text
                x={pos.x - 20}
                y={pos.y - 10}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill={isCritical ? '#dc2626' : '#059669'}
              >
                {node.earliestTime}
              </text>

              {/* Date au plus tard (haut droit) */}
              <text
                x={pos.x + 20}
                y={pos.y - 10}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill={isCritical ? '#dc2626' : '#ea580c'}
              >
                {node.latestTime}
              </text>

              {/* Marge totale (bas gauche) */}
              <text
                x={pos.x - 20}
                y={pos.y + 18}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill={totalSlack === 0 ? '#dc2626' : '#7c3aed'}
              >
                {totalSlack}
              </text>

              {/* Marge libre (bas droit) */}
              <text
                x={pos.x + 20}
                y={pos.y + 18}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill={freeSlack === 0 ? '#dc2626' : '#2563eb'}
              >
                {freeSlack}
              </text>

              {/* Numéro du nœud en dessous */}
              <text
                x={pos.x}
                y={pos.y + 50}
                textAnchor="middle"
                fontSize="14"
                fontWeight="bold"
                fill="#374151"
              >
                {node.nodeNumber}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default function PERTContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pertData, setPertData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const tasksData = JSON.parse(dataParam);
        setTasks(tasksData);

        const pert = new PERTAlgorithm(tasksData);
        const result = pert.calculate();
        setPertData(result);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du calcul du diagramme PERT:', error);
        setLoading(false);
      }
    }
  }, [searchParams]);

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

  const downloadSVG = () => {
    const svgElement = document.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = window.URL.createObjectURL(svgBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pert_diagram.svg';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Génération du diagramme PERT...</p>
        </div>
      </div>
    );
  }

  if (!pertData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">Impossible de générer le diagramme PERT</p>
          <button
            onClick={() => router.push('/')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // Calculer les métriques correctement à partir des données PERT
  const getCorrectTaskMetrics = () => {
    return tasks.map(task => {
      // Trouver l'arête correspondant à cette tâche
      const taskEdge = pertData.edges.find(edge => edge.task && edge.task.id === task.id);

      if (!taskEdge) {
        return {
          id: task.id,
          name: task.name,
          duration: task.duration,
          earliestStart: 0,
          latestStart: 0,
          earliestFinish: task.duration,
          latestFinish: task.duration,
          totalSlack: 0,
          freeSlack: 0,
          isCritical: false
        };
      }

      // Trouver les nœuds de début et fin
      const startNode = pertData.nodes.find(node => node.id === taskEdge.from);
      const endNode = pertData.nodes.find(node => node.id === taskEdge.to);

      const earliestStart = startNode ? startNode.earliestTime : 0;
      const latestStart = startNode ? startNode.latestTime : 0;
      const earliestFinish = endNode ? endNode.earliestTime : task.duration;
      const latestFinish = endNode ? endNode.latestTime : task.duration;
      const totalSlack = latestStart - earliestStart;

      // Calcul de la marge libre
      let freeSlack = 0;
      if (endNode) {
        // Trouver la date au plus tôt minimale des successeurs
        const successorEdges = pertData.edges.filter(edge => edge.from === endNode.id);
        if (successorEdges.length > 0) {
          const minSuccessorEarliestStart = Math.min(
            ...successorEdges.map(edge => {
              const successorNode = pertData.nodes.find(node => node.id === edge.to);
              return successorNode ? successorNode.earliestTime : Infinity;
            })
          );
          freeSlack = minSuccessorEarliestStart === Infinity ? 0 : minSuccessorEarliestStart - earliestFinish;
        }
      }

      return {
        id: task.id,
        name: task.name,
        duration: task.duration,
        earliestStart,
        latestStart,
        earliestFinish,
        latestFinish,
        totalSlack,
        freeSlack,
        isCritical: taskEdge.isCritical || totalSlack === 0
      };
    });
  };

  const taskMetrics = getCorrectTaskMetrics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
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
              <h1 className="text-3xl font-bold text-gray-800">Diagramme PERT</h1>
              <p className="text-gray-600">Durée totale du projet: {pertData.projectDuration} jours</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadSVG}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              SVG
            </button>
            <button
              onClick={downloadJSON}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              JSON
            </button>
          </div>
        </div>

        {/* Statistiques du projet */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-800">Durée totale</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{pertData.projectDuration} jours</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Network className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-800">Nœuds</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{pertData.nodes.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-gray-800">Tâches critiques</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {pertData.criticalPath.filter(edge => edge.task).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gray-800">Tâches totales</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{tasks.length}</p>
          </div>
        </div>

        {/* Légende */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Légende du diagramme PERT</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Légende du nœud normal */}
            <div>
              <p className="font-semibold text-gray-800 mb-3">Format des nœuds :</p>
              <div className="flex items-center gap-4">
                <svg width="100" height="80" className="flex-shrink-0">
                  <rect x="10" y="10" width="80" height="60" fill="#ffffff" stroke="#6b7280" strokeWidth="2" rx="4" />
                  <line x1="10" y1="40" x2="90" y2="40" stroke="#6b7280" strokeWidth="1" />
                  <line x1="50" y1="10" x2="50" y2="70" stroke="#6b7280" strokeWidth="1" />
                  <text x="30" y="30" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#059669">10</text>
                  <text x="70" y="30" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#ea580c">15</text>
                  <text x="30" y="58" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#7c3aed">5</text>
                  <text x="70" y="58" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#2563eb">2</text>
                </svg>
                <div className="text-sm">
                  <p><span className="text-green-600 font-semibold">Haut gauche:</span> Date au plus tôt</p>
                  <p><span className="text-orange-600 font-semibold">Haut droit:</span> Date au plus tard</p>
                  <p><span className="text-purple-600 font-semibold">Bas gauche:</span> Marge totale</p>
                  <p><span className="text-blue-600 font-semibold">Bas droit:</span> Marge libre</p>
                </div>
              </div>
            </div>

            {/* Légende du nœud critique */}
            <div>
              <p className="font-semibold text-gray-800 mb-3">Nœud critique (marges nulles) :</p>
              <div className="flex items-center gap-4">
                <svg width="100" height="80" className="flex-shrink-0">
                  <rect x="10" y="10" width="80" height="60" fill="#fef2f2" stroke="#dc2626" strokeWidth="3" rx="4" />
                  <line x1="10" y1="40" x2="90" y2="40" stroke="#6b7280" strokeWidth="1" />
                  <line x1="50" y1="10" x2="50" y2="70" stroke="#6b7280" strokeWidth="1" />
                  <text x="30" y="30" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#dc2626">10</text>
                  <text x="70" y="30" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#dc2626">10</text>
                  <text x="30" y="58" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#dc2626">0</text>
                  <text x="70" y="58" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#dc2626">0</text>
                </svg>
                <div className="text-sm">
                  <p className="text-gray-600">Un nœud est <span className="text-red-600 font-semibold">critique</span> lorsque:</p>
                  <p className="text-gray-600">• Date tôt = Date tard</p>
                  <p className="text-gray-600">• Marge totale = 0</p>
                  <p className="text-gray-600">• Bordure rouge épaisse</p>
                </div>
              </div>
            </div>

            {/* Légende des tâches */}
            <div className="md:col-span-2">
              <p className="font-semibold text-gray-800 mb-3">Tâches sur les arêtes :</p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded font-semibold text-sm border border-blue-600">A (5)</div>
                  <div className="text-sm">
                    <p className="font-semibold text-gray-800">Tâche normale</p>
                    <p className="text-gray-600">Avec marge de manœuvre</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 text-red-800 px-3 py-1 rounded font-semibold text-sm border border-red-600">B (3)</div>
                  <div className="text-sm">
                    <p className="font-semibold text-gray-800">Tâche critique</p>
                    <p className="text-gray-600">Chemin critique - Sans marge</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visualisation du réseau PERT */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Réseau PERT</h2>

          {/* Container avec scrollbar */}
          <div className="w-full overflow-auto border border-gray-200 rounded-lg" style={{ maxHeight: '600px' }}>
            <PERTGraph pertData={pertData} />
          </div>

          <div className="mt-6 text-sm text-gray-600">
            <p><strong>Informations sur le diagramme :</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Les nœuds avec bordure <span className="text-red-600 font-semibold">rouge épaisse</span> sont sur le chemin critique</li>
              <li>Format des nœuds : <span className="text-green-600 font-semibold">Date tôt</span> | <span className="text-orange-600 font-semibold">Date tard</span> | <span className="text-purple-600 font-semibold">Marge totale</span> | <span className="text-blue-600 font-semibold">Marge libre</span></li>
              <li>Format des tâches sur les flèches : ID_Tâche (Durée)</li>
              <li>Les lignes pointillées représentent les transitions fictives (sans tâche réelle)</li>
            </ul>
          </div>
        </div>

        {/* Tableau des métriques */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Métriques détaillées des tâches</h2>

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
                {taskMetrics.map((task, index) => (
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
