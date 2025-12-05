export class GanttAlgorithm {
    constructor(tasks) {
      this.tasks = tasks;
      this.schedule = [];
      this.criticalTasks = [];
    }

    calculate() {
      this.buildSchedule();
      this.findCriticalPath();

      return {
        schedule: this.schedule,
        criticalTasks: this.criticalTasks,
        projectDuration: this.getProjectDuration(),
        taskMetrics: this.getTaskMetrics()
      };
    }

    buildSchedule() {
      const taskMap = new Map(this.tasks.map(task => [task.id, { ...task }]));
      const scheduled = new Map();

      // Calculer les dates de début au plus tôt
      const calculateEarliestStart = (taskId, visited = new Set()) => {
        if (visited.has(taskId)) {
          throw new Error(`Dépendance circulaire détectée pour la tâche ${taskId}`);
        }

        if (scheduled.has(taskId)) {
          return scheduled.get(taskId);
        }

        visited.add(taskId);
        const task = taskMap.get(taskId);

        if (!task) {
          throw new Error(`Tâche ${taskId} introuvable`);
        }

        let earliestStart = 0;

        if (task.dependencies && task.dependencies.length > 0) {
          for (const depId of task.dependencies) {
            const depSchedule = calculateEarliestStart(depId, new Set(visited));
            earliestStart = Math.max(earliestStart, depSchedule.end);
          }
        }

        const scheduleItem = {
          id: task.id,
          name: task.name,
          duration: task.duration,
          start: earliestStart,
          end: earliestStart + task.duration,
          dependencies: task.dependencies || [],
          isCritical: false,
          color: this.generateTaskColor(task.id)
        };

        scheduled.set(taskId, scheduleItem);
        visited.delete(taskId);

        return scheduleItem;
      };

      // Programmer toutes les tâches
      this.tasks.forEach(task => {
        calculateEarliestStart(task.id);
      });

      this.schedule = Array.from(scheduled.values()).sort((a, b) => a.start - b.start);
    }

    findCriticalPath() {
      const projectDuration = this.getProjectDuration();
      const taskMap = new Map(this.schedule.map(task => [task.id, task]));

      // Calculer les dates de fin au plus tard
      const calculateLatestFinish = (taskId, visited = new Set()) => {
        if (visited.has(taskId)) return;

        visited.add(taskId);
        const task = taskMap.get(taskId);

        if (!task.latestFinish) {
          // Trouver les successeurs
          const successors = this.schedule.filter(t =>
            t.dependencies && t.dependencies.includes(taskId)
          );

          if (successors.length === 0) {
            // Tâche finale
            task.latestFinish = projectDuration;
          } else {
            let minSuccessorLatestStart = Infinity;

            successors.forEach(successor => {
              calculateLatestFinish(successor.id, new Set(visited));
              const successorLatestStart = successor.latestFinish - successor.duration;
              minSuccessorLatestStart = Math.min(minSuccessorLatestStart, successorLatestStart);
            });

            task.latestFinish = minSuccessorLatestStart;
          }

          task.latestStart = task.latestFinish - task.duration;
          task.totalSlack = task.latestStart - task.start;
          task.isCritical = task.totalSlack === 0;
        }
      };

      // Calculer pour toutes les tâches
      this.schedule.forEach(task => {
        calculateLatestFinish(task.id);
      });

      // Identifier les tâches critiques
      this.criticalTasks = this.schedule.filter(task => task.isCritical);
    }

    getProjectDuration() {
      return Math.max(...this.schedule.map(task => task.end));
    }

    getTaskMetrics() {
      return this.schedule.map(task => ({
        id: task.id,
        name: task.name,
        duration: task.duration,
        earliestStart: task.start,
        latestStart: task.latestStart || task.start,
        earliestFinish: task.end,
        latestFinish: task.latestFinish || task.end,
        totalSlack: task.totalSlack || 0,
        freeSlack: this.calculateFreeSlack(task.id),
        isCritical: task.isCritical || false
      }));
    }

    calculateFreeSlack(taskId) {
      const task = this.schedule.find(t => t.id === taskId);
      const successors = this.schedule.filter(t =>
        t.dependencies && t.dependencies.includes(taskId)
      );

      if (successors.length === 0) {
        return task.totalSlack || 0;
      }

      const minSuccessorStart = Math.min(...successors.map(s => s.start));
      return minSuccessorStart - task.end;
    }

    generateTaskColor(taskId) {
      // Générer une couleur unique pour chaque tâche
      const colors = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
        '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
      ];

      const hash = taskId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return colors[hash % colors.length];
    }

    exportToCSV() {
      const headers = ['Tâche', 'Durée', 'Début', 'Fin', 'Dépendances', 'Critique'];
      const rows = this.schedule.map(task => [
        task.name,
        task.duration,
        task.start,
        task.end,
        task.dependencies.join(';'),
        task.isCritical ? 'Oui' : 'Non'
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }