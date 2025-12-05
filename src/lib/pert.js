export class PERTAlgorithm {
    constructor(tasks) {
      this.tasks = tasks;
      this.nodes = new Map();
      this.edges = [];
      this.criticalPath = [];
    }

    calculate() {
      this.buildNetwork();
      this.calculateEarliestTimes();
      this.calculateLatestTimes();
      this.calculateSlacks();
      this.findCriticalPath();

      return {
        nodes: Array.from(this.nodes.values()),
        edges: this.edges,
        criticalPath: this.criticalPath,
        projectDuration: this.getProjectDuration()
      };
    }

    buildNetwork() {
      let nodeCounter = 1;

      // Créer le nœud de début
      this.nodes.set('start', {
        id: 'start',
        nodeNumber: 0,
        name: 'Début',
        earliestTime: 0,
        latestTime: 0,
        slack: 0,
        isCritical: false
      });

      // Créer les nœuds pour chaque événement unique
      const events = new Set();
      events.add('start');

      // Ajouter tous les événements de début et fin de tâches
      this.tasks.forEach(task => {
        if (task.dependencies.length === 0) {
          events.add('start');
        }
        task.dependencies.forEach(dep => {
          events.add(`after_${dep}`);
        });
        events.add(`after_${task.id}`);
      });

      // Créer les nœuds pour les événements
      events.forEach(eventId => {
        if (eventId !== 'start') {
          this.nodes.set(eventId, {
            id: eventId,
            nodeNumber: nodeCounter++,
            name: eventId,
            earliestTime: 0,
            latestTime: 0,
            slack: 0,
            isCritical: false
          });
        }
      });

      // Créer le nœud de fin
      this.nodes.set('end', {
        id: 'end',
        nodeNumber: nodeCounter,
        name: 'Fin',
        earliestTime: 0,
        latestTime: 0,
        slack: 0,
        isCritical: false
      });

      // Créer les arêtes pour les tâches
      this.tasks.forEach(task => {
        let fromNode;

        if (task.dependencies.length === 0) {
          fromNode = 'start';
        } else if (task.dependencies.length === 1) {
          fromNode = `after_${task.dependencies[0]}`;
        } else {
          // Pour les tâches avec plusieurs dépendances, créer un nœud de convergence
          const convergenceNodeId = `convergence_${task.id}`;
          this.nodes.set(convergenceNodeId, {
            id: convergenceNodeId,
            nodeNumber: nodeCounter++,
            name: `Convergence ${task.id}`,
            earliestTime: 0,
            latestTime: 0,
            slack: 0,
            isCritical: false
          });

          // Arêtes vides des dépendances vers le nœud de convergence
          task.dependencies.forEach(depId => {
            this.edges.push({
              from: `after_${depId}`,
              to: convergenceNodeId,
              task: null,
              duration: 0,
              isDummy: true,
              isCritical: false
            });
          });

          fromNode = convergenceNodeId;
        }

        // Arête de la tâche
        this.edges.push({
          from: fromNode,
          to: `after_${task.id}`,
          task: task,
          duration: task.duration,
          isDummy: false,
          isCritical: false
        });
      });

      // Connecter les tâches finales au nœud de fin
      const finalTasks = this.tasks.filter(task =>
        !this.tasks.some(t => t.dependencies.includes(task.id))
      );

      if (finalTasks.length === 1) {
        this.edges.push({
          from: `after_${finalTasks[0].id}`,
          to: 'end',
          task: null,
          duration: 0,
          isDummy: true,
          isCritical: false
        });
      } else if (finalTasks.length > 1) {
        const finalConvergenceId = 'final_convergence';
        this.nodes.set(finalConvergenceId, {
          id: finalConvergenceId,
          nodeNumber: nodeCounter++,
          name: 'Convergence Finale',
          earliestTime: 0,
          latestTime: 0,
          slack: 0,
          isCritical: false
        });

        finalTasks.forEach(task => {
          this.edges.push({
            from: `after_${task.id}`,
            to: finalConvergenceId,
            task: null,
            duration: 0,
            isDummy: true,
            isCritical: false
          });
        });

        this.edges.push({
          from: finalConvergenceId,
          to: 'end',
          task: null,
          duration: 0,
          isDummy: true,
          isCritical: false
        });
      }
    }

    calculateEarliestTimes() {
      const visited = new Set();

      const calculate = (nodeId) => {
        if (visited.has(nodeId)) return this.nodes.get(nodeId)?.earliestTime || 0;

        visited.add(nodeId);
        const node = this.nodes.get(nodeId);

        if (!node) return 0;

        if (nodeId === 'start') {
          node.earliestTime = 0;
          return 0;
        }

        let maxEarliest = 0;
        this.edges.forEach(edge => {
          if (edge.to === nodeId) {
            const fromEarliest = calculate(edge.from);
            maxEarliest = Math.max(maxEarliest, fromEarliest + edge.duration);
          }
        });

        node.earliestTime = maxEarliest;
        return maxEarliest;
      };

      this.nodes.forEach((node, nodeId) => {
        calculate(nodeId);
      });
    }

    calculateLatestTimes() {
      const endNode = this.nodes.get('end');
      if (!endNode) return;

      const projectDuration = endNode.earliestTime;
      endNode.latestTime = projectDuration;

      const visited = new Set();

      const calculate = (nodeId) => {
        if (visited.has(nodeId)) return this.nodes.get(nodeId)?.latestTime || 0;

        visited.add(nodeId);
        const node = this.nodes.get(nodeId);

        if (!node) return 0;

        if (nodeId === 'end') {
          return node.latestTime;
        }

        let minLatest = Infinity;
        this.edges.forEach(edge => {
          if (edge.from === nodeId) {
            const toLatest = calculate(edge.to);
            minLatest = Math.min(minLatest, toLatest - edge.duration);
          }
        });

        node.latestTime = minLatest === Infinity ? node.earliestTime : minLatest;
        return node.latestTime;
      };

      this.nodes.forEach((node, nodeId) => {
        calculate(nodeId);
      });
    }

    calculateSlacks() {
      this.nodes.forEach(node => {
        node.slack = node.latestTime - node.earliestTime;
        node.isCritical = node.slack === 0;
      });

      this.edges.forEach(edge => {
        const fromNode = this.nodes.get(edge.from);
        const toNode = this.nodes.get(edge.to);
        if (fromNode && toNode) {
          const totalSlack = toNode.latestTime - fromNode.earliestTime - edge.duration;
          edge.slack = totalSlack;
          edge.isCritical = totalSlack === 0;
        }
      });
    }

    findCriticalPath() {
      this.criticalPath = [];

      const findPath = (currentNode, path) => {
        if (currentNode === 'end') {
          this.criticalPath = [...path];
          return true;
        }

        for (const edge of this.edges) {
          if (edge.from === currentNode && edge.isCritical) {
            if (findPath(edge.to, [...path, edge])) {
              return true;
            }
          }
        }

        return false;
      };

      findPath('start', []);
    }

    getProjectDuration() {
      const endNode = this.nodes.get('end');
      return endNode ? endNode.earliestTime : 0;
    }

    getTaskMetrics() {
      return this.tasks.map(task => {
        const taskEdge = this.edges.find(e => e.task && e.task.id === task.id);
        const fromNode = taskEdge ? this.nodes.get(taskEdge.from) : null;
        const toNode = taskEdge ? this.nodes.get(taskEdge.to) : null;

        return {
          id: task.id,
          name: task.name,
          duration: task.duration,
          earliestStart: fromNode ? fromNode.earliestTime : 0,
          latestStart: fromNode ? fromNode.latestTime : 0,
          earliestFinish: toNode ? toNode.earliestTime : 0,
          latestFinish: toNode ? toNode.latestTime : 0,
          totalSlack: fromNode ? fromNode.slack : 0,
          freeSlack: this.calculateFreeSlack(task.id),
          isCritical: taskEdge ? taskEdge.isCritical : false
        };
      });
    }

    calculateFreeSlack(taskId) {
      const taskEdge = this.edges.find(e => e.task && e.task.id === taskId);
      if (!taskEdge) return 0;

      const toNode = this.nodes.get(taskEdge.to);
      if (!toNode) return 0;

      let minSuccessorStart = Infinity;

      this.edges.forEach(edge => {
        if (edge.from === taskEdge.to) {
          const successorNode = this.nodes.get(edge.to);
          if (successorNode) {
            minSuccessorStart = Math.min(minSuccessorStart, successorNode.earliestTime);
          }
        }
      });

      return minSuccessorStart === Infinity ? 0 : minSuccessorStart - toNode.earliestTime;
    }

    // Méthodes utilitaires pour l'affichage

    /**
     * Calcule les positions des nœuds pour un layout en niveaux
     * @param {number} nodeSpacing - Espacement vertical entre les nœuds
     * @param {number} levelSpacing - Espacement horizontal entre les niveaux
     * @returns {Map} Map des positions des nœuds {x, y}
     */
    calculateNodePositions(nodeSpacing = 120, levelSpacing = 200) {
      const positions = new Map();
      const levels = new Map();

      // Calculer les niveaux (distance depuis le début)
      const calculateLevel = (nodeId, level = 0) => {
        if (levels.has(nodeId)) return levels.get(nodeId);

        levels.set(nodeId, level);

        this.edges.forEach(edge => {
          if (edge.from === nodeId) {
            calculateLevel(edge.to, level + 1);
          }
        });

        return level;
      };

      calculateLevel('start');

      // Grouper par niveau
      const nodesByLevel = new Map();
      levels.forEach((level, nodeId) => {
        if (!nodesByLevel.has(level)) {
          nodesByLevel.set(level, []);
        }
        nodesByLevel.get(level).push(nodeId);
      });

      // Calculer les positions
      nodesByLevel.forEach((nodes, level) => {
        nodes.forEach((nodeId, index) => {
          const x = level * levelSpacing + 100;
          const y = (index - (nodes.length - 1) / 2) * nodeSpacing + 300;
          positions.set(nodeId, { x, y });
        });
      });

      return positions;
    }

    /**
     * Retourne les dimensions recommandées pour le SVG
     * @param {Map} positions - Positions des nœuds
     * @returns {Object} {width, height}
     */
    getSVGDimensions(positions) {
      const maxX = Math.max(...Array.from(positions.values()).map(p => p.x));
      const maxY = Math.max(...Array.from(positions.values()).map(p => p.y));
      const minY = Math.min(...Array.from(positions.values()).map(p => p.y));

      return {
        width: maxX + 200,
        height: maxY - minY + 200
      };
    }

    /**
     * Exporte les données complètes du PERT
     * @returns {Object} Toutes les données calculées
     */
    exportData() {
      const result = this.calculate();
      return {
        ...result,
        taskMetrics: this.getTaskMetrics(),
        nodePositions: this.calculateNodePositions(),
        svgDimensions: this.getSVGDimensions(this.calculateNodePositions())
      };
    }
  }