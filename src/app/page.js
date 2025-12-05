'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Play, Database, Calendar, Network, Sparkles, BarChart3 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    id: '',
    name: '',
    duration: '',
    dependencies: []
  });
  const [dependencyInput, setDependencyInput] = useState('');

  const sampleData = [
    { id: 'A', name: 'Choix de la cible', duration: 4, dependencies: [] },
    { id: 'B', name: 'Mise en place des axes d\'argumentation', duration: 2, dependencies: ['A'] },
    { id: 'C', name: 'Conception du mailing', duration: 8, dependencies: ['B'] },
    { id: 'D', name: 'Impression du mailing', duration: 4, dependencies: ['C'] },
    { id: 'E', name: 'Conception de l\'argumentaire de relance', duration: 6, dependencies: ['B'] },
    { id: 'F', name: 'Location des fichiers', duration: 10, dependencies: ['A'] },
    { id: 'G', name: 'Envoi des mails', duration: 7, dependencies: ['D', 'F'] },
    { id: 'H', name: 'Recrutement des téléacteurs', duration: 13, dependencies: ['A'] },
    { id: 'I', name: 'Formation des téléacteurs', duration: 2, dependencies: ['H'] }
  ];

  const addTask = () => {
    if (newTask.id && newTask.name && newTask.duration) {
      if (tasks.find(task => task.id === newTask.id)) {
        alert('Une tâche avec cet ID existe déjà.');
        return;
      }

      setTasks([...tasks, {
        ...newTask,
        duration: parseInt(newTask.duration),
        dependencies: newTask.dependencies
      }]);

      setNewTask({ id: '', name: '', duration: '', dependencies: [] });
      setDependencyInput('');
    }
  };

  const removeTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const loadSampleData = () => {
    setTasks(sampleData);
  };

  const clearData = () => {
    setTasks([]);
    setNewTask({ id: '', name: '', duration: '', dependencies: [] });
    setDependencyInput('');
  };

  const generateDiagrams = () => {
    if (tasks.length === 0) {
      alert('Veuillez ajouter au moins une tâche pour générer les diagrammes.');
      return;
    }

    const invalidDependencies = [];
    tasks.forEach(task => {
      task.dependencies.forEach(dep => {
        if (!tasks.find(t => t.id === dep)) {
          invalidDependencies.push(`Tâche ${task.id}: dépendance "${dep}" introuvable`);
        }
      });
    });

    if (invalidDependencies.length > 0) {
      alert('Erreurs dans les dépendances:\n' + invalidDependencies.join('\n'));
      return;
    }

    const queryParams = new URLSearchParams({
      data: JSON.stringify(tasks)
    });

    router.push(`/visualization?${queryParams.toString()}`);
  };

  const handleDependencyChange = (value) => {
    setDependencyInput(value);
    const deps = value
      .split(/[,;\s]+/)
      .map(dep => dep.trim().toUpperCase())
      .filter(dep => dep !== '' && dep.length > 0);

    setNewTask(prev => ({ ...prev, dependencies: deps }));
  };

  const getAvailableDependencies = () => {
    return tasks.map(task => task.id).filter(id => id !== newTask.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              <Sparkles className="w-8 h-8 text-blue-600" />
              <h1 className="text-5xl md:text-7xl font-bold">
                Project Planner
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Créez et visualisez vos projets avec des diagrammes de Gantt et PERT professionnels
            </p>

            <div className="flex flex-wrap justify-center gap-6 mb-12">
              <div className="group flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-slate-800">Diagramme de Gantt</h3>
                  <p className="text-sm text-slate-600">Planification temporelle</p>
                </div>
              </div>

              <div className="group flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
                  <Network className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-slate-800">Diagramme PERT</h3>
                  <p className="text-sm text-slate-600">Analyse des chemins critiques</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Task Input Section */}
            <div className="lg:col-span-1">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20 sticky top-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Nouvelle tâche</h2>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">ID de la tâche</label>
                      <input
                        type="text"
                        value={newTask.id}
                        onChange={(e) => setNewTask(prev => ({ ...prev, id: e.target.value.toUpperCase() }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50/50"
                        placeholder="A, B, C..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Durée (jours)</label>
                      <input
                        type="number"
                        value={newTask.duration}
                        onChange={(e) => setNewTask(prev => ({ ...prev, duration: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50/50"
                        placeholder="10"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Nom de la tâche</label>
                    <input
                      type="text"
                      value={newTask.name}
                      onChange={(e) => setNewTask(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50/50"
                      placeholder="Description de la tâche"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Dépendances</label>
                    <input
                      type="text"
                      value={dependencyInput}
                      onChange={(e) => handleDependencyChange(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50/50"
                      placeholder="A, B, C ou A B C ou A;B;C"
                    />
                    <div className="text-sm text-slate-600">
                      {getAvailableDependencies().length > 0 ? (
                        <p><span className="font-semibold">Disponibles :</span> {getAvailableDependencies().join(', ')}</p>
                      ) : (
                        <p>Ajoutez d&apos;abord des tâches</p>
                      )}
                    </div>
                    {newTask.dependencies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {newTask.dependencies.map((dep, index) => (
                          <span
                            key={index}
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              getAvailableDependencies().includes(dep)
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {dep} {!getAvailableDependencies().includes(dep) && '⚠️'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={addTask}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    <Plus className="w-5 h-5" />
                    Ajouter la tâche
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={loadSampleData}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 px-4 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg"
                    >
                      <Database className="w-4 h-4" />
                      Exemple
                    </button>
                    <button
                      onClick={clearData}
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                      Effacer
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks List and Generation */}
            <div className="lg:col-span-2 space-y-8">

              {/* Tasks List */}
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Tâches du projet</h2>
                  </div>
                  <div className="bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-full">
                    <span className="text-lg font-bold text-slate-700">{tasks.length}</span>
                  </div>
                </div>

                {tasks.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
                      <Calendar className="w-12 h-12 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">Aucune tâche</h3>
                    <p className="text-slate-500 mb-6">Ajoutez des tâches ou chargez un exemple</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {tasks.map((task, index) => (
                      <div key={index} className="group bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-2xl border border-slate-200 hover:shadow-lg transition-all duration-300">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                              <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-lg text-sm font-bold">
                                {task.id}
                              </span>
                              <h3 className="font-semibold text-slate-800 text-lg">{task.name}</h3>
                            </div>
                            <div className="flex items-center gap-6 text-sm text-slate-600">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span><span className="font-semibold">Durée:</span> {task.duration} jours</span>
                              </div>
                              {task.dependencies.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                  <span><span className="font-semibold">Dépend de:</span> {task.dependencies.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all duration-300"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Generate Button */}
              {tasks.length > 0 && (
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">Prêt à visualiser ?</h2>
                    <p className="text-slate-600 mb-8">Générez vos diagrammes de Gantt et PERT pour analyser votre projet</p>

                    <button
                      onClick={generateDiagrams}
                      className="inline-flex items-center gap-4 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 text-white py-6 px-12 rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-emerald-700 transition-all duration-500 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 group"
                    >
                      <Play className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      Générer les diagrammes
                      <div className="flex gap-2">
                        <Calendar className="w-5 h-5" />
                        <Network className="w-5 h-5" />
                      </div>
                    </button>

                    <div className="mt-6 flex items-center justify-center gap-8 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Planification Gantt</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                        <span>Analyse PERT</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}